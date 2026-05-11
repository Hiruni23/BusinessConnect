import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export default function GlobalMilestones() {
  const router = useRouter();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();

  useEffect(() => {
    if (!user) return;

    // Listen to ALL completed milestones that need review
    const q = query(
      collection(db, "milestones"),
      where("status", "==", "completed")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMilestones(list);
      setLoading(false);
    }, (error) => {
      console.error("Global Milestones Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMilestoneAction = async (milestone, newStatus) => {
    try {
      await updateDoc(doc(db, "milestones", milestone.id), {
        status: newStatus,
        vettedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

      // Send notification to entrepreneur
      await addDoc(collection(db, "notifications"), {
        userId: milestone.entrepreneurId,
        title: `Vetting Update: ${newStatus.toUpperCase()}`,
        message: `Your milestone "${milestone.title}" has been ${newStatus} by a stakeholder.`,
        type: "MILESTONE_UPDATE",
        isRead: false,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", `Milestone was successfully ${newStatus}.`);
    } catch (error) {
      console.error("Action Error:", error);
      Alert.alert("Error", "Failed to update milestone status.");
    }
  };

  const renderMilestone = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(100 + index * 100).springify()} style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.iconBg}>
          <Ionicons name="flag" size={20} color={T.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.subtitle}>Relating to: {item.pitchTitle || 'Project Venture'}</Text>
        </View>
        <View style={s.amountBadge}>
          <Text style={s.amountText}>${item.amount?.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={s.description}>{item.description}</Text>

      <View style={s.actions}>
        <TouchableOpacity 
          style={[s.btn, s.approveBtn]} 
          onPress={() => handleMilestoneAction(item, 'approved')}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={s.btnText}>Approve Release</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[s.btn, s.rejectBtn]} 
          onPress={() => handleMilestoneAction(item, 'rejected')}
        >
          <Ionicons name="close-circle" size={18} color="#fff" />
          <Text style={s.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={s.viewProject}
        onPress={() => router.push({ pathname: "/stakeholder/pitch-details", params: { id: item.pitchId } })}
      >
        <Text style={s.viewProjectText}>View Full Pitch Details</Text>
        <Ionicons name="arrow-forward" size={14} color={T.accent} />
      </TouchableOpacity>
    </Animated.View>
  );

  const s = makeStyles(T, isDark);

  return (
    <View style={s.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
      <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Vetting Queue</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.summaryBar}>
            <Text style={s.summaryText}>{milestones.length} Pending Approvals</Text>
        </Animated.View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color={T.accent} />
        ) : (
          <FlatList
            data={milestones}
            keyExtractor={(item) => item.id}
            renderItem={renderMilestone}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="checkmark-done-circle-outline" size={80} color={T.subtext} />
                <Text style={s.emptyTitle}>Queue Clear!</Text>
                <Text style={s.emptySub}>No milestones currently awaiting stakeholder review.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    headerTitle: { fontSize: 20, fontFamily: 'outfit-bold', fontWeight: '900', color: T.text, letterSpacing: 0.5 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.glassBg, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: T.accent, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: T.glassBorder },
    summaryBar: { marginHorizontal: 20, marginBottom: 15, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', padding: 12, borderRadius: 12, alignItems: 'center' },
    summaryText: { color: T.accent, fontFamily: 'outfit-bold', fontSize: 13, fontWeight: '800' },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { backgroundColor: T.glassBg, borderRadius: 28, padding: 20, marginBottom: 15, elevation: 4, shadowColor: T.accent, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1, borderColor: T.glassBorder },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 16, fontFamily: 'outfit-bold', fontWeight: '800', color: T.text },
    subtitle: { fontSize: 12, fontFamily: 'outfit-medium', color: T.subtext, marginTop: 2 },
    amountBadge: { backgroundColor: isDark ? 'rgba(52,211,153,0.1)' : '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    amountText: { color: isDark ? '#34D399' : '#10B981', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800' },
    description: { color: T.subtext, fontSize: 14, fontFamily: 'outfit-medium', marginVertical: 15, lineHeight: 20 },
    actions: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, gap: 6 },
    approveBtn: { backgroundColor: isDark ? '#34D399' : '#10B981' },
    rejectBtn: { backgroundColor: '#EF4444' },
    btnText: { color: '#fff', fontSize: 13, fontFamily: 'outfit-bold', fontWeight: '800' },
    viewProject: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: T.glassBorder, gap: 5 },
    viewProjectText: { color: T.accent, fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontFamily: 'outfit-bold', color: T.text, fontWeight: '800', marginTop: 20, letterSpacing: 0.5 },
    emptySub: { fontSize: 14, fontFamily: 'outfit-medium', color: T.subtext, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  });
}
