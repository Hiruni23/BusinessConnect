import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, query, where, onSnapshot, getCountFromServer } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function ActivePitches() {
  const router = useRouter();
  const [activePitches, setActivePitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // Fetch ONLY pitches where status is "Open"
    const q = query(
      collection(db, "pitches"),
      where("entrepreneurId", "==", user.uid),
      where("status", "==", "Open")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const listWithViewCounts = await Promise.all(
          list.map(async (pitch) => {
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

        setActivePitches(listWithViewCounts);
      } catch (error) {
        console.error("Active Pitches View Count Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const renderActiveItem = ({ item }) => (
    <TouchableOpacity
      style={styles.activeCard}
      onPress={() => router.push({ pathname: "/entrepreneur/pitch-details", params: { id: item.id } })}
    >
      <View style={styles.cardTop}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE PITCH</Text>
        </View>
        <Text style={styles.pitchTitle}>{item.title}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{item.views || 0}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{item.interested || 0}</Text>
          <Text style={styles.statLabel}>Interested</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerInfo}>Target: ${item.fundingGoal?.toLocaleString()}</Text>
        <Ionicons name="arrow-forward-circle" size={24} color="#2563EB" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Active Pitches</Text>
        <View style={styles.headerSide} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activePitches}
          keyExtractor={(item) => item.id}
          renderItem={renderActiveItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="flash-off-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Active Pitches</Text>
              <Text style={styles.emptySub}>Pitches appear here while they are open for investment.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  headerSide: { width: 45 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "800", textAlign: "center", color: "#0F172A" },
  backBtn: { width: 45, height: 45, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2 },
  list: { padding: 20 },
  activeCard: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 16, elevation: 5, shadowColor: "#2563EB", shadowOpacity: 0.1, shadowRadius: 10 },
  cardTop: { marginBottom: 15 },
  liveIndicator: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2563EB", marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: "900", color: "#2563EB" },
  pitchTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
  statsRow: { flexDirection: "row", backgroundColor: "#F8FAFC", borderRadius: 16, padding: 15, marginBottom: 15 },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statDivider: { width: 1, height: "100%", backgroundColor: "#E2E8F0" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 15 },
  footerInfo: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  emptyState: { alignItems: "center", marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginTop: 20 },
  emptySub: { fontSize: 14, color: "#64748B", textAlign: "center", marginTop: 8, lineHeight: 20 },
});