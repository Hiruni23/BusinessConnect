import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../firebaseConfig";

export default function RoleSelection() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert("Select a role", "Please choose a role to continue");
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // ✅ Save role in lowercase (VERY IMPORTANT)
      await updateDoc(doc(db, "users", user.uid), {
        role: selectedRole,
        setupComplete: false,
      });

      // ✅ Navigate based on role
      switch (selectedRole) {
        case "entrepreneur":
          router.replace("/auth/investor-selection");
          break;

        case "investor":
          router.replace("/investor/dashboard");
          break;

        case "stakeholder":
          router.replace("/stakeholder/dashboard");
          break;

        case "customer":
          router.replace("/(tabs)/dashboard");
          break;

        default:
          router.replace("/");
      }
    } catch (error) {
      console.error("Role update error:", error);
      Alert.alert("Error", "Something went wrong while saving role.");
    }
  };

  // 🔹 Role Card Component
  const RoleCard = ({ value, label, image }) => {
    const isSelected = selectedRole === value;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.activeCard]}
        onPress={() => setSelectedRole(value)}
      >
        {/* Tick Circle */}
        <View
          style={[
            styles.tickCircle,
            isSelected && styles.tickCircleActive,
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          )}
        </View>

        <Image source={image} style={styles.image} />
        <Text style={styles.cardText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Role</Text>

      <View style={styles.grid}>
        <RoleCard
          value="entrepreneur"
          label="Entrepreneur"
          image={require("../../assets/roles/entrepreneur.png")}
        />

        <RoleCard
          value="investor"
          label="Investor"
          image={require("../../assets/roles/investor.png")}
        />

        <RoleCard
          value="stakeholder"
          label="Stakeholder"
          image={require("../../assets/roles/stakeholder.png")}
        />

        <RoleCard
          value="customer"
          label="Customer"
          image={require("../../assets/roles/customer.png")}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5C80F5",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#FFFFFF",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
    elevation: 4,
    position: "relative",
  },
  activeCard: {
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  tickCircle: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  tickCircleActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  image: {
    width: 160,
    height: 150,
    resizeMode: "contain",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  button: {
    backgroundColor: "#1109B4",
    padding: 16,
    borderRadius: 30,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});