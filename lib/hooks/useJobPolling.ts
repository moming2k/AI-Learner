'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GenerationJob, WikiPage } from '@/lib/types';
import { storage } from '@/lib/storage';

export interface UseJobPollingOptions {
  pollingInterval?: number; // in milliseconds, default 1000
  maxRetries?: number; // max number of retries on error, default 3
  onComplete?: (page: WikiPage) => void;
  onError?: (error: Error) => void;
}

export interface UseJobPollingResult {
  job: GenerationJob | null;
  isLoading: boolean;
  error: Error | null;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
}

export function useJobPolling(options: UseJobPollingOptions = {}): UseJobPollingResult {
  const {
    pollingInterval = 1000,
    maxRetries = 3,
    onComplete,
    onError
  } = options;

  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const retriesRef = useRef(0);
  const isProcessingRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    jobIdRef.current = null;
    setIsLoading(false);
  }, []);

  const pollJob = useCallback(async (jobId: string) => {
    try {
      const jobData = await storage.getJob(jobId);

      if (!jobData) {
        throw new Error('Job not found');
      }

      setJob(jobData);
      retriesRef.current = 0; // Reset retries on successful fetch

      // If job is pending and hasn't been triggered to process, start processing
      if (jobData.status === 'pending' && !isProcessingRef.current) {
        isProcessingRef.current = true;
        // Trigger processing in the background
        storage.processJob(jobId).catch(err => {
          console.error('Error triggering job processing:', err);
        });
      }

      // Check if job is completed or failed
      if (jobData.status === 'completed') {
        stopPolling();
        if (jobData.output && onComplete) {
          onComplete(jobData.output);
        }
      } else if (jobData.status === 'failed') {
        stopPolling();
        const err = new Error(jobData.error || 'Job failed');
        setError(err);
        if (onError) {
          onError(err);
        }
      }
    } catch (err) {
      console.error('Error polling job:', err);

      retriesRef.current++;
      if (retriesRef.current >= maxRetries) {
        stopPolling();
        const error = err instanceof Error ? err : new Error('Failed to poll job');
        setError(error);
        if (onError) {
          onError(error);
        }
      }
    }
  }, [maxRetries, onComplete, onError, stopPolling]);

  const startPolling = useCallback((jobId: string) => {
    // Stop any existing polling
    stopPolling();

    // Reset state
    setJob(null);
    setError(null);
    setIsLoading(true);
    retriesRef.current = 0;
    isProcessingRef.current = false;
    jobIdRef.current = jobId;

    // Start polling immediately
    pollJob(jobId);

    // Set up interval for subsequent polls
    pollingIntervalRef.current = setInterval(() => {
      if (jobIdRef.current) {
        pollJob(jobIdRef.current);
      }
    }, pollingInterval);
  }, [pollJob, pollingInterval, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    job,
    isLoading,
    error,
    startPolling,
    stopPolling
  };
}
