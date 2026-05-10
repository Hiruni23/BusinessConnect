import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '../../components/NotificationBell';
import { db } from "../../firebaseConfig";
import { calculateMatchScore } from "../../utils/matchAlgorithm";
import SideMenu from "../components/SideMenu";

const { width } = Dimensions.get('window');

export default function LightInvestorDashboard() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [pitches, setPitches] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= DATA FETCHING ================= */
  useEffect(() => {
    if (!user) return;

    const handleListenerError = (label, error) => {
      console.error(`${label} listener failed:`, error);
      setLoading(false);
    };
    
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData({ ...docSnap.data(), email: user.email });
    }, (error) => handleListenerError("User profile", error));

    const qPitches = query(collection(db, "pitches"), where("status", "==", "Open"));
    const unsubPitches = onSnapshot(qPitches, (snapshot) => {
      const pitchList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const currentUserPrefs = {
        interests: userData?.interests || [],
        maxInvestment: Number(userData?.maxInvestment) || Number.MAX_SAFE_INTEGER,
      };
      const sorted = pitchList
        .map(p => {
          const matchResult = calculateMatchScore(p, currentUserPrefs);
          return { ...p, matchScore: matchResult.score, matchReason: matchResult.matchReason };
        })
        .sort((a, b) => b.matchScore - a.matchScore);
      setPitches(sorted);
      setLoading(false);
    }, (error) => handleListenerError("Pitches", error));

    const qChats = query(collection(db, "chats"), where("investorId", "==", user.uid), orderBy("updatedAt", "desc"));
    const unsubChats = onSnapshot(qChats, (snap) => setRecentChats(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (error) => handleListenerError("Chats", error));

    const qInvest = query(collection(db, "transactions"), where("investorId", "==", user.uid), orderBy("timestamp", "desc"));
    const unsubInvest = onSnapshot(qInvest, (snap) => setInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (error) => handleListenerError("Investments", error));

    return () => { unsubUser(); unsubPitches(); unsubChats(); unsubInvest(); };
  }, [user, userData?.interests]);

  const totalInvested = investments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const hasUnreadChat = recentChats.some(c => c.unreadBy?.includes(user?.uid));

  const handleLogout = async () => {
    try { await signOut(auth); router.replace("/auth/login"); } catch (e) { console.error(e); }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* LIGHT HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerBtn}>
            <Ionicons name="apps-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.brandContainer}>
             <Text style={styles.brandText}>BusinessConnect</Text>
             <View style={styles.proBadge}><Text style={styles.proText}>INVESTOR</Text></View>
          </View>
          <View style={styles.headerIcons}>
            <NotificationBell routePath="/investor/notifications" color="#1E293B" size={24} />
            <TouchableOpacity onPress={() => router.push("/investor/profile")} style={[styles.headerBtn, {marginLeft: 10}]}>
              <Ionicons name="person-circle-outline" size={26} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* ENHANCED ASSETS SECTION */}
          <View style={styles.assetsContainer}>
            <Text style={styles.assetsTitle}>My Portfolio Overview</Text>
            <View style={styles.assetsGrid}>
              <View style={styles.mainAssetCard}>
                <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.assetGradient}>
                  <Text style={styles.assetLabel}>Total Committed</Text>
                  <Text style={styles.assetValue}>${totalInvested.toLocaleString()}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity style={styles.assetAction} onPress={() => router.push("/investor/investment-history")}>
                      <Text style={styles.assetActionText}>History</Text>
                      <Ionicons name="chevron-forward" size={14} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.assetAction} onPress={() => router.push("/investor/analytics")}>
                      <Text style={styles.assetActionText}>Analytics</Text>
                      <Ionicons name="stats-chart" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
              
              <View style={styles.subAssetsColumn}>
                <View style={styles.subAssetCard}>
                  <Text style={styles.subAssetLabel}>Ventures</Text>
                  <Text style={styles.subAssetValue}>{investments.length}</Text>
                </View>
                <View style={styles.subAssetCard}>
                  <Text style={styles.subAssetLabel}>Interests</Text>
                  <Text style={styles.subAssetValue}>{userData?.interestedCount || 0}</Text>
                </View>
              </View>
            </View>

            {/* ADDITIONAL PORTFOLIO COMPONENTS */}
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStat}>
                <Ionicons name="time-outline" size={16} color="#6366F1" />
                <Text style={styles.miniStatLabel}>Pending: $0</Text>
              </View>
              <View style={styles.miniStat}>
                <Ionicons name="trending-up-outline" size={16} color="#10B981" />
                <Text style={styles.miniStatLabel}>ROI: +12.4%</Text>
              </View>
              <View style={styles.miniStat}>
                <Ionicons name="calendar-outline" size={16} color="#F59E0B" />
                <Text style={styles.miniStatLabel}>Meetings: 2</Text>
              </View>
            </View>
          </View>

          {/* RECOMMENDED BUSINESSES CAROUSEL */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended Businesses</Text>
              <TouchableOpacity onPress={() => router.push("/investor/recommendations") }>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
              {pitches.slice(0, 3).map(pitch => (
                <View key={pitch.id} style={styles.aiCarouselCard}>
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={12} color="#10B981" />
                    <Text style={styles.aiBadgeText}>Recommended</Text>
                  </View>
                  <Text style={styles.oCategory}>{pitch.category?.toUpperCase() || "TECH"}</Text>
                  <Text style={styles.oTitle} numberOfLines={1}>{pitch.title}</Text>
                  <Text style={styles.aiMatchReason}>{pitch.matchReason}</Text>
                  
                  <View style={styles.aiFooter}>
                    <Text style={styles.aiScoreText}>{pitch.matchScore}% Match</Text>
                    <TouchableOpacity style={styles.viewBtn} onPress={() => router.push({ pathname: "/investor/pitch-details", params: { id: pitch.id } })}>
                      <Text style={styles.viewBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* MAIN PITCH LIST */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Market Opportunities</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#4F46E5" style={{ marginTop: 20 }} />
            ) : pitches.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No new pitches available</Text>
              </View>
            ) : (
              pitches.slice(3).map(pitch => <OpportunityCard key={pitch.id} pitch={pitch} onPress={() => router.push({ pathname: "/investor/pitch-details", params: { id: pitch.id } })} />)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <LightBottomNav router={router} hasUnread={hasUnreadChat} />
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} userData={userData} onLogout={handleLogout} router={router} />
    </View>
  );
}

const QuickAction = ({ icon, label, onPress, color, badge }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={22} color={color} />
      {badge && <View style={styles.actionBadge} />}
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const OpportunityCard = ({ pitch, onPress }) => {
  const matchColor = pitch.matchScore > 80 ? '#10B981' : pitch.matchScore > 50 ? '#6366F1' : '#94A3B8';
  const progress = Math.min((pitch.raisedAmount || 0) / (pitch.fundingGoal || 1), 1);

  return (
    <TouchableOpacity style={styles.oCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.oCardTop}>
        <View style={styles.oCardInfo}>
          <Text style={styles.oCategory}>{pitch.category?.toUpperCase() || "TECH"}</Text>
          <Text style={styles.oTitle}>{pitch.title}</Text>
        </View>
        <View style={[styles.matchIndicator, { borderColor: matchColor }]}>
           <Text style={[styles.matchPct, { color: matchColor }]}>{pitch.matchScore}%</Text>
        </View>
      </View>
      
      <View style={styles.progressSection}>
         <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Funding Progress</Text>
            <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
         </View>
         <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: matchColor }]} />
         </View>
      </View>

      <Text style={styles.oMatchReason}>{pitch.matchReason}</Text>

      <View style={styles.oCardFooter}>
        <View>
          <Text style={styles.oStatLabel}>Target Goal</Text>
          <Text style={styles.oStatValue}>${Number(pitch.fundingGoal).toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.viewBtn} onPress={onPress}>
          <Text style={styles.viewBtnText}>Analyze</Text>
          <Ionicons name="chevron-forward" size={14} color="#4F46E5" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const LightBottomNav = ({ router, hasUnread }) => (
  <BlurView intensity={90} tint="light" style={styles.bottomNav}>
    <NavIcon icon="grid" active onPress={() => router.push("/investor/dashboard")} />
    <NavIcon icon="briefcase" onPress={() => router.push("/investor/portfolio")} />
    <TouchableOpacity style={styles.mainAction} onPress={() => Alert.alert("Search", "Refining market view...")}>
      <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.mainActionGradient}>
        <Ionicons name="search" size={24} color="#FFF" />
      </LinearGradient>
    </TouchableOpacity>
    <NavIcon icon="chatbubbles" badge={hasUnread} onPress={() => router.push("/investor/inbox")} />
    <NavIcon icon="person" onPress={() => router.push("/investor/profile")} />
  </BlurView>
);

const NavIcon = ({ icon, active, onPress, badge }) => (
  <TouchableOpacity onPress={onPress} style={styles.navIconBtn}>
    <Ionicons name={active ? icon : icon + "-outline"} size={24} color={active ? "#4F46E5" : "#94A3B8"} />
    {badge && <View style={styles.navBadge} />}
    {active && <View style={styles.navDot} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2FF' }, // Soft blue tint background
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
  headerBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  brandContainer: { alignItems: 'center' },
  brandText: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  proBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  proText: { fontSize: 9, fontWeight: '900', color: '#4F46E5', letterSpacing: 0.5 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },

  assetsContainer: { padding: 20 },
  assetsTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
  assetsGrid: { flexDirection: 'row', gap: 12 },
  mainAssetCard: { flex: 1.5, height: 160, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.2, shadowRadius: 15 },
  assetGradient: { flex: 1, padding: 20, justifyContent: 'space-between' },
  assetLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  assetValue: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  assetAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  assetActionText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  subAssetsColumn: { flex: 1, gap: 12 },
  subAssetCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 15, justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  subAssetLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  subAssetValue: { color: '#1E293B', fontSize: 18, fontWeight: '900', marginTop: 4 },

  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 10 },
  miniStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', padding: 12, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  miniStatLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  section: { marginTop: 10, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
  seeAll: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
  
  oCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderLeftWidth: 4 },
  oCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  oCardInfo: { flex: 1 },
  oCategory: { fontSize: 10, fontWeight: '800', color: '#6366F1', letterSpacing: 1 },
  oTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 4 },
  matchIndicator: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  matchPct: { fontSize: 12, fontWeight: '900' },
  
  progressSection: { marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  progressPct: { fontSize: 12, color: '#1E293B', fontWeight: '800' },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  oCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 15 },
  oStatLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  oStatValue: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginTop: 2 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  viewBtnText: { color: '#4F46E5', fontSize: 13, fontWeight: '700', marginRight: 4 },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 25, borderTopWidth: 1, borderColor: '#F1F5F9', backgroundColor: 'rgba(255,255,255,0.95)' },
  navIconBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4F46E5', marginTop: 4 },
  navBadge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#FFF' },
  mainAction: { width: 56, height: 56, borderRadius: 28, marginTop: -35, elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 10 },
  mainActionGradient: { flex: 1, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontWeight: '600', marginTop: 10 },
  
  aiCarouselCard: { width: 280, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, elevation: 5, shadowColor: '#10B981', shadowOpacity: 0.15, shadowRadius: 15, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  aiBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '900', marginLeft: 4, textTransform: 'uppercase' },
  aiMatchReason: { color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 15, fontStyle: 'italic' },
  aiFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  aiScoreText: { color: '#10B981', fontSize: 16, fontWeight: '900' },
  oMatchReason: { fontSize: 12, color: '#64748B', fontStyle: 'italic', marginBottom: 15 }
});