import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export async function getUsers() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(query(usersRef, orderBy('email')));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}