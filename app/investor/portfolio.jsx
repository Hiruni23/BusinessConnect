import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../../firebaseConfig";

export default function InvestorPortfolio() {
  const router = useRouter();
  const [investedPitches, setInvestedPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // Fetch only pitches this specific investor has "Accepted"
    // We assume you are tracking this via an array or a status update
    const q = query(
      collection(db, "pitches"),
      where("status", "==", "accepted")
      // If you want to show ONLY pitches this specific investor accepted:
      // where("acceptedBy", "==", user.uid) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvestedPitches(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderPortfolioItem = ({ item }) => (
    <TouchableOpacity
      style={styles.portfolioCard}
      onPress={() => router.push({ pathname: "/investor/pitch-details", params: { id: item.id } })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Ionicons name="briefcase" size={24} color="#4F46E5" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.pitchTitle}>{item.title || "Untitled"}</Text>
          <Text style={styles.categoryText}>{item.category || "General"}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>ACTIVE</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Funding Goal</Text>
          <Text style={styles.statValue}>${item.fundingGoal?.toLocaleString() || "0"}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Date Accepted</Text>
          <Text style={styles.statValue}>
            {item.updatedAt ? new Date(item.updatedAt.seconds * 1000).toLocaleDateString() : "Recent"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Portfolio</Text>
        <View style={{ width: 40 }} />
      </View>

      <LinearGradient 
        colors={['#4F46E5', '#3730A3']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.summaryCard}
      >
        <Text style={styles.summaryLabel}>Total Investments</Text>
        <Text style={styles.summaryValue}>{investedPitches.length}</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={investedPitches}
          keyExtractor={(item) => item.id}
          renderItem={renderPortfolioItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="pie-chart-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyText}>You haven't accepted any pitches yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  backBtn: { padding: 5, backgroundColor: "#FFFFFF", borderRadius: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  summaryLabel: { color: "#E0E7FF", fontSize: 14, fontWeight: "600" },
  summaryValue: { color: "#FFFFFF", fontSize: 36, fontWeight: "900", marginTop: 5 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  portfolioCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#94A3B8",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderLeftWidth: 4,
    borderColor: "#4F46E5",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  headerText: { flex: 1, marginLeft: 15 },
  pitchTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  categoryText: { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "500" },
  statusBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: "#4F46E5", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 15 },
  statItem: { flex: 1 },
  statLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 4, fontWeight: "600" },
  statValue: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { marginTop: 15, color: "#94A3B8", textAlign: "center", fontSize: 16, fontWeight: "500" },
});