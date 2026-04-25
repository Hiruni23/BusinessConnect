import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const notificationsCollection = collection(db, 'notifications');
const usersCollection = collection(db, 'users');

function chunkArray(values, chunkSize) {
  const chunks = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

export async function sendNotification(userId, title, message, options = {}) {
  if (!userId || !title || !message) {
    throw new Error('userId, title, and message are required.');
  }

  const payload = {
    userId,
    title,
    message,
    type: options.type || 'system',
    isRead: false,
    read: false,
    createdAt: serverTimestamp(),
  };

  if (options.projectId) {
    payload.projectId = options.projectId;
  }

  if (options.metadata) {
    payload.metadata = options.metadata;
  }

  return addDoc(notificationsCollection, payload);
}

export async function sendProjectStatusNotification({ userId, projectId, projectTitle, status }) {
  const normalizedStatus = String(status || '').toLowerCase();
  const isApproved = ['approved', 'accepted'].includes(normalizedStatus);

  const title = isApproved ? 'Project Approved' : 'Project Update';
  const message = isApproved
    ? `Your project \"${projectTitle || 'Untitled Project'}\" has been approved by admin.`
    : `Your project \"${projectTitle || 'Untitled Project'}\" was marked as ${normalizedStatus || 'updated'} by admin.`;

  return sendNotification(userId, title, message, {
    type: 'project',
    projectId,
    metadata: {
      status: normalizedStatus || 'updated',
    },
  });
}

export async function sendBroadcastNotification({ title, message, role = 'all', type = 'announcement' }) {
  if (!title || !message) {
    throw new Error('title and message are required.');
  }

  const usersSnapshot = await getDocs(usersCollection);
  const selectedRole = normalizeRole(role);

  const recipients = usersSnapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((user) => {
      if (selectedRole === 'all') {
        return true;
      }

      return normalizeRole(user.role) === selectedRole;
    })
    .map((user) => user.id);

  const chunks = chunkArray(recipients, 400);

  for (const chunk of chunks) {
    const batch = writeBatch(db);

    chunk.forEach((userId) => {
      const notificationRef = doc(notificationsCollection);
      batch.set(notificationRef, {
        userId,
        title,
        message,
        type,
        isRead: false,
        read: false,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  return recipients.length;
}

export async function getRecentNotifications(limitCount = 30) {
  const notificationsQuery = query(notificationsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(notificationsQuery);

  return snapshot.docs.slice(0, limitCount).map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export function subscribeToNotifications(callback, limitCount = 30) {
  const q = query(notificationsCollection, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.slice(0, limitCount).map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      callback(null, data);
    },
    (error) => {
      console.error('Notifications subscription failed:', error);
      callback(error);
    },
  );
}
