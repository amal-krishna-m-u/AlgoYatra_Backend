import * as admin from 'firebase-admin';

/**
 * Challenge difficulty levels
 */
export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

/**
 * Challenge resource type
 */
export interface ChallengeResource {
  title: string;
  url: string;
  type: 'documentation' | 'video' | 'article' | 'github';
}

/**
 * Challenge data model
 * Represents a coding challenge in the platform
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  startDate: admin.firestore.Timestamp;
  endDate: admin.firestore.Timestamp;
  difficulty: ChallengeDifficulty;
  category: string;
  resources?: ChallengeResource[];
  points: number;
  active: boolean;
  createdBy: string; // User ID
  createdAt: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

/**
 * Challenge data without the ID - used for creating new challenges
 */
export type CreateChallengeData = Omit<Challenge, 'id' | 'createdAt'>;

/**
 * Challenge data for updates - allows partial updates
 */
export type UpdateChallengeData = Partial<Omit<Challenge, 'id' | 'createdAt' | 'createdBy'>> & {
  updatedAt: admin.firestore.Timestamp;
};

/**
 * Challenge filter options
 */
export interface ChallengeFilters {
  category?: string;
  difficulty?: ChallengeDifficulty;
  activeOnly?: boolean;
  upcoming?: boolean;
  search?: string;
}