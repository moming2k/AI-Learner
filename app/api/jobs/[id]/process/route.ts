import { NextRequest, NextResponse } from 'next/server';
import { getDbJobs, getDbPages } from '@/lib/db';
import { getActiveDatabaseName } from '@/lib/database-context';
import { generateWikiPage, answerQuestion, generateFromSelection } from '@/lib/ai-service';
import { generateNotebookLmReport } from '@/lib/notebooklm-service';
import { checkAuth } from '@/lib/auth-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const dbName = await getActiveDatabaseName(request);
    const dbJobs = getDbJobs(dbName);
    const dbPages = getDbPages(dbName);

    const { id } = await params;

    const job = dbJobs.getById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status === 'processing') {
      return NextResponse.json({ error: 'Job is already being processed' }, { status: 409 });
    }

    if (job.status === 'completed') {
      return NextResponse.json(job);
    }

    dbJobs.updateStatus(id, 'processing');

    try {
      let result;

      switch (job.type) {
        case 'wiki_page':
          if (!job.input.topic) throw new Error('Missing topic for wiki_page job');
          result = await generateWikiPage({ topic: job.input.topic, parentId: job.input.parentId });
          break;
        case 'question': {
          if (!job.input.question || !job.input.currentPageContent) {
            throw new Error('Missing question or currentPageContent for question job');
          }
          const currentPage = {
            id: job.input.parentId || 'unknown',
            title: 'Current Page',
            content: job.input.currentPageContent,
            relatedTopics: [],
            suggestedQuestions: [],
            createdAt: Date.now(),
            parentId: job.input.parentId,
          };
          result = await answerQuestion(job.input.question, currentPage);
          break;
        }
        case 'selection': {
          if (!job.input.selectedText || !job.input.context || !job.input.parentId) {
            throw new Error('Missing selectedText, context, or parentId for selection job');
          }
          const parentPage = dbPages.getById(job.input.parentId);
          if (!parentPage) throw new Error('Parent page not found for selection job');
          result = await generateFromSelection(job.input.selectedText, job.input.context, parentPage);
          break;
        }
        case 'notebooklm_report':
          result = await generateNotebookLmReport(job.input);
          break;
        default:
          throw new Error();
      }

      dbPages.save(result);
      dbJobs.updateOutput(id, result);
      const updatedJob = dbJobs.getById(id);
      return NextResponse.json(updatedJob);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dbJobs.updateStatus(id, 'failed', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing job:', error);
    return NextResponse.json({ error: 'Failed to process job' }, { status: 500 });
  }
}
