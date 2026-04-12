import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function InvestorProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    phone: "",
    investorType: "Angel Investor",
    bio: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    } catch (error) {
      console.error("Fetch Profile Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid), userData);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Could not update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#047857" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#064E3B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investor Profile</Text>
        <TouchableOpacity onPress={handleUpdate} disabled={updating}>
          {updating ? (
            <ActivityIndicator size="small" color="#047857" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PROFILE SECTION */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {userData.fullName?.charAt(0) || "I"}
            </Text>
            <TouchableOpacity style={styles.editIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{userData.fullName || "Investor"}</Text>
          
          {/* VERIFIED INVESTOR BADGE */}
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#047857" />
            <Text style={styles.roleText}>VERIFIED INVESTOR</Text>
          </View>
        </View>

        {/* FORM SECTION */}
        <View style={styles.form}>
          <ProfileInput 
            label="Full Name" 
            value={userData.fullName} 
            onChangeText={(t) => setUserData({...userData, fullName: t})}
            icon="person-outline"
          />
          <ProfileInput 
            label="Email Address" 
            value={userData.email} 
            editable={false} 
            icon="mail-outline"
          />
          <ProfileInput 
            label="Phone Number" 
            value={userData.phone} 
            onChangeText={(t) => setUserData({...userData, phone: t})}
            icon="call-outline"
            keyboardType="phone-pad"
          />
          <ProfileInput 
            label="Investor Type" 
            value={userData.investorType} 
            onChangeText={(t) => setUserData({...userData, investorType: t})}
            icon="briefcase-outline"
          />
          
          <Text style={styles.inputLabel}>Investment Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={userData.bio}
            onChangeText={(t) => setUserData({...userData, bio: t})}
            placeholder="Tell entrepreneurs about your investment interests..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        <TouchableOpacity
          style={styles.portfolioBtn}
          onPress={() => router.push('/investor/investment-history')}
        >
          <Text style={styles.portfolioText}>View Portfolio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* HELPER COMPONENT */
const ProfileInput = ({ label, value, onChangeText, editable = true, icon, keyboardType }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputWrapper, !editable && styles.disabledWrapper]}>
      <Ionicons name={icon} size={20} color="#94A3B8" style={styles.inputIcon} />
      <TextInput
        style={[styles.input, !editable && styles.disabledInput]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholderTextColor="#94A3B8"
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: "#DCFCE7" 
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#064E3B" },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: "#fff", 
    justifyContent: "center", 
    alignItems: "center",
    elevation: 2 
  },
  saveText: { color: "#047857", fontWeight: "700", fontSize: 16 },
  scrollContent: { paddingBottom: 40 },
  profileSection: { 
    alignItems: "center", 
    paddingVertical: 35, 
    backgroundColor: "#DCFCE7", 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    elevation: 4
  },
  avatarCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: "#67E8F9", 
    justifyContent: "center", 
    alignItems: "center", 
    position: "relative",
    borderWidth: 4,
    borderColor: "#fff"
  },
  avatarInitial: { fontSize: 40, fontWeight: "800", color: "#000" },
  editIcon: { 
    position: "absolute", 
    bottom: 0, 
    right: 0, 
    backgroundColor: "#047857", 
    padding: 8, 
    borderRadius: 15, 
    borderWidth: 3, 
    borderColor: "#DCFCE7" 
  },
  userName: { fontSize: 24, fontWeight: "800", marginTop: 15, color: "#0F172A" },
  roleBadge: { 
    flexDirection: "row", 
    backgroundColor: "#fff", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    alignItems: "center", 
    gap: 6,
    marginTop: 8,
    elevation: 2
  },
  roleText: { fontSize: 12, fontWeight: "800", color: "#047857" },
  form: { padding: 25 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, textTransform: "uppercase" },
  inputWrapper: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: "#E2E8F0" 
  },
  disabledWrapper: { backgroundColor: "#F1F5F9" },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, padding: 15, fontSize: 16, color: "#1E293B" },
  disabledInput: { color: "#94A3B8" },
  textArea: { 
    height: 120, 
    textAlignVertical: "top", 
    backgroundColor: "#fff", 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: "#E2E8F0", 
    padding: 15 
  },
  portfolioBtn: {
    marginHorizontal: 25,
    marginTop: 4,
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#047857",
  },
  portfolioText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  logoutBtn: { 
    flexDirection: "row",
    marginHorizontal: 25, 
    marginTop: 10, 
    padding: 18, 
    borderRadius: 18, 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    gap: 10
  },
  logoutText: { color: "#EF4444", fontWeight: "700", fontSize: 16 },
});