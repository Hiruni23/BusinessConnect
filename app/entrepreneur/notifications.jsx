import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

export default function ProfessionalNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(list);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach(n => batch.update(doc(db, "notifications", n.id), { isRead: true }));
      await batch.commit();
    } catch (e) { console.error(e); }
  };

  const getIconConfig = (type) => {
    switch (type?.toUpperCase()) {
      case 'ACCEPTANCE': return { name: 'checkmark-circle', color: '#10B981', bg: '#D1FAE5' };
      case 'REJECTION': return { name: 'close-circle', color: '#EF4444', bg: '#FEE2E2' };
      case 'INVESTMENT': return { name: 'cash', color: '#4F46E5', bg: '#E0E7FF' };
      case 'VIEW': return { name: 'eye', color: '#6366F1', bg: '#EEF2FF' };
      case 'CHAT': return { name: 'chatbubbles', color: '#EC4899', bg: '#FCE7F3' };
      default: return { name: 'notifications', color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderNotif = ({ item }) => {
    const config = getIconConfig(item.type);
    return (
      <TouchableOpacity 
        style={[styles.notifCard, !item.isRead && styles.unreadCard]} 
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
          <Ionicons name={config.name} size={22} color={config.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifTop}>
            <Text style={[styles.notifTitle, !item.isRead && styles.unreadTitle]}>{item.title || 'Notification'}</Text>
            <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
          {item.fromName && <Text style={styles.notifAuthor}>from {item.fromName}</Text>}
        </View>
        {!item.isRead && <View style={styles.statusDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <BlurView intensity={80} tint="light" style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Clear All</Text>
          </TouchableOpacity>
        </BlurView>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#4F46E5" size="large" /></View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotif}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                   <Ionicons name="notifications-off-outline" size={40} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySub}>We'll notify you when something important happens.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  markAllText: { color: '#4F46E5', fontSize: 14, fontWeight: '700' },

  listContainer: { padding: 20, paddingBottom: 50 },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  unreadCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#E0E7FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  notifContent: { flex: 1 },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1 },
  unreadTitle: { color: '#1E293B' },
  notifTime: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  notifMsg: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  notifAuthor: { fontSize: 11, color: '#4F46E5', fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5', marginLeft: 10 },

  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});