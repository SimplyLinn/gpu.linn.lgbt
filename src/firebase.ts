import { initializeApp, FirebaseOptions, getApps } from 'firebase/app';
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

const apps = getApps();

const baseUrl = `${
  process.env.VERCEL_ENV === 'development' ? 'http://' : 'https://'
}${
  process.env.VERCEL_ENV === 'production'
    ? 'gpu.linn.lgbt'
    : process.env.VERCEL_URL ?? 'localhost:3000'
}`;

// Initialize Firebase
const app =
  apps.find(({ name }) => name === '[DEFAULT]') ??
  initializeApp(firebaseConfig);
const functions = getFunctions(app, baseUrl);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { auth, functions };
