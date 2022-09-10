import * as admin from 'firebase-admin';
import serviceAccount from './service-account';

export const app =
  admin.apps.find((a) => a?.name === '[DEFAULT]') ??
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId,
    serviceAccountId: serviceAccount.clientEmail,
  });
