// firebase.ts
import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';

let app: admin.app.App;

export function getFirebaseApp(): admin.app.App {
  if (!app) {
    try {
      app = admin.app();
    } catch (e) {
      app = admin.initializeApp();
    }
  }
  return app;
}

export function getFirestore(): firestore.Firestore {
  return getFirebaseApp().firestore();
}

export function getAuth(): admin.auth.Auth {
  return getFirebaseApp().auth();
}

export function getStorage(): admin.storage.Storage {
  return getFirebaseApp().storage();
}