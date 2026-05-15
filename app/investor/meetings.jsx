import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

export default function InvestorMeetings() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // Fetch meetings where user is the investor
    const q = query(
      collection(db, "meetings"),
      where("investorId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const sorted = list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMeetings(sorted);
      setLoading(false);
    }, (error) => {
      console.error('Meetings listener failed:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleJoin = (link, title) => {
    if (!link) return;
    if (link.includes("jit.si")) {
      router.push({
        pathname: "/investor/virtual-pitch-meeting",
        params: { url: link, title: title }
      });
    } else {
      Linking.openURL(link);
    }
  };

  const renderMeeting = ({ item }) => (
    <View style={styles.meetingCard}>
      <View style={styles.meetingInfo}>
        <View style={styles.avatar}>
           <Ionicons name="business-outline" size={24} color="#4F46E5" />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.meetingTitle}>{item.title}</Text>
            <Text style={styles.founderName}>Founder: {item.entrepreneurName}</Text>
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
        {item.meetingLink ? (
            <TouchableOpacity 
                style={[styles.smallBtn, { backgroundColor: '#4F46E5', flexDirection: 'row', gap: 6, flex: 1 }]}
                onPress={() => handleJoin(item.meetingLink, item.title)}
            >
                <Ionicons name="videocam" size={14} color="#fff" />
                <Text style={styles.smallBtnText}>Join Pitch Room</Text>
            </TouchableOpacity>
        ) : (
            <View style={[styles.smallBtn, { backgroundColor: '#F1F5F9', flex: 1 }]}>
                <Text style={[styles.smallBtnText, { color: '#94A3B8' }]}>No Virtual Link</Text>
            </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#EEF2FF']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pitch Sessions</Text>
            <View style={{ width: 40 }} />
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
                    <Ionicons name="videocam-outline" size={60} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>No Pitch Sessions</Text>
                    <Text style={styles.emptySub}>Your scheduled pitches with founders will appear here.</Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  headerBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 3, borderWidth: 1, borderColor: '#E2E8F0' },
  listPadding: { padding: 20 },
  meetingCard: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, marginBottom: 15, elevation: 3 },
  meetingInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  meetingTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  founderName: { fontSize: 13, color: '#64748B', marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  meetingDate: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  smallBtn: { paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
});
