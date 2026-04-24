import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationsCenter() {
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

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(list);
      setLoading(false);
    }, (error) => {
      console.error("Notifications Fetch Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'FUNDING_MILESTONE': return { name: 'rocket', color: '#6366F1' };
      case 'INNOVATOR_UPDATE': return { name: 'megaphone', color: '#10B981' };
      case 'AI_RECOMMENDATION': return { name: 'sparkles', color: '#A855F7' };
      case 'PORTFOLIO_ALERT': return { name: 'wallet', color: '#F59E0B' };
      default: return { name: 'notifications', color: '#64748B' };
    }
  };

  const renderNotification = ({ item }) => {
    const icon = getIcon(item.type);
    return (
      <TouchableOpacity 
        style={[styles.card, !item.isRead && styles.unreadCard]} 
        onPress={() => markAsRead(item.id)}
      >
        <View style={[styles.iconCircle, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.typeText}>{item.type?.replace('_', ' ') || 'ACTIVITY'}</Text>
            <Text style={styles.timeText}>{item.createdAt?.toDate().toLocaleDateString()}</Text>
          </View>
          <Text style={[styles.message, !item.isRead && styles.unreadMessage]}>{item.message}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Activity</Text>
            <Text style={styles.headerSub}>Stay updated with your world.</Text>
          </View>
          <TouchableOpacity style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="notifications-off-outline" size={60} color="#E2E8F0" />
            </View>
            <Text style={styles.emptyTitle}>All Quiet Here</Text>
            <Text style={styles.emptySub}>We'll notify you when your innovations hit milestones or AI finds something new.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    paddingHorizontal: 24, 
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1E293B' },
  headerSub: { fontSize: 14, color: '#64748B', fontWeight: '500', marginTop: 4 },
  clearBtnText: { color: '#6366F1', fontSize: 13, fontWeight: '700' },

  listContent: { padding: 20, paddingBottom: 100 },
  card: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 24, 
    backgroundColor: '#FFF', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  unreadCard: { 
    backgroundColor: '#F8FAFC', 
    borderColor: '#E0E7FF',
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1'
  },
  iconCircle: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  content: { flex: 1, position: 'relative' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typeText: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  timeText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  message: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },
  unreadMessage: { color: '#1E293B', fontWeight: '700' },
  unreadDot: { position: 'absolute', top: 30, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 22 }
});
