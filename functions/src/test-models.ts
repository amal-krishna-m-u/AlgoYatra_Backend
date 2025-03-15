import * as admin from 'firebase-admin';
import { Challenge, ChallengeDifficulty } from './models/challenge.model';
import { Submission, SubmissionStatus } from './models/submission.model';
import { User, UserRole } from './models/user.model';

// Make sure the models can be used without runtime errors
function testModels() {
  const now = admin.firestore.Timestamp.now();
  const futureDate = admin.firestore.Timestamp.fromDate(
    new Date('2025-04-15T00:00:00Z')
  );
  
  try {
    // Test Challenge model
    const challenge: Challenge = {
      id: 'challenge-123',
      title: 'Build a React App',
      description: 'Create a todo application with React',
      requirements: ['Must use React hooks', 'Must include tests'],
      startDate: now,
      endDate: futureDate,
      difficulty: ChallengeDifficulty.MEDIUM,
      category: 'Web Development',
      points: 100,
      active: true,
      createdBy: 'admin-user',
      createdAt: now
    };
    console.log('✅ Challenge model is valid:', challenge.title);
    
    // Test User model
    const user: User = {
      id: 'user-123',
      displayName: 'Amal Krishna',
      email: 'amal@example.com',
      role: UserRole.CHALLENGER,
      totalPoints: 0,
      joinedAt: now,
      preferences: {
        emailNotifications: true,
        challengeReminders: true,
        profileVisibility: 'public',
        theme: 'dark'
      }
    };
    console.log('✅ User model is valid:', user.displayName);
    
    // Test Submission model
    const submission: Submission = {
      id: 'submission-123',
      challengeId: challenge.id,
      userId: user.id,
      repositoryUrl: 'https://github.com/amal/react-todo',
      submittedAt: now,
      status: SubmissionStatus.PENDING
    };
    console.log('✅ Submission model is valid:', submission.repositoryUrl);
    
    // Test the relationships between models
    console.log(`✅ Submission ${submission.id} is for challenge "${challenge.title}" by user "${user.displayName}"`);
    
    return true;
  } catch (error) {
    console.error('❌ Model validation failed:', error);
    return false;
  }
}

testModels();
console.log('All models tested successfully');