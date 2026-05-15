import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../../firebaseConfig";

const { width } = Dimensions.get("window");

export default function CategorySelection() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    { id: "Education & Training", title: "Education & Training", icon: "school-outline" },
    { id: "Fashion & Apparel", title: "Fashion & Apparel", icon: "shirt-outline" },
    { id: "Food & Beverage", title: "Food & Beverage", icon: "restaurant-outline" },
    { id: "Travel & Tourism", title: "Travel & Tourism", icon: "airplane-outline" },
    { id: "Technology & Software", title: "Technology & Software", icon: "hardware-chip-outline" },
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.brandBadge}>
            <Ionicons name="briefcase" size={16} color="#4F46E5" />
            <Text style={styles.brandText}>ENTREPRENEUR SETUP</Text>
          </View>
          <Text style={styles.title}>Define Your Industry</Text>
          <Text style={styles.subTitle}>Select the primary sector that best represents your business venture.</Text>
        </View>

        {/* Category List */}
        <View style={styles.listContainer}>
          {categories.map((item) => {
            const isActive = selectedCategory === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryItem,
                  isActive && styles.categoryActive,
                ]}
                onPress={() => setSelectedCategory(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isActive && styles.iconActive]}>
                  <Ionicons 
                    name={item.icon} 
                    size={24} 
                    color={isActive ? "#FFFFFF" : "#64748B"} 
                  />
                </View>
                
                <View style={styles.textContainer}>
                  <Text style={[styles.categoryTitle, isActive && styles.categoryTitleActive]}>
                    {item.title}
                  </Text>
                </View>

                <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                  {isActive && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* Bottom Action Area */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleFinishSetup}
          disabled={!selectedCategory}
          style={!selectedCategory && { opacity: 0.5 }}
        >
          <LinearGradient
            colors={['#4F46E5', '#3730A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>Continue to Dashboard</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
    marginTop: 10,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 16,
    color: "#64748B",
    lineHeight: 24,
  },
  listContainer: {
    gap: 16,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 4,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  categoryActive: {
    borderColor: "#4F46E5",
    backgroundColor: "#F5F8FF",
    elevation: 8,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconActive: {
    backgroundColor: "#4F46E5",
  },
  textContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  categoryTitleActive: {
    color: "#4F46E5",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: {
    borderColor: "#4F46E5",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4F46E5",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 24,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  actionBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
});