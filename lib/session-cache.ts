import { AuthSession } from './types';
import { dbAuthSessions } from './db';

/**
 * In-memory session cache for fast, non-blocking session validation in middleware.
 * This prevents synchronous database calls that can block request processing.
 */
class SessionCache {
  private cache: Map<string, AuthSession>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private lastCleanup: number;

  constructor() {
    this.cache = new Map();
    this.lastCleanup = Date.now();
  }

  /**
   * Gets a session from cache, falls back to database on cache miss
   */
  get(sessionId: string): AuthSession | null {
    // Check cache first
    const cached = this.cache.get(sessionId);
    if (cached) {
      return cached;
    }

    // On cache miss, load from database and cache it
    const session = dbAuthSessions.getById(sessionId);
    if (session) {
      this.cache.set(sessionId, session);
    }

    return session;
  }

  /**
   * Updates a session in the cache
   */
  set(sessionId: string, session: AuthSession): void {
    this.cache.set(sessionId, session);
  }

  /**
   * Removes a session from cache
   */
  delete(sessionId: string): void {
    this.cache.delete(sessionId);
  }

  /**
   * Updates last active timestamp for a session in cache
   * Schedules a database update asynchronously to avoid blocking
   */
  updateLastActive(sessionId: string, timestamp: number): void {
    const session = this.cache.get(sessionId);
    if (session) {
      session.lastActiveAt = timestamp;
      this.cache.set(sessionId, session);
      
      // Schedule database update asynchronously (non-blocking)
      this.scheduleDatabaseUpdate(sessionId, timestamp);
    }
  }

  /**
   * Schedules a database update without blocking
   */
  private scheduleDatabaseUpdate(sessionId: string, timestamp: number): void {
    // Use setImmediate to defer the database update to the next event loop iteration
    setImmediate(() => {
      try {
        dbAuthSessions.updateLastActive(sessionId, timestamp);
      } catch (error) {
        console.error('Failed to update session in database:', error);
      }
    });
  }

  /**
   * Performs periodic cleanup of expired sessions
   * Should be called periodically but not on every request
   */
  cleanup(): void {
    const now = Date.now();
    
    // Only cleanup if it's been more than 5 minutes since last cleanup
    if (now - this.lastCleanup < this.CACHE_TTL) {
      return;
    }

    this.lastCleanup = now;

    // Remove expired sessions from cache
    for (const [sessionId, session] of this.cache.entries()) {
      if (session.expiresAt < now) {
        this.cache.delete(sessionId);
      }
    }

    // Schedule database cleanup asynchronously
    setImmediate(() => {
      try {
        dbAuthSessions.deleteExpired();
      } catch (error) {
        console.error('Failed to cleanup expired sessions in database:', error);
      }
    });
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const sessionCache = new SessionCache();
