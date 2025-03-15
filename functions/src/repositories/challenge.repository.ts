import * as admin from 'firebase-admin';
import { BaseRepository } from './base.repository';
import { Challenge, ChallengeDifficulty, ChallengeFilters } from '../models/challenge.model';

/**
 * Repository for challenge data access
 */
export class ChallengeRepository extends BaseRepository<Challenge> {
  /**
   * Creates a new challenge repository
   */
  constructor() {
    super('challenges');
  }
  
  /**
   * Find challenges with optional filters
   * @param filters Optional filters to apply
   * @param limit Maximum number of challenges to return
   * @returns Array of filtered challenges
   */
  async findChallenges(filters: ChallengeFilters = {}, limit = 50): Promise<Challenge[]> {
    return this.query(query => {
      let q = query;
      
      // Filter by active status
      if (filters.activeOnly) {
        q = q.where('active', '==', true);
      }
      
      // Filter by difficulty
      if (filters.difficulty) {
        q = q.where('difficulty', '==', filters.difficulty);
      }
      
      // Filter by category
      if (filters.category) {
        q = q.where('category', '==', filters.category);
      }
      
      // Filter upcoming challenges
      if (filters.upcoming) {
        const now = admin.firestore.Timestamp.now();
        q = q.where('startDate', '>', now);
      }
      
      // Order by start date (newest first)
      q = q.orderBy('startDate', 'desc');
      
      return q;
    }, limit);
  }
  
  /**
   * Find active challenges
   * @param limit Maximum number of challenges to return
   * @returns Array of active challenges
   */
  async findActiveChallenges(limit = 50): Promise<Challenge[]> {
    const now = admin.firestore.Timestamp.now();
    
    return this.query(query => {
      return query
        .where('active', '==', true)
        .where('startDate', '<=', now)
        .where('endDate', '>=', now)
        .orderBy('startDate', 'desc');
    }, limit);
  }
  
  /**
   * Find upcoming challenges
   * @param limit Maximum number of challenges to return
   * @returns Array of upcoming challenges
   */
  async findUpcomingChallenges(limit = 50): Promise<Challenge[]> {
    const now = admin.firestore.Timestamp.now();
    
    return this.query(query => {
      return query
        .where('active', '==', true)
        .where('startDate', '>', now)
        .orderBy('startDate', 'asc');
    }, limit);
  }
  
  /**
   * Find challenges by creator
   * @param userId User ID of the creator
   * @param limit Maximum number of challenges to return
   * @returns Array of challenges created by the user
   */
  async findChallengesByCreator(userId: string, limit = 50): Promise<Challenge[]> {
    return this.query(query => {
      return query
        .where('createdBy', '==', userId)
        .orderBy('createdAt', 'desc');
    }, limit);
  }
  
  /**
   * Find challenges by difficulty
   * @param difficulty Difficulty level
   * @param activeOnly Whether to include only active challenges
   * @param limit Maximum number of challenges to return
   * @returns Array of challenges matching the difficulty
   */
  async findChallengesByDifficulty(
    difficulty: ChallengeDifficulty,
    activeOnly = true,
    limit = 50
  ): Promise<Challenge[]> {
    return this.query(query => {
      let q = query.where('difficulty', '==', difficulty);
      
      if (activeOnly) {
        q = q.where('active', '==', true);
      }
      
      return q.orderBy('createdAt', 'desc');
    }, limit);
  }
  
  /**
   * Search challenges by title or description
   * @param searchTerm Search term
   * @param limit Maximum number of challenges to return
   * @returns Array of challenges matching the search
   */
  async searchChallenges(searchTerm: string, limit = 50): Promise<Challenge[]> {
    // Convert search term to lowercase for case-insensitive search
    const searchTermLower = searchTerm.toLowerCase();
    
    // Get all challenges (within limit) and filter in memory
    // Note: This is a simple approach, for production use consider Algolia or ElasticSearch
    const challenges = await this.query(query => {
      return query.orderBy('createdAt', 'desc');
    }, limit * 3); // Get more to allow for filtering
    
    // Filter challenges that match search term in title or description
    const filteredChallenges = challenges.filter(challenge => {
      return (
        challenge.title.toLowerCase().includes(searchTermLower) ||
        challenge.description.toLowerCase().includes(searchTermLower)
      );
    });
    
    // Limit results
    return filteredChallenges.slice(0, limit);
  }
  
  /**
   * Get distinct categories from all challenges
   * @returns Array of unique categories
   */
  async getCategories(): Promise<string[]> {
    const challenges = await this.query(query => {
      return query.select('category');
    }, 1000);
    
    // Extract unique categories
    const categoriesSet = new Set<string>();
    challenges.forEach(challenge => {
      if (challenge.category) {
        categoriesSet.add(challenge.category);
      }
    });
    
    return Array.from(categoriesSet);
  }
}