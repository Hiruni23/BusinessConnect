import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, query, where, onSnapshot, orderBy, getCountFromServer } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function MyPitches() {
  const router = useRouter();
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // Real-time listener for pitches created by this user
    const q = query(
      collection(db, "pitches"),
      where("entrepreneurId", "==", user.uid),
      orderBy("createdAt", "desc")
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

        setPitches(listWithViewCounts);
      } catch (error) {
        console.error("My Pitches View Count Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Search filter logic
  const filteredPitches = pitches.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPitchItem = ({ item }) => {
    const raised = item.raisedAmount || 0;
    const goal = item.fundingGoal || 1;
    const progress = Math.min(raised / goal, 1);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: "/entrepreneur/pitch-details", params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.categoryText}>{item.category?.toUpperCase() || "STARTUP"}</Text>
            <Text style={styles.pitchTitle}>{item.title}</Text>
          </View>
          <View style={[styles.statusChip, item.status === 'accepted' ? styles.chipAccepted : styles.chipOpen]}>
            <Text style={[styles.statusText, item.status === 'accepted' ? styles.textAccepted : styles.textOpen]}>
              {item.status?.toUpperCase() || "OPEN"}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.raisedAmount}>${raised.toLocaleString()}</Text>
            <Text style={styles.goalAmount}>raised of ${goal.toLocaleString()}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerStat}>
            <Ionicons name="people-outline" size={16} color="#64748B" />
            <Text style={styles.footerStatText}>{item.interested || 0} Investors</Text>
          </View>
          <View style={styles.footerStat}>
            <Ionicons name="eye-outline" size={16} color="#64748B" />
            <Text style={styles.footerStatText}>{item.views || 0} Views</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* PROFESSIONAL CENTERED HEADER */}
      <View style={styles.header}>
        {/* Left Icon (Fixed Width) */}
        <View style={styles.headerSideContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Centered Title */}
        <Text style={styles.headerTitle}>My Projects</Text>

        {/* Invisible Right Spacer (Ensures title stays perfectly centered) */}
        <View style={styles.headerSideContainer} />
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your pitches..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPitches}
          keyExtractor={(item) => item.id}
          renderItem={renderPitchItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="rocket-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No pitches found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  
  // Header Styles
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  headerSideContainer: {
    width: 45, // Fixed width to balance the center
  },
  headerTitle: { 
    flex: 1, 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#0F172A",
    textAlign: "center",
  },
  iconBtn: { 
    width: 45, 
    height: 45, 
    borderRadius: 12, 
    backgroundColor: "#fff", 
    justifyContent: "center", 
    alignItems: "center", 
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Search Styles
  searchContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    marginHorizontal: 20, 
    paddingHorizontal: 15, 
    borderRadius: 15, 
    height: 50, 
    marginBottom: 15, 
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#1E293B" },

  // Card Styles
  listContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { 
    backgroundColor: "#fff", 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    elevation: 4, 
    shadowColor: "#000", 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  categoryText: { fontSize: 10, fontWeight: "800", color: "#2563EB", letterSpacing: 1 },
  pitchTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginTop: 4 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipOpen: { backgroundColor: "#DBEAFE" },
  chipAccepted: { backgroundColor: "#DCFCE7" },
  statusText: { fontSize: 10, fontWeight: "900" },
  textOpen: { color: "#2563EB" },
  textAccepted: { color: "#16A34A" },

  // Progress Styles
  progressSection: { marginBottom: 20 },
  progressInfo: { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
  raisedAmount: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
  goalAmount: { fontSize: 12, color: "#64748B", marginLeft: 4 },
  progressBarBg: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4 },
  progressBarFill: { height: 8, backgroundColor: "#2563EB", borderRadius: 4 },

  // Footer Styles
  cardFooter: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 15, gap: 20 },
  footerStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerStatText: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  // Empty State
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { marginTop: 10, color: "#94A3B8", fontSize: 16, fontWeight: "600" }
});