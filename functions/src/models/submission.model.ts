import * as admin from 'firebase-admin';

/**
 * Submission status
 */
export enum SubmissionStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    REVIEWED = 'REVIEWED'  // This is a general review status if needed
  }
  
/**
 * Submission data model
 * Represents a user's challenge submission
 */
/**
 * Model for a challenge submission
 */
export interface Submission {
    id: string;
    challengeId: string;
    userId: string;
    repositoryUrl: string;
    submittedAt: admin.firestore.Timestamp;
    status: SubmissionStatus;
    feedback?: string;
    reviewerId?: string;
    reviewedAt?: admin.firestore.Timestamp;
    language:string;
    points?: number; // Points earned for this submission
  }
/**
 * Submission data without ID - used for creating new submissions
 */
export type CreateSubmissionData = Omit<Submission, 'id' | 'status' | 'submittedAt' | 'feedback' | 'points' | 'reviewedBy' | 'reviewedAt'>;

/**
 * Review data for a submission
 */
export interface SubmissionReview {
  feedback: string;
  points: number;
  reviewerId: string; // User ID of the reviewer
}

/**
 * Submission filter options
 */
export interface SubmissionFilters {
  challengeId?: string;
  userId?: string;
  status?: SubmissionStatus;
}