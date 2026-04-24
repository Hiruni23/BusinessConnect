import { doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';

export async function loginAdmin(email, password) {
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  const user = credentials.user;

  const userRef = doc(db, 'users', user.uid);
  const userSnapshot = await getDoc(userRef);
  const role = userSnapshot.exists() ? userSnapshot.data().role : null;

  if (role !== 'admin') {
    await signOut(auth);
    throw new Error('Access denied: this account is not an admin.');
  }

  return { user, role };
}

export async function getAdminProfile(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  return userSnapshot.data();
}
