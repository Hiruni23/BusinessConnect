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
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

export default function StakeholderMeetings() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "meetings"),
      where("stakeholderId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort manually to avoid index requirement
      const sorted = list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMeetings(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);


  const handleStatusUpdate = async (id, status) => {
    try {
      await updateDoc(doc(db, "meetings", id), { status });
    } catch (e) {
        console.error(e);
    }
  };


  const renderMeeting = ({ item }) => (
    <View style={styles.meetingCard}>
      <View style={styles.meetingInfo}>
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{item.entrepreneurName?.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.meetingTitle}>{item.title}</Text>
            <Text style={styles.entrepreneurName}>Founder: {item.entrepreneurName}</Text>
            <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={styles.meetingDate}>{item.dateString}</Text>
            </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#ECFDF5' : '#EEF2FF' }]}>
            <Text style={[styles.statusText, { color: item.status === 'completed' ? '#10B981' : '#4F46E5' }]}>
                {item.status?.toUpperCase()}
            </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {item.status === 'scheduled' && (
            <TouchableOpacity 
                style={[styles.smallBtn, { backgroundColor: '#4F46E5' }]}
                onPress={() => handleStatusUpdate(item.id, 'completed')}
            >
                <Text style={styles.smallBtnText}>Complete</Text>
            </TouchableOpacity>
        )}
        <TouchableOpacity 
            style={[styles.smallBtn, { backgroundColor: '#F1F5F9' }]}
            onPress={() => {
                Alert.alert("Confirm", "Delete this session?", [
                    { text: "Cancel" },
                    { text: "Delete", onPress: () => deleteDoc(doc(db, "meetings", item.id)), style: 'destructive' }
                ])
            }}
        >
            <Text style={[styles.smallBtnText, { color: '#EF4444' }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Meeting Sessions</Text>
            <TouchableOpacity onPress={() => router.push("/stakeholder/schedule-meeting")} style={styles.headerBtn}>
                <Ionicons name="add" size={24} color="#4F46E5" />
            </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color="#4F46E5" />
        ) : (
          <FlatList
            data={meetings}
            keyExtractor={(item) => item.id}
            renderItem={renderMeeting}
            contentContainerStyle={styles.listPadding}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={60} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>No Sessions Scheduled</Text>
                    <Text style={styles.emptySub}>Start meeting startups by scheduling a session.</Text>
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
  headerBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  listPadding: { padding: 20 },
  meetingCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 28, 
    padding: 20, 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  meetingInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontFamily: 'outfit-bold', color: '#4F46E5', fontWeight: '800' },
  meetingTitle: { fontSize: 16, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800' },
  entrepreneurName: { fontSize: 13, fontFamily: 'outfit-medium', color: '#64748B', marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  meetingDate: { fontSize: 12, fontFamily: 'outfit-bold', color: '#94A3B8' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: 'outfit-bold', fontWeight: '800' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  smallBtnText: { color: '#fff', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800' },
  
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800', marginTop: 20 },
  emptySub: { fontSize: 14, fontFamily: 'outfit-medium', color: '#94A3B8', marginTop: 8, textAlign: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 32, padding: 25 },
  modalHeader: { fontSize: 22, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800', marginBottom: 20 },
  inputLabel: { fontSize: 12, fontFamily: 'outfit-bold', color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 14, padding: 14, fontFamily: 'outfit-medium', fontSize: 15, color: '#1E293B' },
  eItem: { padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', marginBottom: 6 },
  eItemSelected: { backgroundColor: '#4F46E5' },
  eItemText: { fontSize: 14, fontFamily: 'outfit-medium', color: '#1E293B' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 25 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' }
});
