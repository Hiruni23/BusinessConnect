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

const { width } = Dimensions.get("window");

export default function StakeholderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState([]);
  const [meetingsCount, setMeetingsCount] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const [milestonesToReview, setMilestonesToReview] = useState(0);
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

    return () => { unsubProjects(); unsubPulse(); unsubNotifs(); unsubMeetings(); unsubReview(); };
  }, [user, userData]);

  const chartData = useMemo(() => [
    { value: 10, label: "Q1" }, { value: 25, label: "Q2" }, { value: 18, label: "Q3" }, { value: 32, label: "Q4" }
  ], []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth/login");
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="#1E293B" />
      </View>
    );
  }

  const username = userData?.fullName?.split(" ")[0] || "Stakeholder";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#FDFDFD", "#F8FAFC"]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* NEAT HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerIcon}>
            <Ionicons name="grid" size={20} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>BusinessConnect</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/stakeholder/notifications")} style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={22} color="#1E293B" />
            {hasUnread && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          
          {/* BEAUTIFUL SESSION BAR */}
          <View style={styles.sessionRow}>
            <View>
                <Text style={styles.sessionLabel}>ACTIVE SESSION</Text>
                <Text style={styles.sessionUser}>{username} <Text style={styles.roleTag}>• STAKEHOLDER</Text></Text>
            </View>
            <View style={styles.secureTag}>
                <View style={styles.liveDot} />
                <Text style={styles.secureText}>SYSTEM SECURE</Text>
            </View>
          </View>

          {/* NEAT KPI CARDS */}
          <View style={styles.kpiRow}>
             <TouchableOpacity style={styles.kpiCard} onPress={() => router.push("/stakeholder/milestones")}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <Text style={styles.kpiTag}>VETTING QUEUE</Text>
                <Text style={styles.kpiValue}>{milestonesToReview}</Text>
                <View style={styles.kpiProgress}>
                    <View style={[styles.kpiFill, { width: '65%', backgroundColor: '#F59E0B' }]} />
                </View>
             </TouchableOpacity>

             <TouchableOpacity style={styles.kpiCard} onPress={() => router.push("/stakeholder/meetings")}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <Text style={styles.kpiTag}>SESSIONS</Text>
                <Text style={styles.kpiValue}>{meetingsCount}</Text>
                <View style={styles.kpiProgress}>
                    <View style={[styles.kpiFill, { width: '40%', backgroundColor: '#4F46E5' }]} />
                </View>
             </TouchableOpacity>

             <TouchableOpacity style={[styles.kpiCard, { marginRight: 0 }]} onPress={() => router.push("/stakeholder/analytics")}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <Text style={styles.kpiTag}>ALPHA ROI</Text>
                <Text style={styles.kpiValue}>92</Text>
                <View style={styles.kpiProgress}>
                    <View style={[styles.kpiFill, { width: '85%', backgroundColor: '#10B981' }]} />
                </View>
             </TouchableOpacity>
          </View>

          {/* POLISHED MARKET CHART */}
          <View style={styles.chartSection}>
             <View style={styles.sectionHead}>
                <Text style={styles.sectionMainTitle}>Market Intelligence</Text>
                <View style={styles.growthBadge}>
                    <Ionicons name="trending-up" size={12} color="#10B981" />
                    <Text style={styles.growthText}>+12.4%</Text>
                </View>
             </View>
             <Text style={styles.sectionSubtitle}>Cross-portfolio capital audit visualization</Text>
             
             <View style={styles.chartWrapper}>
                <LineChart
                    data={chartData}
                    height={130}
                    width={width - 80}
                    initialSpacing={10}
                    spacing={(width - 100) / 3.5}
                    color="#1E293B"
                    thickness={3}
                    startFillColor="rgba(30, 41, 59, 0.05)"
                    endFillColor="rgba(30, 41, 59, 0.01)"
                    startOpacity={0.1}
                    endOpacity={0.01}
                    noOfSections={3}
                    yAxisColor="transparent"
                    xAxisColor="#F1F5F9"
                    dataPointsColor="#1E293B"
                    dataPointsRadius={4}
                    curved
                    hideYAxisText
                    xAxisLabelsVerticalShift={5}
                    xAxisLabelTextStyle={{ fontSize: 10, color: '#94A3B8', fontWeight: '800' }}
                />
             </View>
          </View>

          {/* BEAUTIFUL ROADMAP */}
          <View style={styles.sectionBox}>
             <View style={styles.sectionHead}>
                <Text style={styles.sectionMainTitle}>Fiscal Roadmap</Text>
                <TouchableOpacity onPress={() => router.push("/stakeholder/calendar")}>
                    <Text style={styles.actionText}>Unified Calendar</Text>
                </TouchableOpacity>
             </View>
             
             <View style={styles.timelineContainer}>
                {upcomingMilestones.length === 0 ? (
                    <Text style={styles.emptyMsg}>Scan complete. No recent actions.</Text>
                ) : (
                    upcomingMilestones.map((log, index) => (
                        <View key={log.id} style={styles.timelineItem}>
                            <View style={styles.timelineSide}>
                                <View style={[styles.dot, { backgroundColor: log.status === 'approved' ? '#10B981' : '#6366F1' }]} />
                                {index !== upcomingMilestones.length - 1 && <View style={styles.line} />}
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.logAction}>{log.status === 'completed' ? 'Verification Required' : 'Grant Verified'}</Text>
                                <Text style={styles.logDetail}>{log.pitchTitle || 'Venture Asset'} • {log.title}</Text>
                                <Text style={styles.logTime}>{(new Date(log.updatedAt?.seconds * 1000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        </View>
                    ))
                )}
             </View>
          </View>

          {/* NEAT ASSET GRID */}
          <View style={styles.sectionBox}>
             <View style={styles.sectionHead}>
                <Text style={styles.sectionMainTitle}>Managed Assets</Text>
             </View>
             <View style={styles.assetGrid}>
                {projects.slice(0, 4).map((item) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={styles.assetCard}
                        onPress={() => router.push({ pathname: "/stakeholder/pitch-details", params: { id: item.id } })}
                    >
                        <View style={styles.assetTop}>
                            <View style={styles.assetInitBg}>
                                <Text style={styles.assetInit}>{item.title?.charAt(0)}</Text>
                            </View>
                            <View style={[styles.statusPulse, { backgroundColor: item.status === 'active' ? '#10B981' : '#F59E0B' }]} />
                        </View>
                        <Text style={styles.assetTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.assetCat}>{item.category || 'Tech Venture'}</Text>
                        <View style={styles.assetStat}>
                            <Text style={styles.assetVal}>${(item.raisedAmount/1000).toFixed(0)}k</Text>
                            <Text style={styles.assetTag}>AUDITED</Text>
                        </View>
                    </TouchableOpacity>
                ))}
             </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* BEAUTIFUL BOTTOM DOCK */}
      <BlurView intensity={80} tint="light" style={styles.bottomDock}>
         <TouchableOpacity style={styles.dockButton} onPress={() => router.push("/stakeholder/dashboard")}>
            <Ionicons name="shield-half" size={22} color="#1E293B" />
            <Text style={styles.dockTextActive}>COMMAND</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.dockButton} onPress={() => router.push("/stakeholder/milestones")}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#94A3B8" />
            <Text style={styles.dockText}>MEETING</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.dockButton} onPress={() => router.push("/stakeholder/calendar")}>
            <Ionicons name="git-branch-outline" size={22} color="#94A3B8" />
            <Text style={styles.dockText}>ROADMAP</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.dockButton} onPress={() => router.push("/profile")}>
            <Ionicons name="person-outline" size={22} color="#94A3B8" />
            <Text style={styles.dockText}>ACCOUNT</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC"
  },
  headerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" },
  headerCenter: { alignItems: "center" },
  breadcrumb: { fontSize: 9, fontWeight: "900", color: "#CBD5E1", letterSpacing: 2 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginTop: 2 },
  badge: { position: "absolute", top: 12, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444", borderWidth: 1, borderColor: "#fff" },

  scrollBody: { paddingBottom: 110 },
  sessionRow: { paddingHorizontal: 25, marginTop: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionLabel: { fontSize: 9, fontWeight: "900", color: "#94A3B8", letterSpacing: 1 },
  sessionUser: { fontSize: 15, fontWeight: "800", color: "#1E293B", marginTop: 4 },
  roleTag: { color: "#6366F1", fontSize: 13 },
  secureTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F0FDF4", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  secureText: { fontSize: 9, fontWeight: "900", color: "#22C55E", letterSpacing: 0.5 },

  kpiRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 25, gap: 12 },
  kpiCard: { flex: 1, height: 115, borderRadius: 24, overflow: "hidden", padding: 18, borderWidth: 1, borderColor: "#F1F5F9", justifyContent: 'center' },
  kpiTag: { fontSize: 8, fontWeight: "900", color: "#94A3B8", letterSpacing: 1, position: 'absolute', top: 15, left: 18 },
  kpiValue: { fontSize: 26, fontWeight: "900", color: "#1E293B", marginTop: 10 },
  kpiProgress: { height: 3, backgroundColor: "#F1F5F9", borderRadius: 2, marginTop: 15, overflow: 'hidden' },
  kpiFill: { height: "100%", borderRadius: 2 },

  chartSection: { marginHorizontal: 20, marginTop: 30, backgroundColor: "#FFFFFF", borderRadius: 32, padding: 25, borderWidth: 1, borderColor: "#F1F5F9", elevation: 2, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 20 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionMainTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  sectionSubtitle: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  growthBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  growthText: { fontSize: 11, fontWeight: "900", color: "#10B981" },
  chartWrapper: { marginTop: 25, alignItems: "center", paddingBottom: 10 },

  sectionBox: { marginTop: 35, paddingHorizontal: 20 },
  actionText: { fontSize: 13, fontWeight: "800", color: "#4F46E5" },
  
  timelineContainer: { backgroundColor: "#fff", borderRadius: 28, padding: 22, borderWidth: 1, borderColor: "#F1F5F9", elevation: 1 },
  timelineItem: { flexDirection: "row" },
  timelineSide: { alignItems: "center", width: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, zIndex: 1 },
  line: { width: 1, flex: 1, backgroundColor: "#F1F5F9", marginVertical: 4 },
  timelineContent: { flex: 1, marginLeft: 15, paddingBottom: 25 },
  logAction: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  logDetail: { fontSize: 12, color: "#64748B", marginTop: 4 },
  logTime: { fontSize: 10, color: "#CBD5E1", marginTop: 6, fontWeight: '700' },
  emptyMsg: { fontSize: 12, color: "#CBD5E1", textAlign: "center", paddingVertical: 20 },

  assetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 5 },
  assetCard: { width: (width - 52) / 2, backgroundColor: "#FFFFFF", borderRadius: 28, padding: 18, borderWidth: 1, borderColor: "#F1F5F9", elevation: 2, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 10 },
  assetTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  assetInitBg: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: 'center' },
  assetInit: { fontSize: 18, fontWeight: "900", color: "#4F46E5" },
  statusPulse: { width: 6, height: 6, borderRadius: 3 },
  assetTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  assetCat: { fontSize: 11, color: "#94A3B8", marginTop: 4, fontWeight: '600' },
  assetStat: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F8FAFC" },
  assetVal: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  assetTag: { fontSize: 8, fontWeight: "900", color: "#CBD5E1", letterSpacing: 1, marginTop: 4 },

  bottomDock: { position: "absolute", bottom: 0, left: 0, right: 0, height: 90, borderTopWidth: 1, borderTopColor: "#F1F5F9", flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingBottom: 25 },
  dockButton: { alignItems: "center", gap: 6 },
  dockText: { fontSize: 9, fontWeight: "900", color: "#CBD5E1", letterSpacing: 1 },
  dockTextActive: { fontSize: 9, fontWeight: "900", color: "#1E293B", letterSpacing: 1 }
});