import { NextRequest, NextResponse } from 'next/server';
import { dbJobs, dbPages } from '@/lib/db';
import { generateWikiPage, answerQuestion, generateFromSelection } from '@/lib/ai-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the job
    const job = dbJobs.getById(id);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if job is already processing or completed
    if (job.status === 'processing') {
      return NextResponse.json(
        { error: 'Job is already being processed' },
        { status: 409 }
      );
    }

    if (job.status === 'completed') {
      return NextResponse.json(job);
    }

    // Update job status to processing
    dbJobs.updateStatus(id, 'processing');

    try {
      let result;

      // Process the job based on type
      switch (job.type) {
        case 'wiki_page':
          if (!job.input.topic) {
            throw new Error('Missing topic for wiki_page job');
          }
          result = await generateWikiPage({
            topic: job.input.topic,
            parentId: job.input.parentId
          });
          break;

        case 'question':
          if (!job.input.question || !job.input.currentPageContent) {
            throw new Error('Missing question or currentPageContent for question job');
          }
          // Create a minimal WikiPage object from the content
          const currentPage = {
            id: job.input.parentId || 'unknown',
            title: 'Current Page',
            content: job.input.currentPageContent,
            relatedTopics: [],
            suggestedQuestions: [],
            createdAt: Date.now(),
            parentId: job.input.parentId
          };
          result = await answerQuestion(job.input.question, currentPage);
          break;

        case 'selection':
          if (!job.input.selectedText || !job.input.context || !job.input.parentId) {
            throw new Error('Missing selectedText, context, or parentId for selection job');
          }
          // We need the full current page for selection generation
          const parentPage = dbPages.getById(job.input.parentId);
          if (!parentPage) {
            throw new Error('Parent page not found for selection job');
          }
          result = await generateFromSelection(
            job.input.selectedText,
            job.input.context,
            parentPage
          );
          break;

        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Save the generated page to database
      dbPages.save(result);

      // Update job with result
      dbJobs.updateOutput(id, result);

      // Return the updated job
      const updatedJob = dbJobs.getById(id);
      return NextResponse.json(updatedJob);
    } catch (error) {
      // Update job status to failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dbJobs.updateStatus(id, 'failed', errorMessage);

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing job:', error);
    return NextResponse.json(
      { error: 'Failed to process job' },
      { status: 500 }
    );
  }
}
