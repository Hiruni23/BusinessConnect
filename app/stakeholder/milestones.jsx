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

export default function GlobalMilestones() {
  const router = useRouter();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

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

  const renderMilestone = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBg}>
          <Ionicons name="flag" size={20} color="#4F46E5" />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>Relating to: {item.pitchTitle || 'Project Venture'}</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.amountText}>${item.amount?.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, styles.approveBtn]} 
          onPress={() => handleMilestoneAction(item, 'approved')}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.btnText}>Approve Release</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btn, styles.rejectBtn]} 
          onPress={() => handleMilestoneAction(item, 'rejected')}
        >
          <Ionicons name="close-circle" size={18} color="#fff" />
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.viewProject}
        onPress={() => router.push({ pathname: "/stakeholder/pitch-details", params: { id: item.pitchId } })}
      >
        <Text style={styles.viewProjectText}>View Full Pitch Details</Text>
        <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vetting Queue</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>{milestones.length} Pending Approvals</Text>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color="#4F46E5" />
        ) : (
          <FlatList
            data={milestones}
            keyExtractor={(item) => item.id}
            renderItem={renderMilestone}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="checkmark-done-circle-outline" size={80} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Queue Clear!</Text>
                <Text style={styles.emptySub}>No milestones currently awaiting stakeholder review.</Text>
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
  },
  headerTitle: { fontSize: 20, fontFamily: 'outfit-bold', fontWeight: '900', color: '#1E293B' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  summaryBar: { marginHorizontal: 20, marginBottom: 15, backgroundColor: '#EEF2FF', padding: 12, borderRadius: 12, alignItems: 'center' },
  summaryText: { color: '#4F46E5', fontFamily: 'outfit-bold', fontSize: 13, fontWeight: '800' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontFamily: 'outfit-bold', fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 12, fontFamily: 'outfit-medium', color: '#94A3B8', marginTop: 2 },
  amountBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  amountText: { color: '#10B981', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800' },
  description: { color: '#64748B', fontSize: 14, fontFamily: 'outfit-medium', marginVertical: 15, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, gap: 6 },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  btnText: { color: '#fff', fontSize: 13, fontFamily: 'outfit-bold', fontWeight: '800' },
  viewProject: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 5 },
  viewProjectText: { color: '#4F46E5', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800', marginTop: 20 },
  emptySub: { fontSize: 14, fontFamily: 'outfit-medium', color: '#94A3B8', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
