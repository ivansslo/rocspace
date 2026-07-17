import admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function getFirestore() {
  if (!app) {
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  return app.firestore();
}
