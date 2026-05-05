import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    collection,
    doc,
    getCountFromServer,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query,
    where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '../../components/NotificationBell';
import { auth, db } from "../../firebaseConfig";
import matchAlgorithm from "../../utils/matchAlgorithm";
import AIChatModal from "../components/AIChatModal";
import SideMenu from "../components/SideMenu";

const { width } = Dimensions.get("window");

export default function EntrepreneurDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  const [pitches, setPitches] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiVisible, setAiVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [recommendedInvestors, setRecommendedInvestors] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return unsubscribe;
  }, []);

  const isOpenStatus = (status) => ['open', 'pending', 'in review', 'review'].includes(String(status || '').toLowerCase());

  useEffect(() => {
    if (!user) return;

    const handleListenerError = (label, error) => {
      console.error(`${label} listener failed:`, error);
      setLoading(false);
    };

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();

    // Fetch recommended investors
    const qInvestors = query(collection(db, "users"), where("role", "in", ["investor", "Investor"]));
    const unsubInvestors = onSnapshot(qInvestors, (snap) => {
      try {
        const investorsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const userDoc = snap.docs.find(d => d.id === user.uid);
        const cUser = userDoc ? { id: userDoc.id, ...userDoc.data(), email: user.email } : null;
        
        if (cUser && cUser.role?.toLowerCase() === 'entrepreneur') {
          const matches = matchAlgorithm(cUser, investorsList, "entrepreneur");
          setRecommendedInvestors(matches);
        }
      } catch (error) {
        console.error("Error processing investors:", error);
      }
    }, (error) => handleListenerError("Recommended investors", error));

    const qPitches = query(collection(db, "pitches"), where("entrepreneurId", "==", user.uid));
    const unsubPitches = onSnapshot(qPitches, async (snapshot) => {
      try {
        const pitchList = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        const pitchesWithViewCounts = await Promise.all(
          pitchList.map(async (pitch) => {
            const viewQuery = query(
              collection(db, "pitchViews"), 
              where("pitchId", "==", pitch.id),
              where("entrepreneurId", "==", user.uid)
            );
            const viewCountSnap = await getCountFromServer(viewQuery);
            return { ...pitch, views: viewCountSnap.data().count };
          })
        );
        setPitches(pitchesWithViewCounts);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    }, (error) => handleListenerError("Pitches", error));

    const mountedAt = new Date();
    const qLatestNotif = query(collection(db, "notifications"), where("userId", "==", user.uid), where("createdAt", ">", mountedAt), orderBy("createdAt", "desc"), limit(1));
    const unsubLatestNotif = onSnapshot(qLatestNotif, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notif = change.doc.data();
          if (notif.title === "New Investment! 💰") {
            router.push({
              pathname: "/entrepreneur/investment-success-celebration",
              params: { amount: notif.amount || 0, investor: notif.investorEmail || "An Investor" },
            });
          }
        }
      });
    }, (error) => handleListenerError("Latest notification", error));

    const qChats = query(collection(db, "chats"), where("entrepreneurId", "==", user.uid), orderBy("updatedAt", "desc"));
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      setRecentChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isUnread: doc.data().unreadBy?.includes(user.uid) })));
    }, (error) => handleListenerError("Chats", error));

    return () => { unsubInvestors(); unsubPitches(); unsubLatestNotif(); unsubChats(); };
  }, [user]);

  const handleLogout = async () => {
    try { await signOut(auth); router.replace("/auth/login"); } catch (e) { console.error(e); }
  };

  const totalFunding = pitches.reduce((sum, p) => sum + Number(p.raisedAmount || 0), 0);
  const totalInterested = pitches.reduce((sum, p) => sum + Number(p.interested || 0), 0);
  const username = user?.displayName || (user?.email ? user.email.split("@")[0] : "User");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* MODERNISED HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerBtn}>
            <Ionicons name="menu-outline" size={26} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BusinessConnect</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => router.push("/entrepreneur/messages")} style={styles.headerBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#1E293B" />
              {recentChats.some(c => c.isUnread) && <View style={styles.badgeDot} />}
            </TouchableOpacity>
            <View style={styles.headerBtn}>
              <NotificationBell routePath="/entrepreneur/notifications" color="#1E293B" size={22} />
            </View>
            <TouchableOpacity onPress={() => router.push("/profile")} style={styles.headerBtn}>
              <Ionicons name="person-circle-outline" size={26} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* WELCOME SECTION */}
          <View style={styles.welcomeContainer}>
            <View>
              <Text style={styles.welcomeLabel}>Good morning,</Text>
              <Text style={styles.welcomeTitle}>{username} </Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>ENTREPRENEUR</Text>
            </View>
          </View>

          {/* MAJOR HERO FUNDING CARD */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => router.push({ pathname: "/entrepreneur/investment-success-celebration", params: { amount: totalFunding, investor: "Total Portfolio" } })}
          >
            <View style={styles.heroCard}>
              <LinearGradient colors={['#4F46E5', '#3730A3']} style={StyleSheet.absoluteFill} />
              <View style={styles.heroHeader}>
                <Text style={styles.heroLabelLight}>Total Capital Secured</Text>
                <View style={styles.heroIconCircle}><Ionicons name="trending-up" size={20} color="#10B981" /></View>
              </View>
              <Text style={styles.heroValueLight}>${totalFunding.toLocaleString()}</Text>
              <View style={styles.heroFooter}>
                <Text style={styles.heroSubTextLight}>Over {pitches.length} Active Pitches</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
              </View>
            </View>
          </TouchableOpacity>

          {/* AI RECOMMENDED INVESTORS CAROUSEL */}
          {recommendedInvestors.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended Investors</Text>
                <TouchableOpacity onPress={() => router.push("/entrepreneur/ai-recommended-investors")}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15, paddingBottom: 10 }}>
                {recommendedInvestors.slice(0, 4).map(investor => (
                  <View key={investor.id} style={styles.aiCarouselCard}>
                    <View style={styles.aiBadge}>
                      <Ionicons name="sparkles" size={12} color="#10B981" />
                      <Text style={styles.aiBadgeText}>AI Recommended</Text>
                    </View>
                    <View style={styles.investorHeaderRow}>
                       <View style={styles.investorAvatar}>
                          <Text style={styles.investorAvatarText}>{investor.name ? investor.name.charAt(0).toUpperCase() : 'I'}</Text>
                       </View>
                       <View style={styles.investorInfo}>
                          <Text style={styles.oTitle} numberOfLines={1}>{investor.name || "Investor"}</Text>
                          <Text style={styles.oCategory}>{investor.location || "Global"}</Text>
                       </View>
                    </View>
                    <Text style={styles.aiMatchReason}>{investor.matchReason}</Text>
                    
                    <View style={styles.aiFooter}>
                      <Text style={styles.aiScoreText}>{investor.score}% Match</Text>
                      <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/profile/${investor.id}`)}>
                        <Text style={styles.viewBtnText}>Profile</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* SECONDARY STATS GRID */}
          <View style={styles.statGrid}>
            <View style={styles.statBoxWrapper}>
              <View style={styles.statBox}>
                <Ionicons name="people-outline" size={20} color="#4F46E5" />
                <Text style={styles.statNumber}>{totalInterested}</Text>
                <Text style={styles.statTitle}>Investors</Text>
              </View>
            </View>
            <View style={styles.statBoxWrapper}>
              <View style={styles.statBox}>
                <Ionicons name="rocket-outline" size={20} color="#EC4899" />
                <Text style={styles.statNumber}>{pitches.filter((p) => isOpenStatus(p.status)).length}</Text>
                <Text style={styles.statTitle}>Live Pitches</Text>
              </View>
            </View>
          </View>

          {/* QUICK LINKS */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/entrepreneur/funding-insights")}>
              <View style={styles.actionCard}>
                <Ionicons name="list" size={20} color="#4F46E5" />
                <Text style={styles.actionText}>Investors</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/entrepreneur/payouts")}>
              <View style={styles.actionCard}>
                <Ionicons name="card-outline" size={20} color="#4F46E5" />
                <Text style={styles.actionText}>Payouts</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/entrepreneur/analytics')}>
              <View style={styles.actionCard}>
                <Ionicons name="stats-chart" size={20} color="#4F46E5" />
                <Text style={styles.actionText}>Insights</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* RECENT MESSAGES */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Conversations</Text>
            <TouchableOpacity onPress={() => router.push("/entrepreneur/messages")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentChats.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent messages</Text>
            </View>
          ) : (
            recentChats.slice(0, 2).map((chat) => (
              <TouchableOpacity key={chat.id} onPress={() => router.push(`/chat/${chat.id}`)}>
                <View style={[styles.chatCard, chat.isUnread && styles.unreadChatCard]}>
                  <View style={styles.chatAvatar}>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#4F46E5" />
                    {chat.isUnread && <View style={styles.unreadDot} />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.chatTitle} numberOfLines={1}>{chat.pitchTitle}</Text>
                    <Text style={styles.chatMsg} numberOfLines={1}>{chat.lastMessage}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* ACTIVE PITCHES LIST */}
          <Text style={styles.sectionTitle}>Active Portfolio</Text>
          {loading ? (
             <ActivityIndicator color="#4F46E5" style={{marginTop: 20}} />
          ) : (
            pitches.map(p => <PitchItem key={p.id} pitch={p} />)
          )}

        </ScrollView>
      </SafeAreaView>

      {/* FABs */}
      <TouchableOpacity style={styles.aiFab} onPress={() => setAiVisible(true)}>
        <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.fabGradient}>
          <Ionicons name="sparkles" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <BottomNavigation router={router} />
      <AIChatModal visible={aiVisible} onClose={() => setAiVisible(false)} pitchData={pitches[0]} />
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} userData={userData} onLogout={handleLogout} router={router} />
    </View>
  );
}

const PitchItem = ({ pitch }) => {
  const percent = Math.min(Math.round(((pitch.raisedAmount || 0) / (pitch.fundingGoal || 1)) * 100), 100);
  return (
    <View style={styles.pitchCard}>
      <View style={styles.pitchTop}>
        <Text style={styles.pitchTitle}>{pitch.title}</Text>
        <View style={styles.pitchStatus}>
           <Text style={styles.statusText}>{pitch.status}</Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View>
        <Text style={styles.progressLabel}>{percent}%</Text>
      </View>
      <View style={styles.pitchMeta}>
        <Text style={styles.metaTxt}>${pitch.raisedAmount?.toLocaleString()} raised</Text>
        <Text style={styles.metaTxt}>👁 {pitch.views} Views</Text>
      </View>
    </View>
  );
};

const BottomNavigation = ({ router }) => (
  <BlurView intensity={90} tint="light" style={styles.bottomNav}>
    <TouchableOpacity onPress={() => router.push("/entrepreneur/dashboard")}><NavItem icon="grid" active /></TouchableOpacity>
    <TouchableOpacity onPress={() => router.push("/entrepreneur/my-pitches")}><NavItem icon="briefcase" /></TouchableOpacity>
    <View style={{width: 60}} />
    <TouchableOpacity style={styles.centerFab} onPress={() => router.push("/auth/investor-selection")}>
      <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.fabGradient}>
        <Ionicons name="add" size={32} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => router.push("/entrepreneur/analytics")}><NavItem icon="bar-chart" /></TouchableOpacity>
    <TouchableOpacity onPress={() => router.push("/profile")}><NavItem icon="person" /></TouchableOpacity>
  </BlurView>
);

const NavItem = ({ icon, active }) => (
  <View style={styles.navItem}>
    <Ionicons name={icon} size={24} color={active ? "#4F46E5" : "#94A3B8"} />
    {active && <View style={styles.activeDot} />}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF' },
  headerTitle: { color: '#1E293B', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerIcons: { flexDirection: 'row', gap: 10 },
  badgeDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFFFFF' },
  
  welcomeContainer: { paddingHorizontal: 20, marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeLabel: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  welcomeTitle: { color: '#1E293B', fontSize: 26, fontWeight: '800', marginTop: 2 },
  roleBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: '#4F46E5', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  heroCard: { marginHorizontal: 20, marginTop: 25, borderRadius: 32, padding: 25, overflow: 'hidden', elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabelLight: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center' },
  heroValueLight: { color: '#fff', fontSize: 44, fontWeight: '900', marginVertical: 12 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  heroSubTextLight: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },

  statGrid: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 15 },
  statBoxWrapper: { flex: 1, padding: 5 },
  statBox: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statNumber: { color: '#1E293B', fontSize: 24, fontWeight: '800', marginTop: 8 },
  statTitle: { color: '#64748B', fontSize: 12, fontWeight: '700', marginTop: 2 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20 },
  actionBtn: { width: '31%' },
  actionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 15, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  actionText: { color: '#1E293B', fontSize: 11, fontWeight: '800', marginTop: 8 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: { color: '#1E293B', fontSize: 18, fontWeight: '800', marginHorizontal: 20, marginTop: 25, marginBottom: 15 },
  seeAll: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },

  chatCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 12, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
  unreadChatCard: { borderLeftWidth: 4, borderLeftColor: '#4F46E5', backgroundColor: '#F5F3FF' },
  chatAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  chatTitle: { color: '#1E293B', fontSize: 15, fontWeight: '800' },
  chatMsg: { color: '#64748B', fontSize: 13, marginTop: 2 },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#F5F3FF' },
  emptyCard: { marginHorizontal: 20, padding: 30, borderRadius: 24, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' },
  emptyText: { color: '#94A3B8', fontWeight: '600' },

  pitchCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 15, borderRadius: 28, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  pitchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pitchTitle: { color: '#1E293B', fontSize: 16, fontWeight: '800', flex: 1 },
  pitchStatus: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: '#10B981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 3 },
  progressLabel: { color: '#1E293B', fontSize: 12, fontWeight: '800', marginLeft: 10 },
  pitchMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaTxt: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  aiFab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.4, shadowRadius: 12 },
  fabGradient: { flex: 1, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 25, borderTopWidth: 1, borderColor: '#F1F5F9' },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4F46E5', marginTop: 4 },
  centerFab: { position: 'absolute', bottom: 40, width: 66, height: 66, borderRadius: 33, elevation: 12, shadowColor: '#4F46E5', shadowOpacity: 0.4, shadowRadius: 15 },
  
  section: { marginTop: 15 },
  aiCarouselCard: { width: 280, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, elevation: 5, shadowColor: '#10B981', shadowOpacity: 0.15, shadowRadius: 15, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 15 },
  aiBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '900', marginLeft: 4, textTransform: 'uppercase' },
  aiMatchReason: { color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 15, fontStyle: 'italic' },
  aiFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  aiScoreText: { color: '#10B981', fontSize: 16, fontWeight: '900' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  viewBtnText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
  
  investorHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  investorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  investorAvatarText: { color: '#4F46E5', fontSize: 16, fontWeight: '800' },
  investorInfo: { flex: 1 },
  oTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  oCategory: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginTop: 2 }
});