import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  writeBatch,
  getDocs
} from "firebase/firestore";
import { auth, db } from '../../firebaseConfig';

export default function NotificationsScreen() {
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
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for current user's notifications
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      const docRef = doc(db, "notifications", id);
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  // Advanced: Mark all as read using Firestore Batches
  const markAllRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadNotifications.forEach((n) => {
        const docRef = doc(db, "notifications", n.id);
        batch.update(docRef, { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      Alert.alert("Error", "Could not update all notifications.");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'view': return { name: 'eye-outline', color: '#2563EB' }; // Entrepreneur blue
      case 'interest': return { name: 'heart-outline', color: '#EF4444' }; // Investor interest red
      case 'system': return { name: 'shield-checkmark-outline', color: '#10B981' }; // Success green
      default: return { name: 'notifications-outline', color: '#4B5563' };
    }
  };

  const renderItem = ({ item }) => {
    const icon = getIcon(item.type);
    
    // Formatting timestamp for better readability
    const timeDisplay = item.createdAt 
      ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + new Date(item.createdAt.seconds * 1000).toLocaleDateString()
      : 'Just now';

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.notifTitle, !item.isRead && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.notifMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notifTime}>{timeDisplay}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Notifications",
          headerRight: () => (
            <TouchableOpacity onPress={markAllRead} style={{ marginRight: 10 }}>
              <Text style={styles.headerAction}>Mark all read</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerAction: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  listContent: { padding: 16 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  unreadCard: { backgroundColor: '#F0F7FF', borderColor: '#DBEAFE', borderWidth: 1 },
  iconContainer: { padding: 10, borderRadius: 12, marginRight: 15 },
  textContainer: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  unreadText: { fontWeight: '800' },
  notifMessage: { fontSize: 13, color: '#4B5563', marginTop: 3, lineHeight: 18 },
  notifTime: { fontSize: 11, color: '#9CA3AF', marginTop: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', marginLeft: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 12, color: '#9CA3AF', fontSize: 16, fontWeight: '500' }
});