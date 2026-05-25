import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";
import { calculateMatchScore } from "../../utils/matchAlgorithm";
import { getCurrentUserProfile } from "../../services/recommendationService";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "high", label: "80%+" },
  { key: "medium", label: "50-79%" },
  { key: "low", label: "Below 50%" },
];

export default function InvestorSearchScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUserData(null);
      setPitches([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await getCurrentUserProfile(currentUser.uid);
        if (!cancelled) {
          setUserData(profile);
        }
      } catch (error) {
        console.error("Failed to load investor profile:", error);
      }
    };

    loadProfile();

    const q = query(
      collection(db, "pitches"),
      where("status", "in", ["Open", "pending", "approved", "accepted", "active", "funded"])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!cancelled) {
          setPitches(list);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Investor search pitches listener failed:", error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [currentUser]);

  const rankedPitches = useMemo(() => {
    const prefs = {
      interests: userData?.interests || [],
      maxInvestment: Number(userData?.maxInvestment) || Number.MAX_SAFE_INTEGER,
    };

    return pitches
      .map((pitch) => {
        const match = calculateMatchScore(pitch, prefs);
        return {
          ...pitch,
          matchScore: match.score,
          matchReason: match.matchReason,
        };
      })
      .filter((pitch) => {
        const haystack = `${pitch.title || ""} ${pitch.category || ""} ${pitch.description || ""} ${pitch.location || ""} ${pitch.aiSummary || ""}`.toLowerCase();
        return haystack.includes(searchText.trim().toLowerCase());
      })
      .filter((pitch) => {
        const score = Number(pitch.matchScore || 0);
        if (selectedFilter === "high") return score >= 80;
        if (selectedFilter === "medium") return score >= 50 && score < 80;
        if (selectedFilter === "low") return score < 50;
        return true;
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [pitches, searchText, selectedFilter, userData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#F8FAFC", "#EFF6FF", "#E0F2FE"]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.headerTitle}>Search Markets</Text>
            <Text style={styles.headerSubtitle}>Find pitches by name, category, or location</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/investor/recommendations')} style={styles.iconBtn}>
            <Ionicons name="sparkles" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search pitches, sectors, locations..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((filter) => {
              const active = selectedFilter === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(active ? "all" : filter.key)}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultCount}>{rankedPitches.length} results</Text>

            {rankedPitches.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No matches found</Text>
                <Text style={styles.emptyText}>Try another keyword or change the match filter.</Text>
              </View>
            ) : (
              rankedPitches.map((pitch) => (
                <TouchableOpacity
                  key={pitch.id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/investor/pitch-details', params: { id: pitch.id } })}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      {pitch.imageUrl ? (
                        <Image source={{ uri: pitch.imageUrl }} style={styles.avatarImage} />
                      ) : (
                        <Ionicons name="business-outline" size={20} color="#2563EB" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{pitch.title || 'Untitled Pitch'}</Text>
                      <Text style={styles.cardMeta} numberOfLines={1}>{pitch.category || 'Startup'} • {pitch.location || 'Global'}</Text>
                    </View>
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchBadgeText}>{pitch.matchScore || 0}%</Text>
                    </View>
                  </View>

                  <Text style={styles.cardDesc} numberOfLines={2}>{pitch.description || pitch.aiSummary || 'No description available.'}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.amountLabel}>Goal: ${Number(pitch.fundingGoal || pitch.requestedAmount || 0).toLocaleString()}</Text>
                    <View style={styles.openBtn}>
                      <Text style={styles.openBtnText}>Open</Text>
                      <Ionicons name="chevron-forward" size={14} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(148,163,184,0.16)' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  searchWrap: { paddingHorizontal: 20, marginTop: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A' },
  filterRow: { paddingVertical: 14, gap: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: 'transparent' },
  filterChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterText: { color: '#4F46E5', fontWeight: '800', fontSize: 12 },
  filterTextActive: { color: '#FFF' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  resultCount: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: 48, height: 48 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  cardMeta: { fontSize: 12, color: '#64748B', marginTop: 3 },
  matchBadge: { minWidth: 54, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#ECFDF5', alignItems: 'center' },
  matchBadgeText: { color: '#059669', fontWeight: '900', fontSize: 12 },
  cardDesc: { marginTop: 12, color: '#475569', fontSize: 13, lineHeight: 19 },
  cardFooter: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  openBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  emptyState: { marginTop: 50, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 10 },
  emptyText: { fontSize: 13, color: '#64748B', marginTop: 6, textAlign: 'center' },
});