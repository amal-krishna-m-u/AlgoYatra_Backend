import * as admin from 'firebase-admin';

/**
 * User roles in the platform
 */
export enum UserRole {
    CHALLENGER = 'CHALLENGER', // Regular user who participates in challenges
    MAINTAINER = 'MAINTAINER', // User who can create and manage challenges
    ADMIN = 'ADMIN'            // Administrator with full access
  }

/**
 * User data model
 * Represents a user in the platform
 */
export interface User {
    id: string;
    displayName: string;
    email: string;
    role: UserRole;
    totalPoints: number;
    joinedAt: admin.firestore.Timestamp;
    profileImageUrl?: string;
    githubUsername?: string;
    bio?: string;
    preferences?: UserPreferences;
    updatedAt?: admin.firestore.Timestamp;
  }

/**
 * User preferences
 */
export interface UserPreferences {
    emailNotifications: boolean;
    challengeReminders: boolean;
    profileVisibility: 'public' | 'private';
    theme: 'light' | 'dark' | 'system';
  }
  

/**
 * User data without ID - used for creating new users
 */
export type CreateUserData = Omit<User, 'id' | 'joinedAt' | 'totalPoints'> & {
  totalPoints?: number;
};

/**
 * User profile data for updates 
 * Restricts updating sensitive fields like role or points
 */
export type UpdateUserProfileData = Partial<{
  displayName: string;
  avatarUrl: string;
  bio: string;
  githubUsername: string;
  preferences: UserPreferences;
  updatedAt: admin.firestore.Timestamp;
}>;

/**
 * User filter options
 */
export interface UserFilters {
    role?: UserRole;
    searchTerm?: string;
  }
  