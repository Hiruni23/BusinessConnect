import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";

const { width } = Dimensions.get("window");

export default function RoleSelection() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { uid, fullName, email, phoneNumber } = params;
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert("Select a role", "Please choose a role to continue");
      return;
    }

    try {
      setIsSubmitting(true);
      const user = auth.currentUser;

      // Require an authenticated user. Firestore rules mandate request.auth.uid
      // must match the document ID for user writes — avoid using a params fallback.
      if (!user || !user.uid) {
        Alert.alert("Error", "You must be signed in to complete setup.");
        setIsSubmitting(false);
        return;
      }

      const userId = user.uid;

      // ✅ Create user document in Firestore with all details
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        fullName: fullName || (user && user.displayName) || "User",
        email: email || (user && user.email) || '',
        phoneNumber: phoneNumber || "",
        role: selectedRole,
        createdAt: serverTimestamp(),
        setupComplete: false,
      });

      // ✅ Navigate based on role
      switch (selectedRole) {
        case "entrepreneur":
          router.replace("/entrepreneur/dashboard");
          break;
        case "investor":
          router.replace("/investor/dashboard");
          break;
        case "stakeholder":
          router.replace("/stakeholder/dashboard");
          break;
        case "customer":
          router.replace("/customer/dashboard");
          break;
        default:
          router.replace("/");
      }
    } catch (error) {
      console.error("Role save error:", error);
      Alert.alert("Error", "Something went wrong while saving your role.");
      setIsSubmitting(false);
    }
  };

  const roles = [
    {
      id: "entrepreneur",
      title: "Entrepreneur",
      subtitle: "Raise capital & grow",
      image: require("../../assets/roles/entrepreneur.png"),
    },
    {
      id: "investor",
      title: "Investor",
      subtitle: "Fund startups",
      image: require("../../assets/roles/investor.png"),
    },
    {
      id: "stakeholder",
      title: "Stakeholder",
      subtitle: "Govern & oversee",
      image: require("../../assets/roles/stakeholder.png"),
    },
    {
      id: "customer",
      title: "Customer",
      subtitle: "Discover products",
      image: require("../../assets/roles/customer.png"),
    },
  ];

  return (
    <LinearGradient
      colors={['#0F172A', '#1E3A8A', '#020617']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>Welcome to BusinessConnect</Text>
            <Text style={styles.title}>Choose Your Path</Text>
            <Text style={styles.subtitle}>
              Select the role that best describes how you'll use the platform.
            </Text>
          </View>

          <View style={styles.grid}>
            {roles.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  activeOpacity={0.8}
                  style={styles.cardContainer}
                  onPress={() => setSelectedRole(role.id)}
                >
                  <BlurView 
                    intensity={40} 
                    tint="dark" 
                    style={[styles.card, isSelected && styles.activeCard]}
                  >
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>

                    <View style={styles.imageContainer}>
                      <Image source={role.image} style={styles.image} />
                    </View>

                    <Text style={styles.cardTitle}>{role.title}</Text>
                    <Text style={styles.cardSubtitle}>{role.subtitle}</Text>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Spacer to ensure content isn't hidden behind the floating button */}
          <View style={styles.spacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !selectedRole && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!selectedRole || isSubmitting}
          >
            <Text style={[styles.buttonText, !selectedRole && styles.buttonTextDisabled]}>
              {isSubmitting ? "Setting up..." : "Continue"}
            </Text>
            {!isSubmitting && (
              <Ionicons
                name="arrow-forward"
                size={20}
                color={!selectedRole ? "rgba(255,255,255,0.4)" : "#FFFFFF"}
                style={styles.buttonIcon}
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B82F6",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  cardContainer: {
    width: (width - 48) / 2, // 2 columns: window width minus padding
    marginBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
  },
  card: {
    flex: 1,
    padding: 16,
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
  },
  activeCard: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderColor: "#3B82F6",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
  },
  radioActive: {
    borderColor: "#3B82F6",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  image: {
    width: 90,
    height: 90,
    resizeMode: "contain",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
  },
  spacer: {
    height: 100,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 32, // Extra padding for safe area on iOS
    backgroundColor: "transparent",
  },
  button: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: "rgba(255,255,255,0.4)",
  },
  buttonIcon: {
    marginTop: 2,
  },
});