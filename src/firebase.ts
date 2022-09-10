import { initializeApp, FirebaseOptions, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const apiKey = process.env.FIREBASE_API_KEY;
const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
const projectId = process.env.FIREBASE_PROJECT_ID;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.FIREBASE_APP_ID;

const firebaseConfig: FirebaseOptions = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Initialize Firebase
const app = getApp('[DEFAULT]') ?? initializeApp(firebaseConfig);
const functions = getFunctions(app, 'http://localhost:3000');

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { auth, functions };