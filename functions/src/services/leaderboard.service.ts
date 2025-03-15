import * as admin from 'firebase-admin';
import { UserRepository } from '../repositories/user.repository';
import { SubmissionRepository } from '../repositories/submission.repository';
import { User } from '../models/user.model';
import { SubmissionStatus } from '../models/submission.model';
import { DateHelpers } from '../utils/date-helpers';

/**
 * Business logic for leaderboards
 */
export class LeaderboardService {
  private userRepo: UserRepository;
  private submissionRepo: SubmissionRepository;
  
  constructor() {
    this.userRepo = new UserRepository();
    this.submissionRepo = new SubmissionRepository();
  }
  
  /**
   * Get overall leaderboard based on total points
   * @param limit Maximum number of users to return
   * @returns Top users by points
   */
  async getOverallLeaderboard(limit = 10): Promise<User[]> {
    return this.userRepo.findTopUsers(limit);
  }
  
  /**
   * Get weekly leaderboard based on submissions in the current week
   * @param limit Maximum number of users to return
   * @returns Weekly top users
   */
  async getWeeklyLeaderboard(limit = 10): Promise<Array<{
    user: User;
    weeklyPoints: number;
    weeklySubmissions: number;
  }>> {
    // Get start of week
    const startOfWeek = DateHelpers.getStartOfWeek();
    const now = DateHelpers.now();
    
    // Get all approved submissions for this week
    const allSubmissions = await this.submissionRepo.query(query => {
      return query
        .where('status', '==', SubmissionStatus.APPROVED)
        .where('reviewedAt', '>=', startOfWeek)
        .where('reviewedAt', '<=', now);
    });
    
    // Group submissions by user and calculate points
    const userPoints: Record<string, { points: number; submissionCount: number }> = {};
    
    for (const submission of allSubmissions) {
      // Skip if we don't have reviewedAt or a challenge reference
      if (!submission.reviewedAt || !submission.challengeId) {
        continue;
      }
      
      // Get challenge to determine points (if needed)
      const challengePoints = submission.points || 0;
      
      // Increment user points
      const userId = submission.userId;
      if (!userPoints[userId]) {
        userPoints[userId] = { points: 0, submissionCount: 0 };
      }
      
      userPoints[userId].points += challengePoints;
      userPoints[userId].submissionCount += 1;
    }
    
    // Get full user details for users with points
    const userIds = Object.keys(userPoints);
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Process in batches of 10 (Firestore in query limitation)
    const userLeaderboard: Array<{
      user: User;
      weeklyPoints: number;
      weeklySubmissions: number;
    }> = [];
    
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      const users = await this.userRepo.query(query => {
        return query.where(admin.firestore.FieldPath.documentId(), 'in', batch);
      });
      
      // Create leaderboard entries
      for (const user of users) {
        const stats = userPoints[user.id];
        userLeaderboard.push({
          user,
          weeklyPoints: stats.points,
          weeklySubmissions: stats.submissionCount
        });
      }
    }
    
    // Sort by points (highest first) and limit
    return userLeaderboard
      .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
      .slice(0, limit);
  }
  
  /**
   * Get monthly leaderboard based on submissions in the current month
   * @param limit Maximum number of users to return
   * @returns Monthly top users
   */
  async getMonthlyLeaderboard(limit = 10): Promise<Array<{
    user: User;
    monthlyPoints: number;
    monthlySubmissions: number;
  }>> {
    // Get start of month
    const startOfMonth = DateHelpers.getStartOfMonth();
    const now = DateHelpers.now();
    
    // Get all approved submissions for this month
    const allSubmissions = await this.submissionRepo.query(query => {
      return query
        .where('status', '==', SubmissionStatus.APPROVED)
        .where('reviewedAt', '>=', startOfMonth)
        .where('reviewedAt', '<=', now);
    });
    
    // Group submissions by user and calculate points
    const userPoints: Record<string, { points: number; submissionCount: number }> = {};
    
    for (const submission of allSubmissions) {
      // Skip if we don't have reviewedAt or a challenge reference
      if (!submission.reviewedAt || !submission.challengeId) {
        continue;
      }
      
      // Get challenge to determine points (if needed)
      const challengePoints = submission.points || 0;
      
      // Increment user points
      const userId = submission.userId;
      if (!userPoints[userId]) {
        userPoints[userId] = { points: 0, submissionCount: 0 };
      }
      
      userPoints[userId].points += challengePoints;
      userPoints[userId].submissionCount += 1;
    }
    
    // Get full user details for users with points
    const userIds = Object.keys(userPoints);
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Process in batches of 10 (Firestore in query limitation)
    const userLeaderboard: Array<{
      user: User;
      monthlyPoints: number;
      monthlySubmissions: number;
    }> = [];
    
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      const users = await this.userRepo.query(query => {
        return query.where(admin.firestore.FieldPath.documentId(), 'in', batch);
      });
      
      // Create leaderboard entries
      for (const user of users) {
        const stats = userPoints[user.id];
        userLeaderboard.push({
          user,
          monthlyPoints: stats.points,
          monthlySubmissions: stats.submissionCount
        });
      }
    }
    
    // Sort by points (highest first) and limit
    return userLeaderboard
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
      .slice(0, limit);
  }
  
  /**
   * Get challenge-specific leaderboard
   * @param challengeId Challenge ID
   * @param limit Maximum number of users to return
   * @returns Challenge leaderboard
   */
  async getChallengeLeaderboard(
    challengeId: string, 
    limit = 10
  ): Promise<Array<{
    user: User;
    submittedAt: admin.firestore.Timestamp;
  }>> {
    // Get all approved submissions for this challenge
    const submissions = await this.submissionRepo.query(query => {
      return query
        .where('challengeId', '==', challengeId)
        .where('status', '==', SubmissionStatus.APPROVED)
        .orderBy('submittedAt', 'asc');
    }, limit);
    
    // Early return if no submissions
    if (submissions.length === 0) {
      return [];
    }
    
    // Get user details for each submission
    const leaderboard: Array<{
      user: User;
      submittedAt: admin.firestore.Timestamp;
    }> = [];
    
    for (const submission of submissions) {
      const user = await this.userRepo.findById(submission.userId);
      
      if (user) {
        leaderboard.push({
          user,
          submittedAt: submission.submittedAt
        });
      }
    }
    
    return leaderboard;
  }
}