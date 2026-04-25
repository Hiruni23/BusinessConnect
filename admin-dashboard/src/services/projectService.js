import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const pitchesCollection = collection(db, 'pitches');

export async function testProjectsCollection() {
  try {
    const snapshot = await getDocs(query(pitchesCollection, orderBy('createdAt', 'desc')));
    console.log('Pitches snapshot:', snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  } catch (error) {
    console.error('Firestore pitches test failed:', error);
  }
}

export async function getPendingProjects() {
  const pendingQuery = query(
    pitchesCollection,
    where('status', 'in', ['Open', 'pending']),
    orderBy('createdAt', 'desc'),
  );

  const snapshot = await getDocs(pendingQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getAllProjects() {
  const snapshot = await getDocs(query(pitchesCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function updateProjectStatus(projectId, status, adminUid) {
  const projectRef = doc(db, 'pitches', projectId);
  await updateDoc(projectRef, {
    status,
    approvedBy: adminUid,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export function subscribeToAllProjects(callback) {
  const q = query(pitchesCollection, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      callback(null, data);
    },
    (error) => {
      console.error('Projects subscription failed:', error);
      callback(error);
    },
  );
}

export function subscribeToPendingProjects(callback) {
  const q = query(
    pitchesCollection,
    where('status', 'in', ['Open', 'pending']),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      callback(null, data);
    },
    (error) => {
      console.error('Pending projects subscription failed:', error);
      callback(error);
    },
  );
}