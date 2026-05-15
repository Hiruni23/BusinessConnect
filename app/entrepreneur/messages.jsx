import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function EntrepreneurMessages() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const qChats = query(
      collection(db, "chats"),
      where("entrepreneurId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(qChats, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        isUnread: doc.data().unreadBy?.includes(user.uid)
      })));
      setLoading(false);
    }, (error) => {
      console.error('Chats listener failed:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.chatCard, item.isUnread && styles.unreadCard]} 
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={item.isUnread ? ['#3B82F6', '#2563EB'] : ['#E2E8F0', '#CBD5E1']}
          style={styles.avatarGradient}
        >
          <Ionicons name="person" size={24} color="#fff" />
        </LinearGradient>
        {item.isUnread && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.pitchTitle} numberOfLines={1}>{item.pitchTitle || "General Inquiry"}</Text>
          <Text style={styles.timeText}>
            {item.updatedAt?.toDate ? formatTime(item.updatedAt.toDate()) : ""}
          </Text>
        </View>
        <Text style={[styles.lastMsg, item.isUnread && styles.unreadText]} numberOfLines={1}>
          {item.lastMessage || "Start a conversation..."}
        </Text>
        <Text style={styles.investorName}>Investor: {item.investorEmail?.split('@')[0] || "Partner"}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="search-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>No Conversations Yet</Text>
                <Text style={styles.emptySub}>Your interactions with investors will appear here.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  chatCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    padding: 16, 
    borderRadius: 24, 
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  unreadCard: { backgroundColor: '#EFF6FF', borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  avatarContainer: { position: 'relative' },
  avatarGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#fff' },
  chatInfo: { flex: 1, marginLeft: 16 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pitchTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', flex: 1 },
  timeText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  lastMsg: { fontSize: 13, color: '#64748B', marginTop: 4 },
  unreadText: { color: '#1E293B', fontWeight: '700' },
  investorName: { fontSize: 11, color: '#4F46E5', fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }
});
