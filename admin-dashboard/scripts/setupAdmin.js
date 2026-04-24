/**
 * Setup Script: Create Test Admin Account
 * 
 * Usage: node scripts/setupAdmin.js
 * 
 * Creates:
 * - Firebase Auth user: admin@businessconnect.com / AdminPassword123!
 * - Firestore user doc with role: "admin"
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './serviceAccountKey.json';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.error(`
❌ Service account key not found at: ${serviceAccountPath}

To get your Firebase service account key:
1. Go to Firebase Console → businessconnect-b6310
2. Project Settings → Service Accounts → Generate new private key
3. Save as: admin-dashboard/serviceAccountKey.json
4. Run: node scripts/setupAdmin.js
    `);
    process.exit(1);
  }
}

const auth = admin.auth();
const db = admin.firestore();

const TEST_EMAIL = 'admin@businessconnect.com';
const TEST_PASSWORD = 'AdminPassword123!';

async function setupAdmin() {
  console.log('🔧 Setting up test admin account...\n');

  try {
    // 1. Create or get the user in Firebase Auth
    let user;
    try {
      user = await auth.getUserByEmail(TEST_EMAIL);
      console.log(`✓ User exists: ${TEST_EMAIL}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        user = await auth.createUser({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });
        console.log(`✓ Created Auth user: ${TEST_EMAIL}`);
      } else {
        throw error;
      }
    }

    // 2. Create Firestore user document with admin role
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        email: TEST_EMAIL,
        role: 'admin',
        fullName: 'Test Admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✓ Created Firestore user doc with role: admin`);
    } else {
      console.log(`✓ User doc already exists, skipping creation`);
    }

    console.log(`
✅ Admin account ready!

Email:    ${TEST_EMAIL}
Password: ${TEST_PASSWORD}

Next: Start the admin dashboard with:
  npm run dev

Then log in with the credentials above.
    `);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

setupAdmin();
