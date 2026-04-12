import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../../firebaseConfig";

export default function ProfileScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  useEffect(() => {
    if (user) fetchUser();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchUser = async () => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setFullName(data.fullName || "");
      setRole(data.role || "");
      setPhotoURL(data.photoURL || "");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth/login");
  };

  const username =
    fullName ||
    (user?.email ? user.email.split("@")[0] : "User");

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PROFILE SECTION */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => router.push("/profile/edit")}>
            <Image
              source={{
                uri:
                  photoURL ||
                  "https://i.pravatar.cc/150?img=12",
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <Text style={styles.name}>{username}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {role?.toUpperCase() || "USER"}
            </Text>
          </View>
        </View>

        {/* MENU */}
        <MenuItem
          title="Personal Details"
          onPress={() =>
            router.push("/profile/personal-details")
          }
        />

        <MenuItem
          title="Edit Profile"
          onPress={() => router.push("/profile/edit")}
        />

        {/* ADDED TERMS & CONDITIONS HERE */}
        <MenuItem 
          title="Terms & Conditions" 
          onPress={() => router.push("/profile/terms")}
        />

  <MenuItem
    title="Settings"
    onPress={() => router.push("/profile/settings")}
  />
        <MenuItem 
  title="Privacy Policy" 
  onPress={() => router.push("/profile/privacy-policy")} 
/>
    
    <MenuItem 
  title="About Us" 
  onPress={() => router.push("/profile/about")} 
/>

      <MenuItem 
  title="Help & Support" 
  onPress={() => router.push("/profile/help")} 
/>

      <MenuItem 
  title="Give Feedback" 
  onPress={() => router.push("/profile/feedback")} 
/>
        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#fff"
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

const MenuItem = ({ title, onPress }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
  >
    <Text style={styles.menuText}>{title}</Text>
    <Ionicons
      name="chevron-forward"
      size={18}
      color="#999"
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingTop:
      Platform.OS === "android"
        ? StatusBar.currentHeight
        : 0,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#fff",
    marginBottom: 10,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },

  email: {
    color: "#888",
    marginTop: 4,
  },

  roleBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },

  roleText: {
    color: "#2563EB",
    fontWeight: "700",
  },

  menuItem: {
    backgroundColor: "#fff",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },

  menuText: {
    fontSize: 15,
  },

  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2563EB",
    margin: 20,
    padding: 14,
    borderRadius: 25,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
});