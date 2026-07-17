/**
 * Firebase Service — planning-with-ai-36675
 * Connects to Firestore for chat persistence
 */

import admin from 'firebase-admin';

// Firebase Admin config (server-side)
// NOTE: For production, use service account JSON via GOOGLE_APPLICATION_CREDENTIALS
// This uses the web config for development/testing

const FIREBASE_PROJECT_ID = 'planning-with-ai-36675';

let db: admin.firestore.Firestore | null = null;

export function getFirestore(): admin.firestore.Firestore {
  if (!db) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: FIREBASE_PROJECT_ID,
      });
    }
    db = admin.firestore();
  }
  return db;
}

export async function saveChatMessage(message: {
  sender: string;
  text: string;
  model?: string;
  metadata?: Record<string, any>;
}) {
  const firestore = getFirestore();
  const doc = await firestore.collection('chats').add({
    ...message,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: doc.id, status: 'saved' };
}

export async function getChatHistory(limit: number = 50) {
  const firestore = getFirestore();
  const snapshot = await firestore
    .collection('chats')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteChat(id: string) {
  const firestore = getFirestore();
  await firestore.collection('chats').doc(id).delete();
  return { id, status: 'deleted' };
}

// Firebase Web Config (for client-side usage)
export const firebaseWebConfig = {
  apiKey: "███████",
  authDomain: "planning-with-ai-36675.firebaseapp.com",
  projectId: "planning-with-ai-36675",
  storageBucket: "planning-with-ai-36675.firebasestorage.app",
  messagingSenderId: "877262776320",
  appId: "1:877262776320:web:a7e1a234879e66080210e5"
};
