import { collection, doc, deleteDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export async function getUsers() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(query(usersRef, orderBy('email')));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function updateUser(uid, data) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
}

export async function deleteUser(uid) {
  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);
}

export function subscribeToUsers(callback) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('email'));

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      callback(null, data);
    },
    (error) => {
      console.error('Users subscription failed:', error);
      callback(error);
    },
  );
}

export function subscribeToInvestors(callback) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'Investor'));

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      callback(null, data);
    },
    (error) => {
      console.error('Investors subscription failed:', error);
      callback(error);
    },
  );
}