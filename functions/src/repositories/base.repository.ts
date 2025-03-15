// base.repository.ts
import { firestore } from 'firebase-admin';
import { getFirestore } from '../firebase';

/**
 * Generic base repository for Firestore CRUD operations
 * @template T - The model type
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected collection: firestore.CollectionReference;
  
  /**
   * Creates a new repository instance
   * @param collectionName - The name of the Firestore collection
   */
  constructor(collectionName: string) {
    this.collection = getFirestore().collection(collectionName);
  }
  
  /**
   * Create a new document in the collection
   * @param data - The document data without ID
   * @returns The created document with ID
   */
  async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = await this.collection.add(data);
    const newDoc = await docRef.get();
    return {
      id: docRef.id,
      ...newDoc.data()
    } as T;
  }

  /**
   * Create a document with a specific ID
   * @param id - The document ID
   * @param data - The document data without ID
   * @returns The created document with ID
   */
  async createWithId(id: string, data: Omit<T, 'id'>): Promise<T> {
    await this.collection.doc(id).set(data);
    return {
      id,
      ...data
    } as T;
  }

  /**
   * Find a document by ID
   * @param id - The document ID
   * @returns The document or null if not found
   */
  async findById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return {
      id: doc.id,
      ...doc.data()
    } as T;
  }

  /**
   * Update a document by ID
   * @param id - The document ID
   * @param data - The fields to update
   */
  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    await this.collection.doc(id).update(data);
  }

  /**
   * Delete a document by ID
   * @param id - The document ID
   */
  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  /**
   * Find all documents in the collection
   * @returns Array of documents
   */
  async findAll(): Promise<T[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T));
  }

  /**
   * Find documents matching a query
   * @param queryFn - Function that builds the query
   * @returns Array of documents matching the query
   */
  async query(
    queryFn: (query: firestore.Query) => firestore.Query,
    limit?: number
  ): Promise<T[]> {
    let query = queryFn(this.collection);
    // Apply limit if provided
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T));
  }

  /**
   * Count documents matching a query
   * @param queryFn - Function that builds the query
   * @returns Count of documents matching the query
   */
  async count(queryFn?: (query: firestore.Query) => firestore.Query): Promise<number> {
    let query: firestore.Query = this.collection;
    if (queryFn) {
      query = queryFn(this.collection);
    }
    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  /**
   * Check if document exists
   * @param id - The document ID
   * @returns True if document exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Get document reference
   * @param id - The document ID
   * @returns Firestore document reference
   */
  getDocRef(id: string): firestore.DocumentReference {
    return this.collection.doc(id);
  }
}