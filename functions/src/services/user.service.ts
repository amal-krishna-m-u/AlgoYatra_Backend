import * as admin from 'firebase-admin';
import { UserRepository } from '../repositories/user.repository';
import { User, UserRole, UserFilters, UserPreferences } from '../models/user.model';
import { DateHelpers } from '../utils/date-helpers';

/**
 * Business logic for users
 */
export class UserService {
  private userRepo: UserRepository;
  
  constructor() {
    this.userRepo = new UserRepository();
  }
  
  /**
   * Create a new user
   * @param data User data
   * @returns Created user
   */
  async createUser(data: Omit<User, 'id' | 'joinedAt' | 'totalPoints'>): Promise<User> {
    // Add metadata
    const userData = {
      ...data,
      joinedAt: DateHelpers.now(),
      totalPoints: 0
    };
    
    // Create user in repository
    return this.userRepo.create(userData);
  }
  
  /**
   * Get a user by ID
   * @param id User ID
   * @returns User or null if not found
   */
  async getUserById(id: string): Promise<User | null> {
    return this.userRepo.findById(id);
  }
  
  /**
   * Get a user by email
   * @param email User email
   * @returns User or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email);
  }
  
  /**
   * Update a user
   * @param id User ID
   * @param data Updated data
   * @returns Updated user
   */
  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'joinedAt' | 'totalPoints'>>): Promise<User | null> {
    // Update with timestamp
    const updateData = {
      ...data,
      updatedAt: DateHelpers.now()
    };
    
    // Update in repository
    await this.userRepo.update(id, updateData);
    
    // Get updated user
    return this.userRepo.findById(id);
  }
  
  /**
   * Update user role
   * @param id User ID
   * @param role New role
   * @returns Updated user
   */
  async updateUserRole(id: string, role: UserRole): Promise<User | null> {
    await this.userRepo.updateRole(id, role);
    return this.userRepo.findById(id);
  }
  
  /**
   * Get users with filters
   * @param filters User filters
   * @param limit Maximum number of users to return
   * @returns Filtered users
   */
  async getUsers(filters: UserFilters = {}, limit = 50): Promise<User[]> {
    return this.userRepo.findUsers(filters, limit);
  }
  
  /**
   * Get top users by points
   * @param limit Maximum number of users to return
   * @returns Top users
   */
  async getTopUsers(limit = 10): Promise<User[]> {
    return this.userRepo.findTopUsers(limit);
  }
  
  /**
   * Add points to a user
   * @param id User ID
   * @param points Points to add
   * @returns Updated user
   */
  async addUserPoints(id: string, points: number): Promise<User | null> {
    await this.userRepo.updateTotalPoints(id, points);
    return this.userRepo.findById(id);
  }
  
  /**
   * Get users by role
   * @param role User role
   * @param limit Maximum number of users to return
   * @returns Users with the specified role
   */
  async getUsersByRole(role: UserRole, limit = 50): Promise<User[]> {
    return this.userRepo.findByRole(role, limit);
  }
  
  /**
   * Search users by term
   * @param searchTerm Search term
   * @param limit Maximum number of users to return
   * @returns Users matching the search term
   */
  async searchUsers(searchTerm: string, limit = 50): Promise<User[]> {
    return this.userRepo.searchUsers(searchTerm, limit);
  }
  
  /**
   * Get recently joined users
   * @param limit Maximum number of users to return
   * @returns Recently joined users
   */
  async getRecentUsers(limit = 10): Promise<User[]> {
    return this.userRepo.findRecentUsers(limit);
  }
  
  /**
   * Get active users within a time period
   * @param startDate Start date
   * @param endDate End date
   * @param limit Maximum number of users to return
   * @returns Active users
   */
  async getActiveUsers(
    startDate: admin.firestore.Timestamp,
    endDate: admin.firestore.Timestamp,
    limit = 50
  ): Promise<User[]> {
    return this.userRepo.findActiveUsers(startDate, endDate, limit);
  }
  
  /**
   * Get user statistics
   * @returns User statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    usersByRole: Record<UserRole, number>;
  }> {
    return this.userRepo.getStats();
  }
  
  /**
   * Update user preferences
   * @param id User ID
   * @param preferences New preferences
   * @returns Updated user
   */
  async updateUserPreferences(
    id: string,
    preferences: Partial<UserPreferences>
  ): Promise<User | null> {
    // Get current user
    const user = await this.userRepo.findById(id);
    
    if (!user) {
      return null;
    }
    
    // Get user's existing preferences or create default ones
    const currentPreferences: UserPreferences = user.preferences || {
      emailNotifications: true,
      challengeReminders: true,
      profileVisibility: 'public',
      theme: 'system'
    };
    
    // Merge preferences, ensuring all required fields are present
    const updatedPreferences: UserPreferences = {
      ...currentPreferences,
      ...preferences
    };
    
    // Update user
    await this.userRepo.update(id, { 
      preferences: updatedPreferences,
      updatedAt: DateHelpers.now()
    });
    
    return this.userRepo.findById(id);
  }
}