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
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

export default function EntrepreneurMilestones() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams();
  const user = auth.currentUser;

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // New Milestone Form
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mAmount, setMAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    const q = query(collection(db, "milestones"), where("pitchId", "==", id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMilestones(list);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user]);

  const handleAddMilestone = async () => {
    if (!mTitle || !mDesc || !mAmount) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "milestones"), {
        pitchId: id,
        pitchTitle: title,
        entrepreneurId: user.uid,
        title: mTitle,
        description: mDesc,
        amount: Number(mAmount),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setModalVisible(false);
      setMTitle("");
      setMDesc("");
      setMAmount("");
      Alert.alert("Success", "Milestone defined. Complete it to trigger vetting.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add milestone.");
    } finally {
      setSubmitting(false);
    }
  };

  const markAsComplete = async (milestoneId) => {
    try {
      await updateDoc(doc(db, "milestones", milestoneId), {
        status: "completed", // This triggers stakeholder "Vetting Alerts"
        updatedAt: serverTimestamp(),
      });
      Alert.alert("Submitted", "Milestone marked as complete. A stakeholder will review it shortly.");
    } catch (e) {
      Alert.alert("Error", "Failed to update milestone.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'completed': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const renderMilestone = ({ item }) => (
    <View style={styles.milestoneCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mTitle}>{item.title}</Text>
          <Text style={styles.mAmount}>Target Value: ${item.amount?.toLocaleString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.mDesc}>{item.description}</Text>

      {item.status === 'pending' && (
        <TouchableOpacity style={styles.completeBtn} onPress={() => markAsComplete(item.id)}>
          <Ionicons name="checkmark-done" size={18} color="#fff" />
          <Text style={styles.completeBtnText}>Mark as Complete</Text>
        </TouchableOpacity>
      )}

      {item.status === 'rejected' && (
        <View style={styles.rejectNote}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.rejectText}>Revision required. Contact stakeholders for feedback.</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ flex: 1, paddingHorizontal: 15 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Governance: {title}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
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
                <Ionicons name="flag-outline" size={60} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Project Roadmaps</Text>
                <Text style={styles.emptySub}>Define milestones to track progress and release funding through stakeholder vetting.</Text>
                <TouchableOpacity style={styles.emptyAdd} onPress={() => setModalVisible(true)}>
                    <Text style={styles.emptyAddText}>Create First Milestone</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* ADD MODAL */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeader}>Define Milestone</Text>
              
              <Text style={styles.label}>Title</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Prototype Development" 
                value={mTitle}
                onChangeText={setMTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                placeholder="Detail the deliverables for this phase..." 
                multiline
                value={mDesc}
                onChangeText={setMDesc}
              />

              <Text style={styles.label}>Funding Request ($)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. 5000" 
                keyboardType="numeric"
                value={mAmount}
                onChangeText={setMAmount}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: '#64748B', fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.modalBtn, { backgroundColor: '#4F46E5' }]} 
                   onPress={handleAddMilestone}
                   disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Define Phase</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800' },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  list: { padding: 20 },
  milestoneCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mTitle: { fontSize: 16, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800' },
  mAmount: { fontSize: 12, color: '#10B981', fontFamily: 'outfit-bold', marginTop: 2 },
  mDesc: { color: '#64748B', fontSize: 14, fontFamily: 'outfit-medium', marginVertical: 15, lineHeight: 20 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: 'outfit-bold', fontWeight: '900' },
  completeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#4F46E5', 
    padding: 12, 
    borderRadius: 12, 
    gap: 8 
  },
  completeBtnText: { color: '#fff', fontSize: 13, fontFamily: 'outfit-bold', fontWeight: '700' },
  rejectNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10 },
  rejectText: { color: '#EF4444', fontSize: 12, fontFamily: 'outfit-medium' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800', marginTop: 20 },
  emptySub: { fontSize: 14, fontFamily: 'outfit-medium', color: '#94A3B8', marginTop: 10, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  emptyAdd: { marginTop: 30, backgroundColor: '#EEF2FF', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 16 },
  emptyAddText: { color: '#4F46E5', fontFamily: 'outfit-bold', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 32, padding: 25 },
  modalHeader: { fontSize: 22, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800', marginBottom: 20 },
  label: { fontSize: 12, fontFamily: 'outfit-bold', color: '#94A3B8', fontWeight: '800', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 14, padding: 14, fontFamily: 'outfit-medium', fontSize: 15, color: '#1E293B' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 25 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' }
});
