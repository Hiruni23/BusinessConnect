import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

const CATEGORIES = [
  { id: "all", title: "All Categories", icon: "apps-outline", color: "#6366F1" },
  { id: "Angel", title: "Angel Investors", icon: "flash-outline", color: "#F59E0B" },
  { id: "VC", title: "Venture Capital", icon: "business-outline", color: "#3B82F6" },
  { id: "P2P", title: "P2P Lending", icon: "swap-horizontal-outline", color: "#10B981" },
  { id: "Incubator", title: "Incubators", icon: "egg-outline", color: "#8B5CF6" },
  { id: "Crowdfund", title: "Crowdfunding", icon: "people-outline", color: "#EC4899" },
];

export default function InvestorSelection() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedInvestorId, setSelectedInvestorId] = useState(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [investors, setInvestors] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchInvestors();
  }, [selectedCategory]);

  const fetchInvestors = async () => {
    setFetching(true);
    try {
      let q = query(collection(db, "users"), where("role", "in", ["investor", "Investor"]));
      if (selectedCategory !== "all") {
        q = query(collection(db, "users"), 
          where("role", "in", ["investor", "Investor"]),
          where("investorType", "==", selectedCategory)
        );
      }
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestors(list);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleBack = () => {
    router.replace("/entrepreneur/dashboard");
  };

  const handleContinue = async () => {
    if (!selectedInvestorId && selectedCategory === "all") {
      Alert.alert("Selection Required", "Please select an investor or a specific category.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          targetInvestorId: selectedInvestorId,
          targetInvestorCategory: selectedCategory,
          updatedAt: new Date().toISOString(),
        });
        router.push("/auth/category-selection");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save your selection.");
    } finally {
      setLoading(false);
    }
  };

  const CategoryDropdown = () => (
    <Modal visible={isDropdownVisible} transparent animationType="fade">
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setIsDropdownVisible(false)}
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownTitle}>Select Category</Text>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.dropdownItem, selectedCategory === cat.id && styles.activeDropdownItem]}
              onPress={() => {
                setSelectedCategory(cat.id);
                setIsDropdownVisible(false);
              }}
            >
              <Ionicons name={cat.icon} size={20} color={selectedCategory === cat.id ? "#fff" : "#64748B"} />
              <Text style={[styles.dropdownText, selectedCategory === cat.id && styles.activeDropdownText]}>
                {cat.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.heroTitle}>Strategic Partner</Text>
          <Text style={styles.heroSub}>Choose the expertise that will scale your innovation.</Text>

          {/* CATEGORY SELECTOR (DROPDOWN TRIGGER) */}
          <Text style={styles.sectionLabel}>INVESTOR SEGMENT</Text>
          <TouchableOpacity 
            style={styles.pickerTrigger} 
            onPress={() => setIsDropdownVisible(true)}
          >
            <View style={styles.pickerContent}>
              <Ionicons 
                name={CATEGORIES.find(c => c.id === selectedCategory)?.icon || "apps-outline"} 
                size={22} 
                color="#4F46E5" 
              />
              <Text style={styles.pickerText}>
                {CATEGORIES.find(c => c.id === selectedCategory)?.title}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>
            {selectedCategory === "all" ? "RECOMMENDED INVESTORS" : `${selectedCategory.toUpperCase()} INVESTORS`}
          </Text>

          {fetching ? (
            <ActivityIndicator color="#4F46E5" style={{ marginTop: 40 }} />
          ) : investors.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#E2E8F0" />
              <Text style={styles.emptyText}>No investors found in this category.</Text>
            </View>
          ) : (
            <View style={styles.investorGrid}>
              {investors.map((investor) => (
                <TouchableOpacity 
                  key={investor.id} 
                  style={[
                    styles.investorCard,
                    selectedInvestorId === investor.id && styles.activeCard
                  ]}
                  onPress={() => setSelectedInvestorId(investor.id)}
                >
                  <LinearGradient 
                    colors={selectedInvestorId === investor.id ? ['#4F46E5', '#6366F1'] : ['#FFFFFF', '#F8FAFC']} 
                    style={styles.cardGradient}
                  >
                    <View style={[styles.avatarCircle, selectedInvestorId === investor.id && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={[styles.avatarText, selectedInvestorId === investor.id && { color: '#fff' }]}>
                        {investor.fullName?.charAt(0) || "I"}
                      </Text>
                    </View>
                    <Text style={[styles.investorName, selectedInvestorId === investor.id && { color: '#fff' }]} numberOfLines={1}>
                      {investor.fullName || "Anonymous Investor"}
                    </Text>
                    <Text style={[styles.investorType, selectedInvestorId === investor.id && { color: 'rgba(255,255,255,0.8)' }]}>
                      {investor.investorType || "Strategist"}
                    </Text>
                    
                    {selectedInvestorId === investor.id && (
                      <View style={styles.checkIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.continueBtn, (!selectedInvestorId && selectedCategory === 'all') && styles.disabledBtn]} 
            onPress={handleContinue}
            disabled={loading || (!selectedInvestorId && selectedCategory === 'all')}
          >
            <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.btnGradient}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.continueText}>Confirm Strategic Choice</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <CategoryDropdown />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  progressTrack: { flex: 1, height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, marginHorizontal: 20 },
  progressFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 2 },
  
  scrollBody: { paddingHorizontal: 25, paddingBottom: 100 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#1E293B', marginTop: 20 },
  heroSub: { fontSize: 16, color: '#64748B', marginTop: 8, lineHeight: 24 },
  
  sectionLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginTop: 35, marginBottom: 15 },
  
  pickerTrigger: { 
    height: 65, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  pickerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickerText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  investorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 5 },
  investorCard: { 
    width: (width - 62) / 2, 
    height: 160, 
    borderRadius: 24, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  cardGradient: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  activeCard: { borderColor: '#4F46E5' },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#4F46E5' },
  investorName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  investorType: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  checkIcon: { position: 'absolute', top: 12, right: 12 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  continueBtn: { height: 60, borderRadius: 20, overflow: 'hidden' },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  disabledBtn: { opacity: 0.5 },

  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  dropdownContainer: { backgroundColor: '#fff', borderRadius: 32, padding: 25, elevation: 20 },
  dropdownTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 16, marginBottom: 8, gap: 12 },
  activeDropdownItem: { backgroundColor: '#4F46E5' },
  dropdownText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  activeDropdownText: { color: '#fff' },
  
  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 10, fontWeight: '600' }
});