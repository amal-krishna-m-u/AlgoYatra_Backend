import * as admin from 'firebase-admin';

/**
 * Date utility functions for the platform
 */
export class DateHelpers {
  /**
   * Convert a JavaScript Date to Firestore Timestamp
   * @param date JavaScript Date object
   * @returns Firestore Timestamp
   */
  static toTimestamp(date: Date): admin.firestore.Timestamp {
    return admin.firestore.Timestamp.fromDate(date);
  }
  
  /**
   * Get current timestamp
   * @returns Current Firestore Timestamp
   */
  static now(): admin.firestore.Timestamp {
    return admin.firestore.Timestamp.now();
  }
  
  /**
   * Get start of current week as Timestamp (Sunday 12:00:00 AM)
   * @returns Timestamp for start of week
   */
  static getStartOfWeek(): admin.firestore.Timestamp {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = now.getUTCDate() - dayOfWeek;
    
    const startOfWeek = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      diff,
      0, 0, 0, 0
    ));
    
    return admin.firestore.Timestamp.fromDate(startOfWeek);
  }
  
  /**
   * Get start of current month as Timestamp (1st day at 12:00:00 AM)
   * @returns Timestamp for start of month
   */
  static getStartOfMonth(): admin.firestore.Timestamp {
    const now = new Date();
    
    const startOfMonth = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
      0, 0, 0, 0
    ));
    
    return admin.firestore.Timestamp.fromDate(startOfMonth);
  }
  
  /**
   * Check if a timestamp is between start and end dates
   * @param timestamp Timestamp to check
   * @param startDate Start date
   * @param endDate End date
   * @returns True if timestamp is between start and end dates
   */
  static isBetween(
    timestamp: admin.firestore.Timestamp,
    startDate: admin.firestore.Timestamp,
    endDate: admin.firestore.Timestamp
  ): boolean {
    return (
      timestamp.toMillis() >= startDate.toMillis() &&
      timestamp.toMillis() <= endDate.toMillis()
    );
  }
  
  /**
   * Format a timestamp to a human-readable string (YYYY-MM-DD)
   * @param timestamp Firestore Timestamp
   * @returns Formatted date string
   */
  static formatDate(timestamp: admin.firestore.Timestamp): string {
    const date = timestamp.toDate();
    
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Format a timestamp to a human-readable datetime (YYYY-MM-DD HH:MM)
   * @param timestamp Firestore Timestamp
   * @returns Formatted datetime string
   */
  static formatDateTime(timestamp: admin.firestore.Timestamp): string {
    const date = timestamp.toDate();
    
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toISOString().split('T')[1].substring(0, 5);
    
    return `${dateStr} ${timeStr}`;
  }
  
  /**
   * Calculate time remaining from now until a target timestamp
   * @param targetTimestamp Future timestamp
   * @returns Object with days, hours, minutes remaining
   */
  static timeRemaining(targetTimestamp: admin.firestore.Timestamp): {
    days: number;
    hours: number;
    minutes: number;
  } {
    const now = admin.firestore.Timestamp.now().toMillis();
    const target = targetTimestamp.toMillis();
    
    // If target is in the past, return zeros
    if (target <= now) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    
    const diffMs = target - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      days: diffDays,
      hours: diffHours,
      minutes: diffMinutes
    };
  }
  
  /**
   * Get a timestamp for a future date
   * @param days Days in the future
   * @returns Timestamp for the future date
   */
  static getFutureDate(days: number): admin.firestore.Timestamp {
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    return admin.firestore.Timestamp.fromDate(date);
  }
  
  /**
   * Get current week identifier (YYYY-WW format)
   * @returns Week identifier string
   */
  static getCurrentWeekId(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    
    // Get week number (1-52)
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
    
    // Format as YYYY-WW (e.g., 2023-01)
    return `${year}-${String(weekNumber).padStart(2, '0')}`;
  }
  
  /**
   * Get current month identifier (YYYY-MM format)
   * @returns Month identifier string
   */
  static getCurrentMonthId(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1; // getMonth() returns 0-11
    
    // Format as YYYY-MM (e.g., 2023-01)
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}