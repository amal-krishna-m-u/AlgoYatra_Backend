import * as admin from 'firebase-admin';
import { ChallengeRepository } from '../repositories/challenge.repository';
import { Challenge, ChallengeDifficulty, ChallengeFilters } from '../models/challenge.model';
import { DateHelpers } from '../utils/date-helpers';

/**
 * Business logic for challenges
 */
export class ChallengeService {
  private challengeRepo: ChallengeRepository;
  
  constructor() {
    this.challengeRepo = new ChallengeRepository();
  }
  
  /**
   * Create a new challenge
   * @param data Challenge data
   * @param creatorId ID of the creator
   * @returns Created challenge
   */
  async createChallenge(
    data: Omit<Challenge, 'id' | 'createdAt' | 'createdBy'>, 
    creatorId: string
  ): Promise<Challenge> {
    // Add metadata
    const challengeData = {
      ...data,
      createdBy: creatorId,
      createdAt: DateHelpers.now(),
    };
    
    // Create challenge in repository
    return this.challengeRepo.create(challengeData);
  }
  
  /**
   * Get a challenge by ID
   * @param id Challenge ID
   * @returns Challenge or null if not found
   */
  async getChallengeById(id: string): Promise<Challenge | null> {
    return this.challengeRepo.findById(id);
  }
  
  /**
   * Update a challenge
   * @param id Challenge ID
   * @param data Updated data
   * @returns Updated challenge
   */
  async updateChallenge(id: string, data: Partial<Omit<Challenge, 'id' | 'createdAt' | 'createdBy'>>): Promise<Challenge | null> {
    // Update with timestamp
    const updateData = {
      ...data,
      updatedAt: DateHelpers.now()
    };
    
    // Update in repository
    await this.challengeRepo.update(id, updateData);
    
    // Get updated challenge
    return this.challengeRepo.findById(id);
  }
  
  /**
   * Get challenges with filters
   * @param filters Challenge filters
   * @param limit Maximum number of challenges to return
   * @returns Filtered challenges
   */
  async getChallenges(filters: ChallengeFilters = {}, limit = 50): Promise<Challenge[]> {
    return this.challengeRepo.findChallenges(filters, limit);
  }
  
  /**
   * Get active challenges
   * @param limit Maximum number of challenges to return
   * @returns Active challenges
   */
  async getActiveChallenges(limit = 50): Promise<Challenge[]> {
    return this.challengeRepo.findActiveChallenges(limit);
  }
  
  /**
   * Get upcoming challenges
   * @param limit Maximum number of challenges to return
   * @returns Upcoming challenges
   */
  async getUpcomingChallenges(limit = 50): Promise<Challenge[]> {
    return this.challengeRepo.findUpcomingChallenges(limit);
  }
  
  /**
   * Toggle challenge active status
   * @param id Challenge ID
   * @param active New active status
   * @returns Updated challenge
   */
  async toggleChallengeActive(id: string, active: boolean): Promise<Challenge | null> {
    await this.challengeRepo.update(id, { 
      active, 
      updatedAt: DateHelpers.now()
    });
    
    return this.challengeRepo.findById(id);
  }
  
  /**
   * Delete a challenge
   * @param id Challenge ID
   */
  async deleteChallenge(id: string): Promise<void> {
    await this.challengeRepo.delete(id);
  }
  
  /**
   * Search challenges by term
   * @param searchTerm Search term
   * @param limit Maximum number of challenges to return
   * @returns Challenges matching the search term
   */
  async searchChallenges(searchTerm: string, limit = 50): Promise<Challenge[]> {
    return this.challengeRepo.searchChallenges(searchTerm, limit);
  }
  
  /**
   * Get distinct challenge categories
   * @returns Array of unique categories
   */
  async getCategories(): Promise<string[]> {
    return this.challengeRepo.getCategories();
  }
  
  /**
   * Check if challenge is currently active
   * @param challenge Challenge to check
   * @returns True if challenge is active and in date range
   */
  isActiveChallenge(challenge: Challenge): boolean {
    const now = DateHelpers.now();
    
    return (
      challenge.active &&
      DateHelpers.isBetween(now, challenge.startDate, challenge.endDate)
    );
  }
  
  /**
   * Get time remaining for a challenge
   * @param challenge Challenge to check
   * @returns Time remaining object or null if challenge ended
   */
  getTimeRemaining(challenge: Challenge): { days: number; hours: number; minutes: number; } | null {
    const now = DateHelpers.now();
    
    // Challenge already ended
    if (challenge.endDate.toMillis() < now.toMillis()) {
      return null;
    }
    
    return DateHelpers.timeRemaining(challenge.endDate);
  }
  
  /**
   * Extend a challenge end date
   * @param id Challenge ID
   * @param days Days to extend
   * @returns Updated challenge
   */
  async extendChallengeDeadline(id: string, days: number): Promise<Challenge | null> {
    // Get the challenge
    const challenge = await this.challengeRepo.findById(id);
    
    if (!challenge) {
      return null;
    }
    
    // Calculate new end date
    const currentEndDate = challenge.endDate.toDate();
    currentEndDate.setDate(currentEndDate.getDate() + days);
    const newEndDate = admin.firestore.Timestamp.fromDate(currentEndDate);
    
    // Update challenge
    await this.challengeRepo.update(id, { 
      endDate: newEndDate,
      updatedAt: DateHelpers.now()
    });
    
    return this.challengeRepo.findById(id);
  }
  
  /**
   * Get challenges created by a specific user
   * @param userId User ID
   * @param limit Maximum number of challenges to return
   * @returns Challenges created by the user
   */
  async getChallengesByCreator(userId: string, limit = 50): Promise<Challenge[]> {
    return this.challengeRepo.findChallengesByCreator(userId, limit);
  }
  
  /**
   * Get challenges by difficulty level
   * @param difficulty Difficulty level to filter by
   * @param limit Maximum number of challenges to return
   * @returns Challenges of the specified difficulty
   */
  async getChallengesByDifficulty(difficulty: ChallengeDifficulty, limit = 50): Promise<Challenge[]> {
    // The issue was here - the third parameter needs to be a boolean for active challenges only
    return this.challengeRepo.findChallengesByDifficulty(difficulty, true, limit);
  }
  
  /**
   * Format challenge difficulty for display
   * @param difficulty Difficulty level
   * @returns Human-readable difficulty string
   */
  formatDifficultyForDisplay(difficulty: ChallengeDifficulty): string {
    switch (difficulty) {
      case ChallengeDifficulty.EASY:
        return 'Easy';
      case ChallengeDifficulty.MEDIUM:
        return 'Medium';
      case ChallengeDifficulty.HARD:
        return 'Hard';
      case ChallengeDifficulty.EXPERT:
        return 'Expert';
      default:
        return 'Unknown';
    }
  }
}