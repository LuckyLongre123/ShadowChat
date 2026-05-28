import admin from "firebase-admin";
import logger from "../utils/logger";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string,
);

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    logger.error("Firebase Admin Initialization Error", error);
  }
}

// Used for Google OAuth token verification only
export const firebaseAdminAuth = admin.auth();

export default firebaseAdminAuth;

