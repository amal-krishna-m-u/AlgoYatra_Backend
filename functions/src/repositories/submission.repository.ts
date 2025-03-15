import { BaseRepository } from './base.repository';
import { Submission, SubmissionFilters, SubmissionStatus } from '../models/submission.model';

/**
 * Repository for submission data access
 */
export class SubmissionRepository extends BaseRepository<Submission> {
  /**
   * Creates a new submission repository
   */
  constructor() {
    super('submissions');
  }
  
  /**
   * Find submissions with optional filters
   * @param filters Optional filters to apply
   * @param limit Maximum number of submissions to return
   * @returns Array of filtered submissions
   */
  async findSubmissions(filters: SubmissionFilters = {}, limit = 50): Promise<Submission[]> {
    return this.query(query => {
      let q = query;
      
      // Filter by challenge ID
      if (filters.challengeId) {
        q = q.where('challengeId', '==', filters.challengeId);
      }
      
      // Filter by user ID
      if (filters.userId) {
        q = q.where('userId', '==', filters.userId);
      }
      
      // Filter by status
      if (filters.status) {
        q = q.where('status', '==', filters.status);
      }
      
      // Order by submission date (newest first)
      q = q.orderBy('submittedAt', 'desc');
      
      return q;
    }, limit);
  }
  
  /**
   * Find submissions for a specific challenge
   * @param challengeId Challenge ID
   * @param limit Maximum number of submissions to return
   * @returns Array of submissions for the challenge
   */
  async findSubmissionsByChallenge(challengeId: string, limit = 50): Promise<Submission[]> {
    return this.query(query => {
      return query
        .where('challengeId', '==', challengeId)
        .orderBy('submittedAt', 'desc');
    }, limit);
  }
  
  /**
   * Find submissions by a specific user
   * @param userId User ID
   * @param limit Maximum number of submissions to return
   * @returns Array of submissions by the user
   */
  async findSubmissionsByUser(userId: string, limit = 50): Promise<Submission[]> {
    return this.query(query => {
      return query
        .where('userId', '==', userId)
        .orderBy('submittedAt', 'desc');
    }, limit);
  }
  
  /**
   * Find pending submissions awaiting review
   * @param limit Maximum number of submissions to return
   * @returns Array of pending submissions
   */
  async findPendingSubmissions(limit = 50): Promise<Submission[]> {
    return this.query(query => {
      return query
        .where('status', '==', SubmissionStatus.PENDING)
        .orderBy('submittedAt', 'asc'); // Oldest first for fair review order
    }, limit);
  }
  
  /**
   * Find reviewed submissions
   * @param limit Maximum number of submissions to return
   * @returns Array of reviewed submissions
   */
  async findReviewedSubmissions(limit = 50): Promise<Submission[]> {
    return this.query(query => {
      return query
        .where('status', '==', SubmissionStatus.REVIEWED)
        .orderBy('reviewedAt', 'desc');
    }, limit);
  }
  
  /**
   * Check if user has already submitted a solution for a challenge
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns True if user has submitted, false otherwise
   */
  async hasUserSubmitted(userId: string, challengeId: string): Promise<boolean> {
    const submissions = await this.query(query => {
      return query
        .where('userId', '==', userId)
        .where('challengeId', '==', challengeId)
        .limit(1);
    }, 1);
    
    return submissions.length > 0;
  }
  
  /**
   * Find submission by user for a specific challenge
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns Submission or null if not found
   */
  async findUserChallengeSubmission(userId: string, challengeId: string): Promise<Submission | null> {
    const submissions = await this.query(query => {
      return query
        .where('userId', '==', userId)
        .where('challengeId', '==', challengeId)
        .limit(1);
    }, 1);
    
    return submissions.length > 0 ? submissions[0] : null;
  }
  
  /**
   * Get submission statistics
   * @returns Statistics about submissions
   */
  async getStats(): Promise<{
    totalSubmissions: number;
    pendingSubmissions: number;
    reviewedSubmissions: number;
  }> {
    const [totalCount, pendingCount, reviewedCount] = await Promise.all([
      this.count(),
      this.count(query => query.where('status', '==', SubmissionStatus.PENDING)),
      this.count(query => query.where('status', '==', SubmissionStatus.REVIEWED))
    ]);
    
    return {
      totalSubmissions: totalCount,
      pendingSubmissions: pendingCount,
      reviewedSubmissions: reviewedCount
    };
  }
}