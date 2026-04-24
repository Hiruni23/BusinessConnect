import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';

function isUnread(item) {
  if (typeof item.isRead === 'boolean') {
    return !item.isRead;
  }

  if (typeof item.read === 'boolean') {
    return !item.read;
  }

  return true;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        setNotifications(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, [userId]);

  const markAsRead = async (id) => {
    await updateDoc(doc(db, 'notifications', id), {
      isRead: true,
      read: true,
    });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((item) => isUnread(item));

    if (unread.length === 0) {
      return;
    }

    const batch = writeBatch(db);
    unread.forEach((item) => {
      batch.update(doc(db, 'notifications', item.id), {
        isRead: true,
        read: true,
      });
    });

    await batch.commit();
  };

  const renderItem = ({ item }) => {
    const unread = isUnread(item);

    return (
      <TouchableOpacity style={[styles.card, unread && styles.unreadCard]} onPress={() => markAsRead(item.id)}>
        <Text style={styles.title}>{item.title || 'Notification'}</Text>
        <Text style={styles.message}>{item.message || ''}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAll}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No notifications available.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  markAll: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 12,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unreadCard: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  message: { marginTop: 4, fontSize: 13, color: '#475569' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 50 },
});
