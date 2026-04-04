import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GenerationJobInput, WikiPage, NotebookLmSourceInput } from './types';

const execFileAsync = promisify(execFile);

const NOTEBOOKLM_BIN = process.env.NOTEBOOKLM_BIN || '/home/openclaw-project/.venvs/notebooklm/bin/notebooklm';
const NOTEBOOKLM_STORAGE = process.env.NOTEBOOKLM_STORAGE || '/home/openclaw-project/.notebooklm/storage_state.json';
const NOTEBOOKLM_ENABLED = process.env.NOTEBOOKLM_ENABLED === 'true';

type NotebookCreateResponse = {
  id?: string;
  notebook_id?: string;
  title?: string;
  notebook?: {
    id?: string;
    title?: string;
  };
};

type NotebookAskResponse = {
  answer?: string;
};

function sanitizeTitle(title?: string): string {
  const trimmed = title?.trim();
  return trimmed || 'NotebookLM Report';
}

function sanitizePrompt(prompt?: string): string {
  const trimmed = prompt?.trim();
  return trimmed || 'Summarize the provided sources into a concise research report.';
}

function uniqueTempPath(prefix: string, suffix: string): string {
  return `/tmp/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${suffix}`;
}

async function runNotebookLm(args: string[]): Promise<string> {
  const { stdout, stderr } = await execFileAsync(NOTEBOOKLM_BIN, ['--storage', NOTEBOOKLM_STORAGE, ...args], {
    timeout: 1000 * 60 * 8,
    maxBuffer: 1024 * 1024 * 8,
  });

  if (stderr?.trim()) {
    console.warn('NotebookLM stderr:', stderr.trim());
  }

  return stdout;
}

async function runNotebookLmJson<T>(args: string[]): Promise<T> {
  const stdout = await runNotebookLm(args);
  return JSON.parse(stdout) as T;
}

async function createNotebook(title: string): Promise<{ id: string; title: string }> {
  const payload = await runNotebookLmJson<NotebookCreateResponse>(['create', title, '--json']);
  const id = payload.id || payload.notebook_id || payload.notebook?.id;
  const resolvedTitle = payload.title || payload.notebook?.title || title;

  if (!id) {
    throw new Error(`NotebookLM did not return a notebook id: ${JSON.stringify(payload)}`);
  }

  return {
    id,
    title: resolvedTitle,
  };
}

async function addSource(notebookId: string, source: NotebookLmSourceInput): Promise<void> {
  const args = ['source', 'add', '--json', '--notebook', notebookId];

  if (source.kind === 'url') {
    args.push('--type', 'url', source.value.trim());
  } else {
    args.push('--type', 'text');
    if (source.title?.trim()) {
      args.push('--title', source.title.trim());
    }
    args.push(source.value.trim());
  }

  await runNotebookLm(args);
}

async function generateReport(notebookId: string, prompt: string): Promise<void> {
  await runNotebookLm([
    'generate',
    'report',
    '--format',
    'custom',
    '--wait',
    '--json',
    '--notebook',
    notebookId,
    prompt,
  ]);
}

async function downloadLatestReport(notebookId: string): Promise<string> {
  const outputPath = uniqueTempPath('notebooklm-report', '.md');
  await runNotebookLm(['download', 'report', '--latest', '--notebook', notebookId, '--force', outputPath]);

  const { readFile } = await import('node:fs/promises');
  return readFile(outputPath, 'utf8');
}

async function askNotebook(notebookId: string, prompt: string): Promise<string> {
  const payload = await runNotebookLmJson<NotebookAskResponse>(['ask', '--json', '--notebook', notebookId, prompt]);
  return payload.answer?.trim() || '';
}

function buildFallbackContent(options: {
  notebookName: string;
  prompt: string;
  sources: NotebookLmSourceInput[];
  errorMessage: string;
}): string {
  return [
    `# ${options.notebookName}`,
    '',
    '> NotebookLM execution failed, but the request details were preserved.',
    '',
    `**Error:** ${options.errorMessage}`,
    '',
    '## Prompt',
    options.prompt,
    '',
    '## Sources',
    ...(options.sources.length
      ? options.sources.map((source, index) => `- ${source.title?.trim() || `${source.kind.toUpperCase()} source ${index + 1}`}: ${source.value.trim()}`)
      : ['- No sources provided.']),
  ].join('\n');
}

export async function generateNotebookLmReport(options: GenerationJobInput): Promise<WikiPage> {
  const notebookName = sanitizeTitle(options.notebooklmNotebookName || options.topic);
  const prompt = sanitizePrompt(options.notebooklmPrompt || options.question);
  const sources = (options.notebooklmSources || []).filter((source) => source.value?.trim());

  if (!NOTEBOOKLM_ENABLED) {
    throw new Error('NotebookLM integration is disabled. Set NOTEBOOKLM_ENABLED=true to enable it.');
  }

  try {
    const notebook = await createNotebook(notebookName);

    for (const source of sources) {
      await addSource(notebook.id, source);
    }

    let content = '';

    try {
      await generateReport(notebook.id, prompt);
      content = (await downloadLatestReport(notebook.id)).trim();
    } catch (reportError) {
      console.warn('NotebookLM report generation failed, falling back to ask:', reportError);
      content = await askNotebook(notebook.id, prompt);
    }

    if (!content) {
      throw new Error('NotebookLM returned an empty response.');
    }

    return {
      id: `page-notebooklm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${notebookName}`,
      content,
      relatedTopics: ['NotebookLM', 'research automation'],
      suggestedQuestions: [
        'What were the strongest supporting sources?',
        'What should we investigate next?',
        'Can we turn this into a study guide or briefing?',
      ],
      createdAt: Date.now(),
      parentId: options.parentId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown NotebookLM error';

    return {
      id: `page-notebooklm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${notebookName} (NotebookLM error)`,
      content: buildFallbackContent({
        notebookName,
        prompt,
        sources,
        errorMessage,
      }),
      relatedTopics: ['NotebookLM', 'integration failure'],
      suggestedQuestions: [
        'Was the NotebookLM notebook created successfully?',
        'Do the sources need to be simplified before import?',
        'Should we retry using ask instead of report generation?',
      ],
      createdAt: Date.now(),
      parentId: options.parentId,
    };
  }
}
