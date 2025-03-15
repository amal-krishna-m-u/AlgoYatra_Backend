import * as admin from 'firebase-admin';
import { BaseRepository } from './repositories/base.repository';
import { ChallengeRepository } from './repositories/challenge.repository';
// import { SubmissionRepository } from './repositories/submission.repository';
// import { UserRepository } from './repositories/user.repository';
import { Challenge, ChallengeDifficulty } from './models/challenge.model';
// import { Submission, SubmissionStatus } from './models/submission.model';
import { User, UserRole } from './models/user.model';

// Initialize Firebase with emulator configuration
// NOTE: This must happen before any Firestore operations
try {
  admin.initializeApp({
    projectId: "demo-project" // This can be any string for the emulator
  });
  
  // Point the app to use the Firestore emulator
  admin.firestore().settings({
    host: "http://127.0.0.1:4000", // Default Firestore emulator host and port
    ssl: false,
    ignoreUndefinedProperties: true
  });
  
  console.log('🔌 Connected to Firebase Emulators');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

// Mock data function
function createMockData() {
  const now = admin.firestore.Timestamp.now();
  const futureDate = admin.firestore.Timestamp.fromDate(
    new Date('2025-04-15T00:00:00Z')
  );
  const pastDate = admin.firestore.Timestamp.fromDate(
    new Date('2024-03-01T00:00:00Z')
  );
  
  // Create test challenge
  const challenge: Omit<Challenge, 'id'> = {
    title: 'Build a React App',
    description: 'Create a todo application with React',
    requirements: ['Must use React hooks', 'Must include tests'],
    startDate: pastDate,
    endDate: futureDate,
    difficulty: ChallengeDifficulty.MEDIUM,
    category: 'Web Development',
    points: 100,
    active: true,
    createdBy: 'admin-user',
    createdAt: now
  };
  
  // Create test user
  const user: Omit<User, 'id'> = {
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
  
  return { challenge, user, now, futureDate, pastDate };
}

// Test BaseRepository 
async function testBaseRepository() {
  console.log('\n🧪 Testing BaseRepository with emulator...');
  
  // Create a test repository implementation
  class TestRepository extends BaseRepository<{ id: string, name: string, value: number }> {
    constructor() {
      super('test_collection');
    }
  }
  
  const testRepo = new TestRepository();
  
  try {
    // Test create
    console.log('Testing create...');
    const created = await testRepo.create({ name: 'Test Item', value: 42 });
    console.log('✅ Created item:', created.id);
    
    // Test findById
    console.log('Testing findById...');
    const found = await testRepo.findById(created.id);
    console.log(`✅ Found item: ${found?.name}, value: ${found?.value}`);
    
    // Test update
    console.log('Testing update...');
    await testRepo.update(created.id, { value: 99 });
    const updated = await testRepo.findById(created.id);
    console.log(`✅ Updated item value: ${updated?.value}`);
    
    // Test delete
    console.log('Testing delete...');
    await testRepo.delete(created.id);
    const deleted = await testRepo.findById(created.id);
    console.log(`✅ Item deleted: ${deleted === null ? 'yes' : 'no'}`);
    
    return true;
  } catch (error) {
    console.error('❌ BaseRepository test failed:', error);
    return false;
  }
}

// Test ChallengeRepository 
async function testChallengeRepository() {
  console.log('\n🧪 Testing ChallengeRepository with emulator...');
  const { challenge } = createMockData();
  const repo = new ChallengeRepository();
  
  try {
    // Test create challenge
    console.log('Testing create challenge...');
    const created = await repo.create(challenge);
    console.log(`✅ Created challenge: ${created.id} - ${created.title}`);
    
    // Test findById
    console.log('Testing findById...');
    const found = await repo.findById(created.id);
    console.log(`✅ Found challenge: ${found ? found.title : 'not found'}`);
    
    // Test find challenges with filters
    console.log('Testing findChallenges with filters...');
    const challenges = await repo.findChallenges({ 
      difficulty: ChallengeDifficulty.MEDIUM,
      activeOnly: true 
    }, 10);
    console.log(`✅ Found ${challenges.length} challenges with filters`);
    
    // Test search
    console.log('Testing searchChallenges...');
    const searchResults = await repo.searchChallenges('React');
    console.log(`✅ Search returned ${searchResults.length} results`);
    
    // Clean up
    console.log('Cleaning up...');
    await repo.delete(created.id);
    
    return true;
  } catch (error) {
    console.error('❌ ChallengeRepository test failed:', error);
    return false;
  }
}

// Run only one test for demonstration
async function runEmulatorTests() {
  console.log('🔍 Running repository tests with Firebase Emulator');
  console.log('Current user:', 'amal-krishna-m-u');
  console.log('Current date/time:', new Date().toISOString());
  
  let success = true;
  
  try {
    // Just test the base repository as a proof of concept
    const baseResult = await testBaseRepository();
    const challengeResult = await testChallengeRepository();
    
    success = baseResult && challengeResult;
    
    console.log('\n📊 Test Results:');
    console.log(`BaseRepository: ${baseResult ? '✅ Passed' : '❌ Failed'}`);
    console.log(`ChallengeRepository: ${challengeResult ? '✅ Passed' : '❌ Failed'}`);
    
    console.log('\n🏁 Overall Result:', success ? '✅ Tests passed!' : '❌ Some tests failed!');
  } catch (error) {
    console.error('❌ Tests failed with an unexpected error:', error);
    success = false;
  }
  
  return success;
}

// Execute the tests
runEmulatorTests()
  .then(success => {
    console.log('\nTests completed at:', new Date().toISOString());
    if (!success) {
      console.log('Some tests failed! Check the logs above for details.');
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });