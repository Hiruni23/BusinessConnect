import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from "../../firebaseConfig";
import { calculateMatchScore } from "../../utils/matchAlgorithm";
import SideMenu from "../components/SideMenu";

export default function InvestorDashboard() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [pitches, setPitches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH USER DATA ================= */
  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData({ ...userDoc.data(), email: user.email });
        }
      } catch (error) {
        console.error("User Fetch Error:", error);
      }
    };
    fetchUserData();
  }, [user]);

  /* ================= REAL-TIME PITCH LISTENER ================= */
  useEffect(() => {
    if (!user) return;
    const qPitches = query(collection(db, "pitches"), where("status", "==", "Open"));
    const unsubscribe = onSnapshot(qPitches, (snapshot) => {
      const pitchList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const currentUserPrefs = {
        interests: userData?.interests || [],
        maxInvestment:
          typeof userData?.maxInvestment === "number"
            ? userData.maxInvestment
            : Number(userData?.maxInvestment) || Number.MAX_SAFE_INTEGER,
      };

      const sortedPitches = pitchList
        .map((pitch) => ({
          ...pitch,
          matchScore: calculateMatchScore(pitch, currentUserPrefs),
        }))
        .sort((a, b) => b.matchScore - a.matchScore);

      setPitches(sortedPitches);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, userData]);

  /* ================= REAL-TIME NOTIFICATIONS ================= */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid), where("isRead", "==", false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationList);
    });
    return () => unsubscribe();
  }, [user]);

  /* ================= REAL-TIME CHAT LISTENER ================= */
  useEffect(() => {
    if (!user) return;
    const qChats = query(collection(db, "chats"), where("participants", "array-contains", user.uid), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(qChats, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentChats(chatList);
    }, (error) => {
       console.error("Investor Chat Listener Error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  /* ================= REAL-TIME INVESTMENT HISTORY ================= */
  useEffect(() => {
    if (!user) return;

    const qInvestments = query(
      collection(db, "transactions"),
      where("investorId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(qInvestments, (snapshot) => {
      const investmentList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInvestments(investmentList);
    }, (error) => {
      console.error("Investor Investment Listener Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Calculate if there are any unread messages for the red dot in bottom nav
  const hasUnreadChat = recentChats.some(chat => chat.unreadBy?.includes(user?.uid));
  const totalInvested = investments.reduce((sum, investment) => sum + (Number(investment.amount) || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={28} color="#064E3B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BusinessConnect</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.notifIcon} onPress={() => router.push("/investor/notifications")}>
            <Ionicons name="notifications-outline" size={24} color="#064E3B" />
            {notifications.length > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{notifications.length}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.portfolioSummary}>
          <View>
            <Text style={styles.portfolioLabel}>My Portfolio</Text>
            <Text style={styles.portfolioValue}>${totalInvested.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.historyBtn} onPress={() => router.push("/investor/investment-history")}>
            <Ionicons name="pie-chart" size={20} color="#4F46E5" />
            <Text style={styles.historyBtnText}>Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{userData?.fullName?.split(' ')[0] || "Investor"}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Ionicons name="trending-up" size={14} color="#047857" />
            <Text style={styles.roleText}>INVESTOR</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard title="Pitches" value={pitches.length} />
          <StatCard title="Interests" value={userData?.interestedCount || 0} />
          <StatCard title="Portfolio" value={userData?.portfolioSize || 0} />
        </View>

        <Text style={styles.sectionTitle}>Recent Messages</Text>
        {recentChats.length === 0 ? (
          <Text style={styles.emptyTextMessages}>No active conversations.</Text>
        ) : (
          recentChats.slice(0, 3).map((chat) => (
            <TouchableOpacity key={chat.id} style={styles.chatItem} onPress={() => router.push(`/chat/${chat.id}`)}>
              <View style={styles.chatIconBg}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#047857" />
                {chat.unreadBy?.includes(user.uid) && <View style={styles.unreadDot} />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.chatPitchTitle}>{chat.pitchTitle || "Pitch Inquiry"}</Text>
                <Text style={styles.chatLastMsg} numberOfLines={1}>{chat.lastMessage}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.ctaCard}>
          <View>
            <Text style={styles.ctaTitle}>Discover Startups</Text>
            <Text style={styles.ctaSub}>Explore verified pitches and promising founders.</Text>
          </View>
          <Ionicons name="search-circle" size={50} color="#D1FAE5" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Available Pitches</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#047857" style={{ marginTop: 20 }} />
        ) : pitches.map((item) => (
          <TouchableOpacity key={item.id} style={styles.listCard} activeOpacity={0.7} onPress={() => router.push({ pathname: "/investor/pitch-details", params: { id: item.id } })}>
            <View style={styles.listCardLeft}>
              <View style={styles.categoryCircle}><Text style={styles.categoryInitial}>{item.category?.charAt(0)}</Text></View>
              <View><Text style={styles.listTitle}>{item.title}</Text><Text style={styles.listSub}>{item.category}</Text></View>
            </View>
            <View style={styles.listCardRight}><Text style={styles.goalText}>${Number(item.fundingGoal).toLocaleString()}</Text><Ionicons name="chevron-forward" size={18} color="#94A3B8" /></View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pass the unread status to Bottom Nav */}
      <BottomNavigation router={router} hasUnreadChat={hasUnreadChat} />

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} userData={userData} onLogout={handleLogout} router={router} />
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

const BottomNavigation = ({ router, hasUnreadChat }) => (
  <View style={styles.bottomNav}>
    <TouchableOpacity style={styles.navItem} onPress={() => router.push("/investor/dashboard")}><Ionicons name="home" size={24} color="#047857" /></TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => router.push("/investor/portfolio")}><Ionicons name="briefcase-outline" size={24} color="#94A3B8" /></TouchableOpacity>
    <TouchableOpacity style={styles.fab} onPress={() => Alert.alert("Search", "Opening filters...")}><Ionicons name="filter" size={26} color="#FFFFFF" /></TouchableOpacity>
    
    {/* CHAT ICON WITH DYNAMIC BADGE */}
    <TouchableOpacity style={styles.navItem} onPress={() => router.push("/investor/inbox")}>
      <View>
        <Ionicons name="chatbubble-outline" size={24} color="#94A3B8" />
        {hasUnreadChat && <View style={styles.navBadgeDot} />}
      </View>
    </TouchableOpacity>

    <TouchableOpacity style={styles.navItem} onPress={() => router.push("/investor/profile")}><Ionicons name="person-outline" size={24} color="#94A3B8" /></TouchableOpacity>
  </View>
);

const StatCard = ({ title, value }) => (
  <View style={styles.statCard}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{title}</Text></View>
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "#DCFCE7", justifyContent: "space-between", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#064E3B" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  notifIcon: { position: "relative", padding: 5 },
  badge: { position: "absolute", top: 0, right: 0, backgroundColor: "#EF4444", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#DCFCE7" },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  portfolioSummary: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  portfolioLabel: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  portfolioValue: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginTop: 2 },
  historyBtn: { backgroundColor: '#EEF2FF', padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  historyBtnText: { color: '#4F46E5', fontWeight: '700', marginLeft: 5, fontSize: 12 },
  welcomeRow: { flexDirection: "row", justifyContent: "space-between", padding: 20, alignItems: "center" },
  welcomeText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  welcomeName: { fontSize: 28, fontWeight: "900", color: "#0F172A" },
  roleBadge: { flexDirection: "row", backgroundColor: "#D1FAE5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: "center", gap: 6 },
  roleText: { fontSize: 12, fontWeight: "800", color: "#047857" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 10 },
  statCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, width: "30%", alignItems: "center", elevation: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  statValue: { fontSize: 20, fontWeight: "900", color: "#047857" },
  statLabel: { fontSize: 12, color: "#64748B", fontWeight: "600", marginTop: 2 },
  chatItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, padding: 16, borderRadius: 20, marginBottom: 8, elevation: 3 },
  chatIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  unreadDot: { position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFFFFF' },
  chatPitchTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  chatLastMsg: { fontSize: 13, color: '#64748B', marginTop: 2 },
  emptyTextMessages: { marginHorizontal: 20, color: "#94A3B8", fontWeight: "500" },
  ctaCard: { backgroundColor: "#047857", marginHorizontal: 20, borderRadius: 24, padding: 20, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  ctaSub: { fontSize: 14, color: "#D1FAE5", marginTop: 4, width: '80%' },
  sectionTitle: { fontSize: 18, fontWeight: "900", margin: 20, color: "#0F172A" },
  listCard: { backgroundColor: "#FFFFFF", marginHorizontal: 20, borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  listCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryCircle: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  categoryInitial: { fontSize: 18, fontWeight: '800', color: '#047857' },
  listTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  listSub: { fontSize: 13, color: "#64748B", fontWeight: '500' },
  listCardRight: { alignItems: 'flex-end', gap: 4 },
  goalText: { fontSize: 15, fontWeight: '800', color: '#047857' },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80, backgroundColor: "#FFFFFF", flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 1, borderColor: "#F1F5F9", paddingBottom: 15 },
  navItem: { padding: 10 },
  fab: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#047857", alignItems: "center", justifyContent: "center", marginBottom: 40, elevation: 8 },
  navBadgeDot: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: '#EF4444',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});