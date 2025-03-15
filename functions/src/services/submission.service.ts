import { SubmissionRepository } from '../repositories/submission.repository';
import { UserRepository } from '../repositories/user.repository';
import { ChallengeRepository } from '../repositories/challenge.repository';
import { Submission, SubmissionStatus, SubmissionFilters } from '../models/submission.model';
import { Challenge } from '../models/challenge.model';
import { DateHelpers } from '../utils/date-helpers';

/**
 * Business logic for submissions
 */
export class SubmissionService {
  private submissionRepo: SubmissionRepository;
  private userRepo: UserRepository;
  private challengeRepo: ChallengeRepository;
  
  constructor() {
    this.submissionRepo = new SubmissionRepository();
    this.userRepo = new UserRepository();
    this.challengeRepo = new ChallengeRepository();
  }
  
  /**
   * Submit a solution for a challenge
   * @param data Submission data
   * @returns Created submission
   */
  async submitSolution(
    data: Omit<Submission, 'id' | 'submittedAt' | 'status'>
  ): Promise<Submission> {
    // Check if user has already submitted for this challenge
    const existingSubmission = await this.submissionRepo.findUserChallengeSubmission(
      data.userId,
      data.challengeId
    );
    
    if (existingSubmission) {
      throw new Error('User has already submitted a solution for this challenge');
    }
    
    // Check if challenge exists and is active
    const challenge = await this.challengeRepo.findById(data.challengeId);
    
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    if (!challenge.active) {
      throw new Error('Challenge is not active');
    }
    
    const now = DateHelpers.now();
    if (now.toMillis() > challenge.endDate.toMillis()) {
      throw new Error('Challenge has ended');
    }
    
    // Create submission with metadata
    const submissionData = {
      ...data,
      submittedAt: now,
      status: SubmissionStatus.PENDING
    };
    
    // Create submission in repository
    return this.submissionRepo.create(submissionData);
  }
  
  /**
   * Get a submission by ID
   * @param id Submission ID
   * @returns Submission or null if not found
   */
  async getSubmissionById(id: string): Promise<Submission | null> {
    return this.submissionRepo.findById(id);
  }
  
  /**
   * Get submissions with filters
   * @param filters Submission filters
   * @param limit Maximum number of submissions to return
   * @returns Filtered submissions
   */
  async getSubmissions(filters: SubmissionFilters = {}, limit = 50): Promise<Submission[]> {
    return this.submissionRepo.findSubmissions(filters, limit);
  }
  
  /**
   * Get submissions for a challenge
   * @param challengeId Challenge ID
   * @param limit Maximum number of submissions to return
   * @returns Challenge submissions
   */
  async getSubmissionsByChallenge(challengeId: string, limit = 50): Promise<Submission[]> {
    return this.submissionRepo.findSubmissionsByChallenge(challengeId, limit);
  }
  
  /**
   * Get submissions by a user
   * @param userId User ID
   * @param limit Maximum number of submissions to return
   * @returns User submissions
   */
  async getSubmissionsByUser(userId: string, limit = 50): Promise<Submission[]> {
    return this.submissionRepo.findSubmissionsByUser(userId, limit);
  }
  
  /**
   * Review a submission
   * @param id Submission ID
   * @param status New status (APPROVED or REJECTED)
   * @param feedback Review feedback
   * @param reviewerId ID of the reviewer
   * @returns Updated submission
   */
  async reviewSubmission(
    id: string,
    status: SubmissionStatus.APPROVED | SubmissionStatus.REJECTED,
    feedback: string,
    reviewerId: string
  ): Promise<Submission | null> {
    // Get submission
    const submission = await this.submissionRepo.findById(id);
    
    if (!submission) {
      throw new Error('Submission not found');
    }
    
    if (submission.status !== SubmissionStatus.PENDING) {
      throw new Error('Submission has already been reviewed');
    }
    
    // Get challenge
    const challenge = await this.challengeRepo.findById(submission.challengeId);
    
    if (!challenge) {
      throw new Error('Associated challenge not found');
    }
    
    // Update submission
    const now = DateHelpers.now();
    await this.submissionRepo.update(id, {
      status,
      feedback,
      reviewedAt: now,
      reviewerId // Added this field to the model
    } as Partial<Omit<Submission, 'id'>>); // Type assertion to handle the field
    
    // If approved, award points to user
    if (status === SubmissionStatus.APPROVED) {
      await this.userRepo.updateTotalPoints(submission.userId, challenge.points);
    }
    
    // Return updated submission
    return this.submissionRepo.findById(id);
  }
  
  /**
   * Get pending submissions
   * @param limit Maximum number of submissions to return
   * @returns Pending submissions
   */
  async getPendingSubmissions(limit = 50): Promise<Submission[]> {
    return this.submissionRepo.findPendingSubmissions(limit);
  }
  
  /**
   * Get reviewed submissions
   * @param limit Maximum number of submissions to return
   * @returns Reviewed submissions
   */
  async getReviewedSubmissions(limit = 50): Promise<Submission[]> {
    return this.submissionRepo.findReviewedSubmissions(limit);
  }
  
  /**
   * Check if user has submitted for a challenge
   * @param userId User ID
   * @param challengeId Challenge ID
   * @returns True if user has submitted, false otherwise
   */
  async hasUserSubmitted(userId: string, challengeId: string): Promise<boolean> {
    return this.submissionRepo.hasUserSubmitted(userId, challengeId);
  }
  
  /**
   * Get submission statistics
   * @returns Submission statistics
   */
  async getSubmissionStats(): Promise<{
    totalSubmissions: number;
    pendingSubmissions: number;
    reviewedSubmissions: number;
  }> {
    return this.submissionRepo.getStats();
  }
  
  /**
   * Get enriched submission with challenge and user details
   * @param submission Submission to enrich
   * @returns Enriched submission with challenge and user
   */
  async enrichSubmission(submission: Submission): Promise<{
    submission: Submission;
    challenge: Challenge | null;
    username: string;
  }> {
    // Get associated data
    const challenge = await this.challengeRepo.findById(submission.challengeId);
    const user = await this.userRepo.findById(submission.userId);
    
    return {
      submission,
      challenge,
      username: user ? user.displayName : 'Unknown User'
    };
  }
  
  /**
   * Get enriched submissions with challenge and user details
   * @param submissions Submissions to enrich
   * @returns Enriched submissions with challenge and user
   */
  async enrichSubmissions(submissions: Submission[]): Promise<Array<{
    submission: Submission;
    challenge: Challenge | null;
    username: string;
  }>> {
    return Promise.all(submissions.map(submission => this.enrichSubmission(submission)));
  }
}