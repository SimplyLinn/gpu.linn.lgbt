const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

const serviceAccount = {
  projectId,
  privateKey,
  clientEmail,
};

export default serviceAccount;
