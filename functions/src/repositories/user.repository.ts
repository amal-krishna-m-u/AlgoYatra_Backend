import * as admin from 'firebase-admin';
import { BaseRepository } from './base.repository';
import { User, UserFilters, UserRole } from '../models/user.model';

/**
 * Repository for user data access
 */
export class UserRepository extends BaseRepository<User> {
  /**
   * Creates a new user repository
   */
  constructor() {
    super('users');
  }
  
  /**
   * Find a user by email
   * @param email User email
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.query(query => {
      return query.where('email', '==', email).limit(1);
    }, 1);
    
    return users.length > 0 ? users[0] : null;
  }
  
  /**
   * Find users by role
   * @param role User role to filter by
   * @param limit Maximum number of users to return
   * @returns Array of users with the specified role
   */
  async findByRole(role: UserRole, limit = 50): Promise<User[]> {
    return this.query(query => {
      return query
        .where('role', '==', role)
        .orderBy('joinedAt', 'desc');
    }, limit);
  }
  
  /**
   * Find users with optional filters
   * @param filters Optional filters to apply
   * @param limit Maximum number of users to return
   * @returns Array of filtered users
   */
  async findUsers(filters: UserFilters = {}, limit = 50): Promise<User[]> {
    return this.query(query => {
      let q = query;
      
      // Filter by role
      if (filters.role) {
        q = q.where('role', '==', filters.role);
      }
      
      // Order by join date (newest first)
      q = q.orderBy('joinedAt', 'desc');
      
      return q;
    }, limit);
  }
  
  /**
   * Search users by display name or email
   * @param searchTerm Search term
   * @param limit Maximum number of users to return
   * @returns Array of users matching the search
   */
  async searchUsers(searchTerm: string, limit = 50): Promise<User[]> {
    // Convert search term to lowercase for case-insensitive search
    const searchTermLower = searchTerm.toLowerCase();
    
    // Get users and filter in memory (simple approach, consider Algolia for production)
    const users = await this.query(query => {
      return query.orderBy('joinedAt', 'desc');
    }, limit * 3); // Get more to allow for filtering
    
    // Filter users that match search term
    const filteredUsers = users.filter(user => {
      return (
        user.displayName.toLowerCase().includes(searchTermLower) ||
        user.email.toLowerCase().includes(searchTermLower) ||
        (user.githubUsername && 
         user.githubUsername.toLowerCase().includes(searchTermLower))
      );
    });
    
    // Limit results
    return filteredUsers.slice(0, limit);
  }
  
  /**
   * Find top users by points
   * @param limit Maximum number of users to return
   * @returns Array of users sorted by points
   */
  async findTopUsers(limit = 10): Promise<User[]> {
    return this.query(query => {
      return query
        .orderBy('totalPoints', 'desc')
        .orderBy('displayName', 'asc');
    }, limit);
  }
  
  /**
   * Update a user's total points
   * @param userId User ID
   * @param pointsToAdd Points to add to the user's total
   * @returns Updated user
   */
  async updateTotalPoints(userId: string, pointsToAdd: number): Promise<void> {
    const userRef = this.getDocRef(userId);
    
    await admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error(`User ${userId} not found`);
      }
      
      const userData = userDoc.data() as Omit<User, 'id'>;
      const currentPoints = userData.totalPoints || 0;
      const newPoints = currentPoints + pointsToAdd;
      
      transaction.update(userRef, { 
        totalPoints: newPoints,
        updatedAt: admin.firestore.Timestamp.now()
      });
    });
  }
  
  /**
   * Get user statistics
   * @returns Statistics about users
   */
  async getStats(): Promise<{
    totalUsers: number;
    usersByRole: Record<UserRole, number>;
  }> {
    // Get total users count
    const totalCount = await this.count();
    
    // Get count for each role
    const roleCounts: Record<UserRole, number> = {
      [UserRole.CHALLENGER]: await this.count(query => 
        query.where('role', '==', UserRole.CHALLENGER)
      ),
      [UserRole.MAINTAINER]: await this.count(query => 
        query.where('role', '==', UserRole.MAINTAINER)
      ),
      [UserRole.ADMIN]: await this.count(query => 
        query.where('role', '==', UserRole.ADMIN)
      )
    };
    
    return {
      totalUsers: totalCount,
      usersByRole: roleCounts
    };
  }
  
  /**
   * Find recently joined users
   * @param limit Maximum number of users to return
   * @returns Array of recently joined users
   */
  async findRecentUsers(limit = 10): Promise<User[]> {
    return this.query(query => {
      return query.orderBy('joinedAt', 'desc');
    }, limit);
  }
  
  /**
   * Update user role
   * @param userId User ID
   * @param newRole New role to assign
   */
  async updateRole(userId: string, newRole: UserRole): Promise<void> {
    await this.update(userId, {
      role: newRole,
      updatedAt: admin.firestore.Timestamp.now()
    });
  }
  
  /**
   * Find users who have earned points in a given time period
   * @param startDate Start of time period
   * @param endDate End of time period
   * @param limit Maximum number of users to return
   * @returns Array of users with points in the time period
   */
  async findActiveUsers(
    startDate: admin.firestore.Timestamp,
    endDate: admin.firestore.Timestamp,
    limit = 50
  ): Promise<User[]> {
    // This is a more complex query that requires a join with submissions
    // We'll need to use a separate submissions collection query and then get users
    
    // Get submissions in the time period
    const submissionsRef = admin.firestore().collection('submissions');
    const submissionsSnapshot = await submissionsRef
      .where('submittedAt', '>=', startDate)
      .where('submittedAt', '<=', endDate)
      .select('userId')
      .get();
    
    // Extract unique user IDs
    const userIds = new Set<string>();
    submissionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) {
        userIds.add(data.userId);
      }
    });
    
    // Early return if no users found
    if (userIds.size === 0) {
      return [];
    }
    
    // Get users by IDs (in batches if needed)
    const users: User[] = [];
    const userIdsArray = Array.from(userIds);
    
    // Process in batches of 10 (Firestore in query limitation)
    for (let i = 0; i < userIdsArray.length; i += 10) {
      const batch = userIdsArray.slice(i, i + 10);
      
      const batchUsers = await this.query(query => {
        return query.where(admin.firestore.FieldPath.documentId(), 'in', batch);
      });
      
      users.push(...batchUsers);
    }
    
    // Sort by points and limit
    return users
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, limit);
  }
}