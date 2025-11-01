import { NextRequest, NextResponse } from 'next/server';
import { dbJobs } from '@/lib/db';
import { GenerationJob, GenerationJobType, GenerationJobInput } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, input } = body as { type: GenerationJobType; input: GenerationJobInput };

    if (!type || !input) {
      return NextResponse.json(
        { error: 'Missing type or input' },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = `job-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const job: GenerationJob = {
      id: jobId,
      status: 'pending',
      type,
      input,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    dbJobs.save(job);

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const job = dbJobs.getById(id);
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(job);
    }

    // Return all jobs
    const jobs = dbJobs.getAll();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      dbJobs.deleteById(id);
      return NextResponse.json({ success: true });
    }

    // Delete all jobs
    dbJobs.deleteAll();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting jobs:', error);
    return NextResponse.json(
      { error: 'Failed to delete jobs' },
      { status: 500 }
    );
  }
}
