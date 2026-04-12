import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from "firebase/auth";
import {
  collection,
  doc, getDoc,
  getCountFromServer,
  limit,
  onSnapshot,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db, auth } from "../../firebaseConfig";
import AIChatModal from "../components/AIChatModal";
import SideMenu from "../components/SideMenu";

export default function EntrepreneurDashboard() {
  const router = useRouter();
  const user = auth.currentUser;
  const hasCheckedLatestNotification = useRef(false);

  const [pitches, setPitches] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiVisible, setAiVisible] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!user) return;
    hasCheckedLatestNotification.current = false;

    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData({ ...userDoc.data(), email: user.email });
      }
    };
    fetchUserData();

    // 1. Listen for Pitches
    const qPitches = query(
      collection(db, "pitches"),
      where("entrepreneurId", "==", user.uid)
    );
    const unsubPitches = onSnapshot(qPitches, async (snapshot) => {
      try {
        const pitchList = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        const pitchesWithViewCounts = await Promise.all(
          pitchList.map(async (pitch) => {
            const viewCountQuery = query(
              collection(db, "pitchViews"),
              where("pitchId", "==", pitch.id)
            );
            const viewCountSnapshot = await getCountFromServer(viewCountQuery);

            return {
              ...pitch,
              views: viewCountSnapshot.data().count,
            };
          })
        );

        setPitches(pitchesWithViewCounts);
      } catch (error) {
        console.error("Pitch View Count Error:", error);
      } finally {
        setLoading(false);
      }
    });

    // 2. Listen for Unread Notifications
    const qNotifs = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("isRead", "==", false)
    );
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      setHasUnread(!snapshot.empty);
    });

    // 3. Listen for newest notification to trigger celebration on fresh investment alerts
    const qLatestNotif = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const unsubLatestNotif = onSnapshot(qLatestNotif, (snapshot) => {
      // Skip the first snapshot so existing notifications do not trigger navigation on load.
      if (!hasCheckedLatestNotification.current) {
        hasCheckedLatestNotification.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notif = change.doc.data();
          if (notif.title === "New Investment! 💰") {
            router.push({
              pathname: "/entrepreneur/investment-success-celebration",
              params: {
                amount: notif.amount || 0,
                investor: notif.investorEmail || "An Investor",
              },
            });
          }
        }
      });
    });

    // 4. LISTEN FOR RECENT CHATS
    const qChats = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      const chatList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          isUnread: data.unreadBy?.includes(user.uid) 
        };
      });
      setRecentChats(chatList);
    });

    return () => {
      unsubPitches();
      unsubNotifs();
      unsubLatestNotif();
      unsubChats();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const totalFunding = pitches.reduce((sum, pitch) => sum + (pitch.raisedAmount || 0), 0);
  const totalInterested = pitches.reduce((sum, pitch) => sum + (pitch.interested || 0), 0);
  const username = user?.displayName || (user?.email ? user.email.split("@")[0] : "User");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Connect</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push("/entrepreneur/notifications")}>
            <View>
              <Ionicons name="notifications-outline" size={22} color="#111827" />
              {hasUnread && <View style={styles.badgeDot} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Ionicons name="person-circle-outline" size={26} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{username}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#2563EB" />
            <Text style={styles.roleText}>ENTREPRENEUR</Text>
          </View>
        </View>

        {/* QUICK STATS SECTION */}
        <View style={styles.statsRow}>
          <StatsCard title="My Pitches" value={pitches.length} icon="briefcase-outline" onPress={() => router.push("/entrepreneur/my-pitches")} />
          <StatsCard title="Investors" value={totalInterested} icon="people-outline" />
          <StatsCard title="Funding" value={`$${totalFunding}`} icon="cash-outline" onPress={() => router.push("/entrepreneur/investment-success-celebration")} />
          <StatsCard title="Active" value={pitches.filter(p => p.status === "Open").length} icon="rocket-outline" onPress={() => router.push("/entrepreneur/active")} />
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/entrepreneur/funding-insights")}
          >
            <Ionicons name="people" size={24} color="#4F46E5" />
            <Text style={styles.statLabel}>Investor List</Text>
          </TouchableOpacity>
        </View>

        {/* 📊 NEW: ANALYTICS BUTTON SECTION */}
        <TouchableOpacity 
          style={styles.analyticsBtn} 
          onPress={() => router.push('/entrepreneur/analytics')}
        >
          <View style={styles.btnContent}>
            <View style={styles.chartIconCircle}>
               <Ionicons name="bar-chart" size={20} color="#fff" />
            </View>
            <View style={{marginLeft: 12}}>
                <Text style={styles.btnText}>View Pitch Analytics</Text>
                <Text style={styles.btnSubText}>Check your weekly investor trends</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" style={{opacity: 0.7}} />
        </TouchableOpacity>

        {/* RECENT MESSAGES SECTION */}
        <Text style={styles.sectionTitle}>Recent Messages</Text>
        {recentChats.length === 0 ? (
          <Text style={styles.emptyText}>No messages yet.</Text>
        ) : (
          recentChats.slice(0, 3).map((chat) => (
            <TouchableOpacity 
              key={chat.id} 
              style={styles.chatItem} 
              onPress={() => router.push(`/chat/${chat.id}`)}
            >
              <View style={styles.chatIconBg}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#4F46E5" />
                {chat.isUnread && <View style={styles.unreadDot} />} 
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.chatPitchTitle, chat.isUnread && { fontWeight: '900' }]}>
                  {chat.pitchTitle || "Pitch Inquiry"}
                </Text>
                <Text style={styles.chatLastMsg} numberOfLines={1}>{chat.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={[styles.ctaCard, { marginTop: 24 }]}>
          <Text style={styles.ctaTitle}>Launch a New Startup Idea</Text>
          <Text style={styles.ctaSub}>Create a professional pitch and connect with investors.</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push("/auth/investor-selection")}>
            <Text style={styles.ctaBtnText}>Create Pitch</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Active Pitches</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" />
        ) : (
          pitches.map((pitch) => (
            <PitchCard key={pitch.id} title={pitch.title} raised={pitch.raisedAmount || 0} goal={pitch.fundingGoal || 1} status={pitch.status || "Open"} views={pitch.views || 0} interested={pitch.interested || 0} />
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FLOATING ACTION BUTTONS */}
      <TouchableOpacity style={styles.aiFab} onPress={() => setAiVisible(true)}>
        <Ionicons name="sparkles" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <BottomNavigation router={router} />
      <AIChatModal visible={aiVisible} onClose={() => setAiVisible(false)} pitchData={pitches[0]} />
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} userData={userData} onLogout={handleLogout} router={router} />
    </SafeAreaView>
  );
}

/* ================= HELPER COMPONENTS ================= */

const BottomNavigation = ({ router }) => (
  <View style={styles.bottomNav}>
    <TouchableOpacity onPress={() => router.push("/entrepreneur/dashboard")}><NavItem icon="home" active /></TouchableOpacity>
    <TouchableOpacity onPress={() => router.push("/entrepreneur/my-pitches")}><NavItem icon="briefcase-outline" /></TouchableOpacity>
    <TouchableOpacity onPress={() => router.push("/entrepreneur/analytics")}><NavItem icon="bar-chart-outline" /></TouchableOpacity>
    <TouchableOpacity style={styles.fab} onPress={() => router.push("/auth/investor-selection")}>
      <Ionicons name="add" size={30} color="#FFFFFF" />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => {}}><NavItem icon="chatbubble-outline" /></TouchableOpacity>
    <TouchableOpacity onPress={() => router.push("/profile")}><NavItem icon="person-outline" /></TouchableOpacity>
  </View>
);

const NavItem = ({ icon, active }) => (
  <View style={styles.navItem}>
    <Ionicons name={icon} size={24} color={active ? "#4F46E5" : "#94A3B8"} />
  </View>
);

const StatsCard = ({ title, value, icon, onPress }) => (
  <TouchableOpacity style={styles.statsCard} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
    <Ionicons name={icon} size={20} color="#4F46E5" />
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsTitle}>{title}</Text>
  </TouchableOpacity>
);

const PitchCard = ({ title, raised, goal, status, views, interested }) => {
  const percent = Math.min(Math.round((raised / goal) * 100), 100);
  const getStatusColor = () => {
    if (status === "Open") return "#16A34A";
    if (status === "accepted") return "#10B981";
    return "#EF4444";
  };
  return (
    <View style={styles.pitchCard}>
      <View style={styles.pitchHeader}>
        <Text style={styles.pitchTitle}>{title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View>
      <Text style={styles.progressText}>${raised} / ${goal} ({percent}% Funded)</Text>
      <View style={styles.pitchFooter}>
        <Text style={styles.pitchMeta}>👁 {views} Views</Text>
        <Text style={styles.pitchMeta}>🤝 {interested} Interested</Text>
      </View>
    </View>
  );
};

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, backgroundColor: "#FFFFFF", justifyContent: "space-between", elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerIcons: { flexDirection: "row", gap: 12, alignItems: 'center' },
  badgeDot: { position: 'absolute', right: -2, top: -2, backgroundColor: '#EF4444', width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFFFFF' },
  welcomeRow: { flexDirection: "row", justifyContent: "space-between", padding: 16, alignItems: "center" },
  welcomeText: { fontSize: 14, color: "#6B7280" },
  welcomeName: { fontSize: 22, fontWeight: "800" },
  roleBadge: { flexDirection: "row", backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignItems: "center", gap: 4 },
  roleText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 16 },
  statsCard: { backgroundColor: "#FFFFFF", width: "48%", padding: 16, borderRadius: 16, marginBottom: 12, elevation: 3 },
  statsValue: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  statsTitle: { fontSize: 12, color: "#6B7280" },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 4 },
  statCard: { backgroundColor: "#FFFFFF", width: "100%", padding: 16, borderRadius: 16, elevation: 3 },
  statLabel: { fontSize: 13, color: "#111827", fontWeight: "700", marginTop: 8 },
  
  // ANALYTICS BUTTON STYLES
  analyticsBtn: {
    backgroundColor: '#4F46E5', 
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  chartIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },

  ctaCard: { backgroundColor: "#4F46E5", marginHorizontal: 16, borderRadius: 20, padding: 20 },
  ctaTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  ctaSub: { fontSize: 13, color: "#E0E7FF", marginVertical: 10 },
  ctaButton: { backgroundColor: "#FFFFFF", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, alignSelf: "flex-start" },
  ctaBtnText: { fontWeight: "700", color: "#4F46E5" },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  emptyText: { textAlign: "center", marginTop: 20, color: "#6B7280" },
  pitchCard: { backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  pitchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pitchTitle: { fontSize: 15, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, color: "#FFFFFF", fontWeight: "700" },
  progressBar: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 10, marginVertical: 8 },
  progressFill: { height: 8, backgroundColor: "#4F46E5", borderRadius: 10 },
  progressText: { fontSize: 12, color: "#6B7280" },
  pitchFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  pitchMeta: { fontSize: 12, color: "#6B7280" },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 75, backgroundColor: "#FFFFFF", flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 1, borderColor: "#E5E7EB" },
  navItem: { alignItems: "center" },
  fab: { width: 65, height: 65, borderRadius: 32, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center", marginBottom: 35, elevation: 6 },
  aiFab: { position: "absolute", right: 20, bottom: 110, width: 60, height: 60, borderRadius: 30, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center", elevation: 8 },
  
  chatItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, padding: 16, borderRadius: 16, marginBottom: 8, elevation: 2 },
  chatIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  chatPitchTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  chatLastMsg: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFFFFF' },
});