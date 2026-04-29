import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, StatusBar, Dimensions, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');
import { auth, db, storage } from '../../firebaseConfig';
import { signOut, updateProfile } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CustomerProfile() {
  const router = useRouter();
  const user = auth.currentUser;
  const [stats, setStats] = useState({ orders: 0, cartItems: 0 });
  const [profilePic, setProfilePic] = useState(user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      // Fetch stats
      const qOrders = query(collection(db, "orders"), where("userId", "==", user.uid));
      const orderSnap = await getDocs(qOrders);
      const cartSnap = await getDoc(doc(db, "cart", user.uid));
      let cItems = 0;
      if (cartSnap.exists()) {
        cItems = cartSnap.data().items?.length || 0;
      }
      setStats({ orders: orderSnap.size, cartItems: cItems });

      // Fetch Profile Picture from Firestore (if different from Auth)
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists() && userSnap.data().profilePicture) {
        setProfilePic(userSnap.data().profilePicture);
      }
    };

    fetchUserData();
  }, [user]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
      
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      // Update Firebase Auth
      await updateProfile(auth.currentUser, { photoURL: url });
      
      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        profilePicture: url
      });

      setProfilePic(url);
      alert("Profile picture updated!");
    } catch (error) {
      console.error(error);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/auth/login');
  };

  const menuItems = [
    { icon: 'grid-outline', label: 'Main Dashboard', color: '#3B82F6', route: '/customer/dashboard' },
    { icon: 'search-outline', label: 'Explore Trends', color: '#6366F1', route: '/customer/explore' },
    { icon: 'bulb-outline', label: 'Innovations', color: '#8B5CF6', route: '/customer/marketplace' },
    { icon: 'person-outline', label: 'Personal Info', color: '#10B981', route: '/customer/personal-info' },
    { icon: 'shield-checkmark-outline', label: 'Security', color: '#F59E0B', route: '/customer/security' },
    { icon: 'notifications-outline', label: 'Notifications', color: '#0EA5E9', route: '/customer/notifications' },
    { icon: 'help-circle-outline', label: 'Help & Support', color: '#F43F5E', route: '/customer/support' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PREMIUM HEADER */}
        <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.header}>
          <SafeAreaView style={styles.headerContent}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={uploading}>
              <LinearGradient colors={['#6366F1', '#A855F7']} style={styles.avatarRing}>
                {uploading ? (
                  <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator color="#6366F1" />
                  </View>
                ) : (
                  <Image source={{ uri: profilePic }} style={styles.avatar} />
                )}
              </LinearGradient>
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{user?.displayName || 'Customer'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            
            {/* QUICK STATS */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{stats.orders}</Text>
                <Text style={styles.statLab}>Orders</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{stats.cartItems}</Text>
                <Text style={styles.statLab}>Cart Items</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>0</Text>
                <Text style={styles.statLab}>Saved</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          {/* MENU SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <View style={styles.menuList}>
              {menuItems.map((item, index) => (
                <TouchableOpacity key={index} style={styles.menuItem} onPress={() => item.route && router.push(item.route)}>
                  <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuText}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* DANGER ZONE */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  headerContent: { alignItems: 'center', paddingVertical: 40 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarRing: { padding: 4, borderRadius: 50 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6366F1', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1E293B' },
  name: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '600' },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, marginTop: 30, width: width - 48 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  statLab: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

  content: { padding: 24 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 15, marginLeft: 5 },
  menuList: { backgroundColor: '#FFF', borderRadius: 32, padding: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#334155' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', padding: 20, borderRadius: 24 },
  logoutText: { marginLeft: 10, fontSize: 16, fontWeight: '800', color: '#EF4444' }
});
