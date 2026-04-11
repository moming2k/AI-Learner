import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { requireAdminUser } from '@/lib/admin-guard';

const execFileAsync = promisify(execFile);
const ENV_PATH = '/home/openclaw-project/AI-Learner/.env.local';
const SERVICE_NAME = 'ai-learner';

export const dynamic = 'force-dynamic';

async function getOpenAiKeyStatus(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('python3', ['-c', `
from pathlib import Path
path = Path(${JSON.stringify(ENV_PATH)})
if not path.exists():
    print('missing')
else:
    text = path.read_text()
    present = any(line.startswith('OPENAI_API_KEY=') and line.split('=', 1)[1].strip() for line in text.splitlines())
    print('present' if present else 'missing')
`]);
    return stdout.trim() === 'present';
  } catch {
    return false;
  }
}

export async function GET() {
  const { error } = await requireAdminUser();
  if (error) return error;

  const configured = await getOpenAiKeyStatus();
  return NextResponse.json({ configured });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdminUser();
  if (error) return error;

  try {
    const body = await request.json();
    const openaiApiKey = typeof body?.openaiApiKey === 'string' ? body.openaiApiKey.trim() : '';

    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is required' }, { status: 400 });
    }

    await execFileAsync('python3', ['-c', `
from pathlib import Path
path = Path(${JSON.stringify(ENV_PATH)})
key = ${JSON.stringify(openaiApiKey)}
lines = []
if path.exists():
    lines = path.read_text().splitlines()
updated = False
new_lines = []
for line in lines:
    if line.startswith('OPENAI_API_KEY='):
        new_lines.append('OPENAI_API_KEY=' + key)
        updated = True
    else:
        new_lines.append(line)
if not updated:
    new_lines.append('OPENAI_API_KEY=' + key)
path.write_text('\\n'.join(new_lines) + '\\n')
`]);

    await execFileAsync('sudo', ['systemctl', 'restart', SERVICE_NAME]);

    console.log(`[admin-openai-key] Updated by ${user?.email ?? 'unknown'}`);

    return NextResponse.json({ ok: true, restarted: true });
  } catch (err) {
    console.error('Failed to update OPENAI_API_KEY:', err);
    return NextResponse.json({ error: 'Failed to update OPENAI_API_KEY' }, { status: 500 });
  }
}
