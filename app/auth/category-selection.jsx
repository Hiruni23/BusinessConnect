import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function CategorySelection() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    "Education & Training",
    "Fashion & Apparel",
    "Food & Beverage",
    "Travel & Tourism",
    "Technology & Software",
  ];

  const handleFinishSetup = async () => {
    if (!selectedCategory) {
      Alert.alert("Selection Required", "Please select a category to continue.");
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Session Expired", "Please login again.");
        router.replace("/auth/login");
        return;
      }

      // 🔥 Save category in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        businessCategory: selectedCategory,
        setupComplete: true,
      });

      // 🔥 Pass category to create pitch
      router.replace({
        pathname: "/entrepreneur/create-pitch",
        params: { category: selectedCategory },
      });

    } catch (error) {
      console.error("Error saving category:", error);
      Alert.alert("Error", "Could not save your selection.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <Text style={styles.title}>Entrepreneur Setup</Text>

      {/* Illustration */}
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/roles/entrepreneur.png")}
          style={styles.mainImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.subTitle}>Select Business Category</Text>

      {/* Category List */}
      <View style={styles.listContainer}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.categoryItem,
              selectedCategory === item && styles.categoryActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <View
              style={[
                styles.checkbox,
                selectedCategory === item && styles.checked,
              ]}
            >
              {selectedCategory === item && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>

            <Text style={styles.categoryText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          !selectedCategory && { opacity: 0.6 },
        ]}
        onPress={handleFinishSetup}
        disabled={!selectedCategory}
      >
        <Text style={styles.actionBtnText}>
          Continue to Create Pitch
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8FAFC",
    padding: 25,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },

  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  mainImage: {
    width: "60%",
    height: "60%",
  },

  subTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },

  listContainer: {
    width: "100%",
  },

  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },

  categoryActive: {
    borderWidth: 2,
    borderColor: "#4F46E5",
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#4F46E5",
    borderRadius: 6,
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  checked: {
    backgroundColor: "#4F46E5",
  },

  categoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  actionBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 30,
    alignItems: "center",
  },

  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});