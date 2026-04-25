import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const SETTINGS_DOC_ID = 'platform_config';

export function subscribeToSettings(callback) {
  const settingsRef = doc(db, 'system_settings', SETTINGS_DOC_ID);

  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(null, snapshot.data());
      } else {
        // Return default settings if none exist
        callback(null, {
          platformName: 'BusinessConnect',
          supportEmail: 'support@businessconnect.com',
          maintenanceMode: false,
          allowNewSignups: true,
          fundingLimit: 1000000,
        });
      }
    },
    (error) => {
      console.error('Settings subscription failed:', error);
      callback(error);
    },
  );
}

export async function updateSettings(newSettings) {
  const settingsRef = doc(db, 'system_settings', SETTINGS_DOC_ID);
  await setDoc(settingsRef, {
    ...newSettings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
