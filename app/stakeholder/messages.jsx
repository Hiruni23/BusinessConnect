import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export default function StakeholderMessages() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { theme: T, isDark } = useTheme();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const qChats = query(
      collection(db, "chats"),
      where("stakeholderId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      qChats,
      (snapshot) => {
        setChats(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              isUnread: data.unreadBy?.includes(user.uid),
            };
          })
        );
        setLoading(false);
      },
      (error) => {
        console.error("Stakeholder chats listener failed:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;

    return chats.filter((item) => {
      const name = getChatTitle(item).toLowerCase();
      const pitchTitle = String(item.pitchTitle || "").toLowerCase();
      const lastMessage = String(item.lastMessage || "").toLowerCase();
      return name.includes(term) || pitchTitle.includes(term) || lastMessage.includes(term);
    });
  }, [search, chats]);

  const renderChatItem = ({ item }) => {
    const title = getChatTitle(item);
    const subtitle = getChatSubtitle(item);

    return (
      <TouchableOpacity
        style={[styles.chatCard, item.isUnread && styles.unreadCard]}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={item.isUnread ? ["#3B82F6", "#2563EB"] : ["#E2E8F0", "#CBD5E1"]}
            style={styles.avatarGradient}
          >
            <Ionicons name="person" size={24} color="#fff" />
          </LinearGradient>
          {item.isUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.pitchTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.timeText}>
              {item.updatedAt?.toDate ? formatTime(item.updatedAt.toDate()) : ""}
            </Text>
          </View>
          <Text style={[styles.lastMsg, item.isUnread && styles.unreadText]} numberOfLines={1}>
            {item.lastMessage || "Start a conversation..."}
          </Text>
          <Text style={styles.investorName} numberOfLines={1}>{subtitle}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
        <LinearGradient colors={isDark ? ["#0F172A", "#1E293B"] : ["#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
      <LinearGradient colors={isDark ? ["#0F172A", "#1E293B"] : ["#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="search-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Stakeholder Inbox</Text>
          <Text style={styles.subtitle}>Review conversations with entrepreneurs and open any chat thread.</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />

          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>No Conversations Yet</Text>
                <Text style={styles.emptySub}>Chats from your consultation requests will appear here.</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function getChatTitle(chat) {
  return (
    chat.entrepreneurName ||
    chat.otherUserName ||
    chat.partnerName ||
    chat.pitchTitle ||
    "Consultation Chat"
  );
}

function getChatSubtitle(chat) {
  const labels = [];
  if (chat.pitchTitle) labels.push(chat.pitchTitle);
  if (chat.entrepreneurEmail) labels.push(`Entrepreneur: ${chat.entrepreneurEmail.split("@")[0]}`);
  if (chat.investorEmail) labels.push(`Investor: ${chat.investorEmail.split("@")[0]}`);
  if (chat.topic) labels.push(chat.topic);
  return labels.join(" • ") || "Stakeholder conversation";
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 86400000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
  content: { flex: 1, padding: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 6, marginBottom: 16 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  listContent: { paddingBottom: 30 },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
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
