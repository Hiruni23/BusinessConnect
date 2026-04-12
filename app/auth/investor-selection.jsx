import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

// Definining the 5 core strategic categories of funding
const INVESTOR_CATEGORIES = [
  {
    id: "Angel",
    title: "Angel Investors",
    description: "High-net-worth individuals providing early-stage seed capital.",
    icon: "flash-outline", // or 'rocket-outline'
    color: "#F59E0B",
  },
  {
    id: "VC",
    title: "Venture Capital",
    description: "Investment firms focusing on high-growth, scalable startups.",
    icon: "business-outline",
    color: "#3B82F6",
  },
  {
    id: "P2P",
    title: "P2P Lending",
    description: "Debt-based funding sourced from individuals via platforms.",
    icon: "swap-horizontal-outline",
    color: "#10B981",
  },
  {
    id: "Incubator",
    title: "Incubators & Accelerators",
    description: "Programs offering mentorship, resources, and seed investment.",
    icon: "egg-outline",
    color: "#8B5CF6",
  },
  {
    id: "Crowdfund",
    title: "Equity Crowdfunding",
    description: "Raising small amounts of capital from a large group of people.",
    icon: "people-outline",
    color: "#EC4899",
  },
];

export default function InvestorSelection() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/auth/role-selection");
  };

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert("Selection Required", "Please select a target investor category to continue.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Save the selection directly to the user's profile in Firestore
        await updateDoc(doc(db, "users", user.uid), {
          investorType: selected,
          targetInvestorCategory: selected,
          onboardingStep: 'category-selection', // Helpful for session tracking
          updatedAt: new Date().toISOString(),
        });
        
        // Move to the next screen in the onboarding flow
        router.push("/auth/category-selection");
      }
    } catch (error) {
      console.error("Firestore Update Error:", error);
      Alert.alert("Error", "Failed to save your selection. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER WITH PROGRESS BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: "66%" }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Target Investors</Text>
        <Text style={styles.subtitle}>
          Which category of investors best matches your current funding goals?
        </Text>

        <View style={styles.cardContainer}>
          {INVESTOR_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.8}
              style={[
                styles.card,
                selected === category.id && { 
                  borderColor: category.color,
                  backgroundColor: category.color + "05" // super light tint
                },
              ]}
              onPress={() => setSelected(category.id)}
            >
              <View style={[styles.iconBox, { backgroundColor: category.color + "15" }]}>
                <Ionicons name={category.icon} size={28} color={category.color} />
              </View>
              
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{category.title}</Text>
                <Text style={styles.cardDesc}>{category.description}</Text>
              </View>
              
              {selected === category.id && (
                <View style={[styles.selectedIndicator, { backgroundColor: category.color }]}>
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ACTION FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading || !selected}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { padding: 5 },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginLeft: 15,
  },
  progressBar: { height: 6, backgroundColor: "#4F46E5", borderRadius: 3 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginTop: 25 },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 8, marginBottom: 35 },
  cardContainer: { gap: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  cardText: { flex: 1, marginLeft: 16, paddingRight: 10 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937" },
  cardDesc: { fontSize: 13, color: "#6B7280", marginTop: 3 },
  selectedIndicator: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#FFFFFF" },
  continueButton: {
    backgroundColor: "#4F46E5",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueButtonDisabled: { backgroundColor: "#D1D5DB" },
  continueText: { color: "white", fontSize: 18, fontWeight: "700" },
});