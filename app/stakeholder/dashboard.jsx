import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState, useMemo } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import SideMenu from "../components/SideMenu";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-gifted-charts";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function StakeholderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const { theme: T, isDark, toggleTheme } = useTheme();

  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState([]);
  const [meetingsCount, setMeetingsCount] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const [milestonesToReview, setMilestonesToReview] = useState(0);
  const [portfolioInvested, setPortfolioInvested] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchAndInitializeUser = async () => {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
      } else {
        const newData = { uid: user.uid, fullName: user.displayName || "Stakeholder Account", email: user.email, role: "Stakeholder", createdAt: new Date().toISOString() };
        await setDoc(userRef, newData);
        setUserData(newData);
      }
    };
    fetchAndInitializeUser();
  }, [user]);

  useEffect(() => {
    if (!user || !userData) return;

    const handleSnapshotError = (label, error) => {
      console.error(`${label} listener failed:`, error);
      setIsLoading(false);
    };

    const unsubProjects = onSnapshot(query(collection(db, "pitches"), where("status", "in", ["accepted", "funded", "active"])), (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsLoading(false);
    }, (error) => handleSnapshotError("Projects", error));

    const unsubPulse = onSnapshot(query(collection(db, "milestones"), orderBy("updatedAt", "desc"), limit(4)), (snapshot) => {
        setUpcomingMilestones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleSnapshotError("Milestones pulse", error));

    const unsubNotifs = onSnapshot(query(collection(db, "notifications"), where("userId", "==", user.uid), where("isRead", "==", false)), (snapshot) => setHasUnread(!snapshot.empty), (error) => handleSnapshotError("Notifications", error));

    const unsubMeetings = onSnapshot(query(collection(db, "meetings"), where("stakeholderId", "==", user.uid)), (snapshot) => setMeetingsCount(snapshot.docs.filter(d => d.data().status === "scheduled").length), (error) => handleSnapshotError("Meetings", error));

    const unsubReview = onSnapshot(query(collection(db, "milestones"), where("status", "==", "completed")), (snapshot) => setMilestonesToReview(snapshot.size), (error) => handleSnapshotError("Milestones review", error));

    const unsubInvestments = onSnapshot(collection(db, "investments"), (snapshot) => {
        const total = snapshot.docs.reduce((acc, docSnap) => acc + Number(docSnap.data().amount || 0), 0);
        setPortfolioInvested(total);
    }, (error) => handleSnapshotError("Investments", error));

    return () => { 
      unsubProjects(); 
      unsubPulse(); 
      unsubNotifs(); 
      unsubMeetings(); 
      unsubReview(); 
      unsubInvestments();
    };
  }, [user, userData]);

  const chartData = useMemo(() => [
    { value: 10, label: "Q1" }, { value: 25, label: "Q2" }, { value: 18, label: "Q3" }, { value: 32, label: "Q4" }
  ], []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth/login");
  };

  const s = makeStyles(T, isDark);

  if (isLoading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="small" color={T.accent} />
      </View>
    );
  }

  const username = userData?.fullName?.split(" ")[0] || "Stakeholder";

  return (
    <View style={s.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
      <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ["#FDFDFD", "#F8FAFC"]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* NEAT HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={s.headerIcon}>
            <Ionicons name="grid" size={20} color={T.text} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>BusinessConnect</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={s.themeToggle} onPress={toggleTheme} activeOpacity={0.85}>
              <View style={s.toggleTrack}>
                <View style={[s.toggleThumb, isDark && s.toggleThumbRight]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={12} color={isDark ? '#60A5FA' : '#F59E0B'} />
                </View>
                <Ionicons name="sunny" size={10} color={isDark ? T.subtext : '#F59E0B'} style={{ position: 'absolute', left: 6 }} />
                <Ionicons name="moon"  size={10} color={isDark ? '#60A5FA' : T.subtext} style={{ position: 'absolute', right: 6 }} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/stakeholder/notifications")} style={s.headerIcon}>
              <Ionicons name="notifications-outline" size={22} color={T.text} />
              {hasUnread && <View style={s.badge} />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollBody}>
          
          {/* BEAUTIFUL SESSION BAR */}
          <View style={s.sessionRow}>
            <View>
                <Text style={s.sessionLabel}>ACTIVE SESSION</Text>
                <Text style={s.sessionUser}>{username} <Text style={s.roleTag}>• STAKEHOLDER</Text></Text>
            </View>
            <View style={s.secureTag}>
                <View style={s.liveDot} />
                <Text style={s.secureText}>SYSTEM SECURE</Text>
            </View>
          </View>

          {/* NEAT KPI CARDS */}
          <View style={s.kpiRow}>
             <Animated.View entering={FadeInDown.delay(100).springify()} style={[s.kpiCardWrapper, { marginRight: 12 }]}>
               <TouchableOpacity style={s.kpiCard} onPress={() => router.push("/stakeholder/milestones")}>
                  <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                  <Text style={s.kpiTag}>VETTING QUEUE</Text>
                  <Text style={s.kpiValue}>{milestonesToReview}</Text>
                  <View style={s.kpiProgress}>
                      <View style={[s.kpiFill, { width: '65%', backgroundColor: isDark ? '#FBBF24' : '#F59E0B' }]} />
                  </View>
               </TouchableOpacity>
             </Animated.View>

             <Animated.View entering={FadeInDown.delay(200).springify()} style={[s.kpiCardWrapper, { marginRight: 12 }]}>
               <TouchableOpacity style={s.kpiCard} onPress={() => router.push("/stakeholder/meetings")}>
                  <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                  <Text style={s.kpiTag}>SESSIONS</Text>
                  <Text style={s.kpiValue}>{meetingsCount}</Text>
                  <View style={s.kpiProgress}>
                      <View style={[s.kpiFill, { width: '40%', backgroundColor: T.accent }]} />
                  </View>
               </TouchableOpacity>
             </Animated.View>

             <Animated.View entering={FadeInDown.delay(300).springify()} style={s.kpiCardWrapper}>
                <TouchableOpacity style={s.kpiCard} onPress={() => router.push("/stakeholder/analytics")}>
                   <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                   <Text style={s.kpiTag}>COMMITTED</Text>
                   <Text style={s.kpiValue}>${portfolioInvested >= 1000 ? (portfolioInvested / 1000).toFixed(0) + 'k' : portfolioInvested}</Text>
                   <View style={s.kpiProgress}>
                       <View style={[s.kpiFill, { width: '85%', backgroundColor: isDark ? '#34D399' : '#10B981' }]} />
                   </View>
                </TouchableOpacity>
              </Animated.View>
          </View>

          {/* VIRTUAL COMMAND CENTER */}
          <Animated.View entering={FadeInDown.delay(350).springify()} style={{ marginHorizontal: 20, marginTop: 15 }}>
            <TouchableOpacity 
              style={[s.kpiCard, { height: 70, flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: isDark ? '#4F46E5' : '#2563EB' }]}
              onPress={() => router.push("/stakeholder/virtual-pitch-meeting")}
            >
              <Ionicons name="videocam" size={24} color="#fff" />
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>VIRTUAL OPS</Text>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 2 }}>Launch Pitch Session</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          

          {/* POLISHED MARKET CHART */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={s.chartSection}>
             <View style={s.sectionHead}>
                <Text style={s.sectionMainTitle}>Market Intelligence</Text>
                <View style={s.growthBadge}>
                    <Ionicons name="trending-up" size={12} color={isDark ? '#34D399' : '#10B981'} />
                    <Text style={s.growthText}>+12.4%</Text>
                </View>
             </View>
             <Text style={s.sectionSubtitle}>Cross-portfolio capital audit visualization</Text>
             
             <View style={s.chartWrapper}>
                <LineChart
                    data={chartData}
                    height={130}
                    width={width - 80}
                    initialSpacing={10}
                    spacing={(width - 100) / 3.5}
                    color={T.accent}
                    thickness={3}
                    startFillColor={isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(37, 99, 235, 0.1)"}
                    endFillColor={isDark ? "rgba(59, 130, 246, 0.01)" : "rgba(37, 99, 235, 0.01)"}
                    startOpacity={0.5}
                    endOpacity={0.01}
                    noOfSections={3}
                    yAxisColor="transparent"
                    xAxisColor={T.border}
                    dataPointsColor={T.accent}
                    dataPointsRadius={4}
                    curved
                    hideYAxisText
                    xAxisLabelsVerticalShift={5}
                    xAxisLabelTextStyle={{ fontSize: 10, color: T.subtext, fontWeight: '800' }}
                />
             </View>
          </Animated.View>

          {/* BEAUTIFUL ROADMAP */}
          <Animated.View entering={FadeInDown.delay(500).springify()} style={s.sectionBox}>
             <View style={s.sectionHead}>
                <Text style={s.sectionMainTitle}>Fiscal Roadmap</Text>
                <TouchableOpacity onPress={() => router.push("/stakeholder/calendar")}>
                    <Text style={s.actionText}>Unified Calendar</Text>
                </TouchableOpacity>
             </View>
             
             <View style={s.timelineContainer}>
                {upcomingMilestones.length === 0 ? (
                    <Text style={s.emptyMsg}>Scan complete. No recent actions.</Text>
                ) : (
                    upcomingMilestones.map((log, index) => (
                        <View key={log.id} style={s.timelineItem}>
                            <View style={s.timelineSide}>
                                <View style={[s.dot, { backgroundColor: log.status === 'approved' ? (isDark ? '#34D399' : '#10B981') : T.accent }]} />
                                {index !== upcomingMilestones.length - 1 && <View style={s.line} />}
                            </View>
                            <View style={s.timelineContent}>
                                <Text style={s.logAction}>{log.status === 'completed' ? 'Verification Required' : 'Grant Verified'}</Text>
                                <Text style={s.logDetail}>{log.pitchTitle || 'Venture Asset'} • {log.title}</Text>
                                <Text style={s.logTime}>{(new Date(log.updatedAt?.seconds * 1000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        </View>
                    ))
                )}
             </View>
          </Animated.View>

          {/* NEAT ASSET GRID */}
          <Animated.View entering={FadeInDown.delay(600).springify()} style={s.sectionBox}>
             <View style={s.sectionHead}>
                <Text style={s.sectionMainTitle}>Managed Assets</Text>
             </View>
             <View style={s.assetGrid}>
                {projects.slice(0, 4).map((item) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={s.assetCard}
                        onPress={() => router.push({ pathname: "/stakeholder/pitch-details", params: { id: item.id } })}
                    >
                        <View style={s.assetTop}>
                            <View style={s.assetInitBg}>
                                <Text style={s.assetInit}>{item.title?.charAt(0)}</Text>
                            </View>
                            <View style={[s.statusPulse, { backgroundColor: item.status === 'active' ? (isDark ? '#34D399' : '#10B981') : (isDark ? '#FBBF24' : '#F59E0B') }]} />
                        </View>
                        <Text style={s.assetTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={s.assetCat}>{item.category || 'Tech Venture'}</Text>
                        <View style={s.assetStat}>
                            <Text style={s.assetVal}>${(item.raisedAmount/1000).toFixed(0)}k</Text>
                            <Text style={s.assetTag}>AUDITED</Text>
                        </View>
                    </TouchableOpacity>
                ))}
             </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>

      {/* BEAUTIFUL BOTTOM DOCK */}
      <BlurView intensity={isDark ? 50 : 80} tint={isDark ? "dark" : "light"} style={s.bottomDock}>
         <TouchableOpacity style={s.dockButton} onPress={() => router.push("/stakeholder/dashboard")}>
            <Ionicons name="shield-half" size={22} color={T.text} />
            <Text style={s.dockTextActive}>COMMAND</Text>
         </TouchableOpacity>
         <TouchableOpacity style={s.dockButton} onPress={() => router.push("/stakeholder/milestones")}>
            <Ionicons name="checkmark-circle-outline" size={22} color={T.subtext} />
            <Text style={s.dockText}>MEETING</Text>
         </TouchableOpacity>
         <TouchableOpacity style={s.dockButton} onPress={() => router.push("/stakeholder/calendar")}>
            <Ionicons name="git-branch-outline" size={22} color={T.subtext} />
            <Text style={s.dockText}>ROADMAP</Text>
         </TouchableOpacity>
         <TouchableOpacity style={s.dockButton} onPress={() => router.push("/profile")}>
            <Ionicons name="person-outline" size={22} color={T.subtext} />
            <Text style={s.dockText}>ACCOUNT</Text>
         </TouchableOpacity>
      </BlurView>

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        userData={userData}
        onLogout={handleLogout}
        router={router}
      />
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { 
      flexDirection: "row", 
      alignItems: "center", 
      justifyContent: "space-between", 
      paddingHorizontal: 20, 
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: T.border
    },
    headerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: T.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: T.border },
    headerCenter: { alignItems: "center" },
    breadcrumb: { fontSize: 9, fontWeight: "900", color: T.subtext, letterSpacing: 2 },
    headerTitle: { fontSize: 18, fontWeight: "800", color: T.text, marginTop: 2 },
    badge: { position: "absolute", top: 12, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444", borderWidth: 1, borderColor: T.surface },

    themeToggle: { justifyContent: 'center', alignItems: 'center', marginRight: 5 },
    toggleTrack: {
      width: 48, height: 26, borderRadius: 13,
      backgroundColor: isDark ? '#2A2A2A' : '#E2E8F0',
      borderWidth: 1, borderColor: isDark ? '#3A3A3A' : '#CBD5E1',
      justifyContent: 'center', position: 'relative',
    },
    toggleThumb: {
      position: 'absolute', left: 2,
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: isDark ? '#1A1A1A' : '#FFF',
      justifyContent: 'center', alignItems: 'center',
      elevation: 2, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3,
    },
    toggleThumbRight: { left: undefined, right: 2 },

    scrollBody: { paddingBottom: 110 },
    sessionRow: { paddingHorizontal: 25, marginTop: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sessionLabel: { fontSize: 9, fontWeight: "900", color: T.subtext, letterSpacing: 1 },
    sessionUser: { fontSize: 15, fontWeight: "800", color: T.text, marginTop: 4 },
    roleTag: { color: isDark ? '#60A5FA' : '#2563EB', fontSize: 13 },
    secureTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : "#F0FDF4", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
    secureText: { fontSize: 9, fontWeight: "900", color: "#22C55E", letterSpacing: 0.5 },

    kpiRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 25 },
    kpiCardWrapper: { flex: 1 },
    kpiCard: { height: 115, borderRadius: 24, overflow: "hidden", padding: 18, borderWidth: 1, borderColor: T.glassBorder, justifyContent: 'center', backgroundColor: T.glassBg, elevation: 8, shadowColor: T.accent, shadowOpacity: 0.1, shadowRadius: 15 },
    kpiTag: { fontSize: 8, fontWeight: "900", color: T.subtext, letterSpacing: 1.5, position: 'absolute', top: 15, left: 18 },
    kpiValue: { fontSize: 26, fontWeight: "900", color: T.text, marginTop: 10 },
    kpiProgress: { height: 3, backgroundColor: isDark ? '#1E293B' : "#E2E8F0", borderRadius: 2, marginTop: 15, overflow: 'hidden' },
    kpiFill: { height: "100%", borderRadius: 2 },

    chartSection: { marginHorizontal: 20, marginTop: 30, backgroundColor: T.glassBg, borderRadius: 32, padding: 25, borderWidth: 1, borderColor: T.glassBorder, elevation: 6, shadowColor: T.accent, shadowOpacity: 0.05, shadowRadius: 20 },
    sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionMainTitle: { fontSize: 18, fontWeight: "800", color: T.text, letterSpacing: 0.5 },
    sectionSubtitle: { fontSize: 12, color: T.subtext, marginTop: 4 },
    growthBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : "#F0FDF4", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    growthText: { fontSize: 11, fontWeight: "900", color: isDark ? '#34D399' : "#10B981" },
    chartWrapper: { marginTop: 25, alignItems: "center", paddingBottom: 10 },

    sectionBox: { marginTop: 35, paddingHorizontal: 20 },
    actionText: { fontSize: 13, fontWeight: "800", color: T.accent },
    
    timelineContainer: { backgroundColor: T.glassBg, borderRadius: 28, padding: 22, borderWidth: 1, borderColor: T.glassBorder, elevation: 4, shadowColor: T.accent, shadowOpacity: 0.05, shadowRadius: 15 },
    timelineItem: { flexDirection: "row" },
    timelineSide: { alignItems: "center", width: 24 },
    dot: { width: 8, height: 8, borderRadius: 4, zIndex: 1 },
    line: { width: 1, flex: 1, backgroundColor: T.border, marginVertical: 4 },
    timelineContent: { flex: 1, marginLeft: 15, paddingBottom: 25 },
    logAction: { fontSize: 14, fontWeight: "800", color: T.text },
    logDetail: { fontSize: 12, color: T.subtext, marginTop: 4 },
    logTime: { fontSize: 10, color: T.subtext, marginTop: 6, fontWeight: '700' },
    emptyMsg: { fontSize: 12, color: T.subtext, textAlign: "center", paddingVertical: 20 },

    assetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 15 },
    assetCard: { width: (width - 52) / 2, backgroundColor: T.glassBg, borderRadius: 28, padding: 18, borderWidth: 1, borderColor: T.glassBorder, elevation: 4, shadowColor: T.accent, shadowOpacity: 0.05, shadowRadius: 10 },
    assetTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
    assetInitBg: { width: 38, height: 38, borderRadius: 12, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', justifyContent: "center", alignItems: 'center' },
    assetInit: { fontSize: 18, fontWeight: "900", color: T.accent },
    statusPulse: { width: 6, height: 6, borderRadius: 3 },
    assetTitle: { fontSize: 15, fontWeight: "800", color: T.text },
    assetCat: { fontSize: 11, color: T.subtext, marginTop: 4, fontWeight: '600' },
    assetStat: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border },
    assetVal: { fontSize: 18, fontWeight: "900", color: T.text },
    assetTag: { fontSize: 8, fontWeight: "900", color: T.subtext, letterSpacing: 1, marginTop: 4 },

    bottomDock: { position: "absolute", bottom: 0, left: 0, right: 0, height: 90, borderTopWidth: 1, borderTopColor: T.border, flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingBottom: 25 },
    dockButton: { alignItems: "center", gap: 6 },
    dockText: { fontSize: 9, fontWeight: "900", color: T.subtext, letterSpacing: 1 },
    dockTextActive: { fontSize: 9, fontWeight: "900", color: T.text, letterSpacing: 1 }
  });
}