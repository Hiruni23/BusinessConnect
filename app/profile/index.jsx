import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { useTheme } from "../../context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFullName(data.fullName || "");
        setRole(data.role || "");
        setPhotoURL(data.photoURL || "");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth/login");
  };

  const username = fullName || (user?.email ? user.email.split("@")[0] : "User");
  const s = makeStyles(T, isDark);

  return (
    <View style={s.container}>
      <StatusBar barStyle={T.statusBar} />
      <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Executive Profile</Text>
          <TouchableOpacity onPress={() => router.push("/profile/settings")} style={s.headerBtn}>
            <Ionicons name="settings-outline" size={22} color={T.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* PROFILE CARD */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={s.profileCard}>
            <LinearGradient colors={isDark ? ['#3B82F6', '#1E3A8A'] : ['#2563EB', '#1E40AF']} style={s.cardGradient}>
               <View style={s.avatarContainer}>
                 <Image
                    source={{ uri: photoURL || "https://i.pravatar.cc/150?img=12" }}
                    style={s.avatar}
                  />
                  <TouchableOpacity style={s.editBadge} onPress={() => router.push("/profile/edit")}>
                    <Ionicons name="camera" size={14} color="#fff" />
                  </TouchableOpacity>
               </View>
               
               <Text style={s.name}>{username}</Text>
               <Text style={s.email}>{user?.email}</Text>
               
               <View style={s.roleBadge}>
                  <Text style={s.roleText}>{role?.toUpperCase() || "ENTREPRENEUR"}</Text>
               </View>

               <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>12</Text>
                    <Text style={s.statLabel}>Pitches</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statItem}>
                    <Text style={s.statValue}>4</Text>
                    <Text style={s.statLabel}>Active</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statItem}>
                    <Text style={s.statValue}>$24k</Text>
                    <Text style={s.statLabel}>Raised</Text>
                  </View>
               </View>
            </LinearGradient>
          </Animated.View>

          {/* MENU SECTIONS */}
          <View style={s.menuContainer}>
            <Text style={s.sectionTitle}>ACCOUNT MANAGEMENT</Text>
            <View style={s.menuGroup}>
              <MenuButton 
                icon="person-outline" 
                title="Personal Details" 
                onPress={() => router.push("/profile/personal-details")} 
                T={T} 
              />
              <MenuButton 
                icon="create-outline" 
                title="Edit Profile" 
                onPress={() => router.push("/profile/edit")} 
                T={T} 
              />
              <MenuButton 
                icon="shield-checkmark-outline" 
                title="Security & Privacy" 
                onPress={() => router.push("/profile/privacy-policy")} 
                T={T} 
              />
            </View>

            <Text style={s.sectionTitle}>PLATFORM</Text>
            <View style={s.menuGroup}>
              <MenuButton 
                icon="document-text-outline" 
                title="Terms & Conditions" 
                onPress={() => router.push("/profile/terms")} 
                T={T} 
              />
              <MenuButton 
                icon="information-circle-outline" 
                title="About BusinessConnect" 
                onPress={() => router.push("/profile/about")} 
                T={T} 
              />
              <MenuButton 
                icon="help-buoy-outline" 
                title="Help & Support" 
                onPress={() => router.push("/profile/help")} 
                T={T} 
              />
              <MenuButton 
                icon="chatbox-ellipses-outline" 
                title="Give Feedback" 
                onPress={() => router.push("/profile/feedback")} 
                T={T} 
              />
            </View>

            <Animated.View entering={FadeInDown.delay(600).springify()}>
              <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                <LinearGradient colors={['#EF4444', '#B91C1C']} style={s.logoutGradient}>
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                  <Text style={s.logoutText}>Sign Out Executive</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const MenuButton = ({ icon, title, onPress, T }) => (
  <TouchableOpacity style={s_btn.button} onPress={onPress}>
    <View style={s_btn.iconContainer}>
      <Ionicons name={icon} size={20} color={T.accent} />
    </View>
    <Text style={[s_btn.title, { color: T.text }]}>{title}</Text>
    <Ionicons name="chevron-forward" size={18} color={T.subtext} />
  </TouchableOpacity>
);

const s_btn = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  }
});

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { 
      flexDirection: "row", 
      alignItems: "center", 
      justifyContent: "space-between", 
      paddingHorizontal: 20, 
      paddingVertical: 15 
    },
    headerTitle: { fontSize: 18, fontWeight: "900", color: T.text, letterSpacing: 0.5 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border },
    headerBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border },

    profileCard: { margin: 20, borderRadius: 32, overflow: 'hidden', elevation: 12, shadowColor: T.accent, shadowOpacity: 0.3, shadowRadius: 20 },
    cardGradient: { padding: 30, alignItems: 'center' },
    avatarContainer: { position: 'relative', marginBottom: 15 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    name: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    email: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
    roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
    roleText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    statsRow: { flexDirection: 'row', marginTop: 25, width: '100%', justifyContent: 'center', alignItems: 'center' },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
    statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
    statDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.1)' },

    menuContainer: { paddingHorizontal: 20, marginTop: 10 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: T.subtext, letterSpacing: 1.5, marginBottom: 12, marginLeft: 5 },
    menuGroup: { backgroundColor: T.glassBg, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: T.glassBorder, marginBottom: 25 },

    logoutBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 10 },
    logoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
    logoutText: { color: '#fff', fontSize: 15, fontWeight: '800' }
  });
}