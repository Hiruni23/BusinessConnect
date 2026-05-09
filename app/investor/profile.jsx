import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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

const { width } = Dimensions.get('window');

export default function ProfessionalInvestorProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    phone: "",
    investorType: "Angel Investor",
    bio: "",
    location: "Global",
    company: "Private Capital",
    interests: [],
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData({ ...userData, ...docSnap.data(), email: user.email });
      }
      setLoading(false);
    }, (error) => {
      console.error("Investor profile listener failed:", error);
      setLoading(false);
    });

    return unsub;
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid), userData);
      Alert.alert("Success", "Professional profile synchronized.");
    } catch (error) {
      Alert.alert("Error", "Synchronization failed.");
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
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Executive Profile</Text>
          <TouchableOpacity onPress={handleUpdate} disabled={updating} style={styles.saveBtn}>
            {updating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveText}>Update</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* PROFILE HERO */}
          <View style={styles.profileHero}>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.avatarGradient}>
                <Text style={styles.avatarText}>{userData.fullName?.charAt(0) || "I"}</Text>
              </LinearGradient>
              <TouchableOpacity style={styles.cameraBtn}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{userData.fullName || "Executive Investor"}</Text>
            <Text style={styles.userSub}>{userData.investorType} • {userData.company}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{userData.interestedCount || 0}</Text>
                <Text style={styles.statLab}>Interests</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>Active</Text>
                <Text style={styles.statLab}>Status</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>PRO</Text>
                <Text style={styles.statLab}>Tier</Text>
              </View>
            </View>
          </View>

          {/* INFORMATION GROUPS */}
          <View style={styles.formContainer}>
            <SectionTitle title="Identity & Contact" />
            <ProfileField 
              label="Full Legal Name" 
              value={userData.fullName} 
              onChangeText={(t) => setUserData({...userData, fullName: t})}
              icon="person"
            />
            <ProfileField 
              label="Official Email" 
              value={userData.email} 
              editable={false} 
              icon="mail"
            />
            <ProfileField 
              label="Secure Phone" 
              value={userData.phone} 
              onChangeText={(t) => setUserData({...userData, phone: t})}
              icon="call"
              keyboardType="phone-pad"
            />

            <SectionTitle title="Investment Preferences" />
            <ProfileField 
              label="Investor Classification" 
              value={userData.investorType} 
              onChangeText={(t) => setUserData({...userData, investorType: t})}
              icon="briefcase"
            />
            <ProfileField 
              label="Operating Company" 
              value={userData.company} 
              onChangeText={(t) => setUserData({...userData, company: t})}
              icon="business"
            />

            <Text style={styles.fieldLabel}>Executive Bio</Text>
            <TextInput
              style={styles.bioInput}
              multiline
              value={userData.bio}
              onChangeText={(t) => setUserData({...userData, bio: t})}
              placeholder="Outline your investment thesis..."
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* SECURITY & ACCOUNT */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/investor/portfolio')}>
              <View style={[styles.actionIcon, {backgroundColor: '#EEF2FF'}]}>
                <Ionicons name="pie-chart" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.actionText}>Investment Portfolio</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <View style={[styles.actionIcon, {backgroundColor: '#FEE2E2'}]}>
                <Ionicons name="log-out" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.actionText, {color: '#EF4444'}]}>Sign Out of System</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.versionText}>BusinessConnect v2.4.0 (Enterprise)</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const SectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const ProfileField = ({ label, value, onChangeText, editable = true, icon, keyboardType }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldWrapper, !editable && styles.disabledField]}>
      <Ionicons name={icon} size={20} color="#94A3B8" />
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholderTextColor="#CBD5E1"
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2FF' },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  backCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  saveText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  scrollContent: { paddingBottom: 60 },
  profileHero: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFF', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  avatarContainer: { position: 'relative', marginBottom: 20 },
  avatarGradient: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 42, fontWeight: '900', color: '#FFF' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1E293B', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  userName: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  userSub: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 4 },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 25, gap: 10 },
  statBox: { alignItems: 'center', width: 80 },
  statVal: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  statLab: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  statDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0' },

  formContainer: { padding: 25 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20, marginTop: 10 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginLeft: 4 },
  fieldWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 15, height: 56, borderWidth: 1, borderColor: '#E2E8F0' },
  fieldInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1E293B', fontWeight: '600' },
  disabledField: { backgroundColor: '#F8FAFC' },
  bioInput: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15, color: '#1E293B', fontWeight: '500' },

  footerActions: { paddingHorizontal: 25, gap: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1E293B' },

  versionText: { textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 40, fontWeight: '600' }
});