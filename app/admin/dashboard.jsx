import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Dimensions, Platform } from 'react-native';
import { collection, query, onSnapshot, doc, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    pendingProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time stats
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      const pending = snap.docs.filter(d => d.data().status === 'pending').length;
      setStats(prev => ({ ...prev, products: snap.size, pendingProducts: pending }));
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      setStats(prev => ({ ...prev, orders: snap.size }));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubProducts();
      unsubOrders();
    };
  }, []);

  const menuItems = [
    { title: "Marketplace Governance", icon: "cart", route: "/admin/marketplace-admin", color: "#6366F1", desc: "Approve products & manage orders" },
    { title: "User Management", icon: "people", route: "/admin/users", color: "#10B981", desc: "Manage roles & account security" },
    { title: "Pitch Moderation", icon: "rocket", route: "/admin/pitches", color: "#F59E0B", desc: "Review startup pitches & status" },
    { title: "Platform Analytics", icon: "analytics", route: "/admin/analytics", color: "#EC4899", desc: "View detailed growth metrics" },
    { title: "System Configuration", icon: "settings", route: "/admin/settings", color: "#64748B", desc: "Manage platform-wide settings" },
    { title: "Audit Logs", icon: "list", route: "/admin/logs", color: "#1E293B", desc: "Track all administrative actions" }
  ];

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#1E293B" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>System Administrator</Text>
              <Text style={styles.titleText}>Command Center</Text>
            </View>
            <TouchableOpacity style={styles.profileBtn}>
               <Ionicons name="person-circle" size={40} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* STATS GRID */}
          <View style={styles.statsGrid}>
             <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="people" size={24} color="#6366F1" />
                <Text style={styles.statNum}>{stats.users}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
             </View>
             <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="cube" size={24} color="#10B981" />
                <Text style={styles.statNum}>{stats.products}</Text>
                <Text style={styles.statLabel}>Innovations</Text>
             </View>
             <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="receipt" size={24} color="#F59E0B" />
                <Text style={styles.statNum}>{stats.orders}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
             </View>
             <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={styles.statNum}>{stats.pendingProducts}</Text>
                <Text style={styles.statLabel}>Pending Approval</Text>
             </View>
          </View>

          {/* QUICK ACCESS GRID */}
          <Text style={styles.sectionTitle}>Administrative Modules</Text>
          <View style={styles.menuGrid}>
             {menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.menuItem, isWeb && styles.menuItemWeb]}
                  onPress={() => router.push(item.route)}
                >
                   <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name={item.icon} size={28} color={item.color} />
                   </View>
                   <View style={styles.menuInfo}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuDesc}>{item.desc}</Text>
                   </View>
                   <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
             ))}
          </View>

          {/* RECENT ACTIVITY MOCK */}
          <Text style={styles.sectionTitle}>Recent Ecosystem Activity</Text>
          <View style={styles.activityCard}>
             {[1, 2, 3].map((_, i) => (
                <View key={i} style={[styles.activityRow, i === 2 && { borderBottomWidth: 0 }]}>
                   <View style={styles.dot} />
                   <View style={{ flex: 1 }}>
                      <Text style={styles.activityText}>
                         {i === 0 ? 'New innovation "BioSync" added by Entrepreneur.' : 
                          i === 1 ? 'Admin approved "EcoCharge" product.' : 
                          'Customer #4928 placed an order for $1,200.'}
                      </Text>
                      <Text style={styles.activityTime}>{5 * (i+1)} mins ago</Text>
                   </View>
                </View>
             ))}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={() => auth.signOut()}>
             <Text style={styles.logoutText}>Secure Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  welcomeText: { fontSize: 14, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1 },
  titleText: { fontSize: 32, fontWeight: '900', color: '#1E293B' },
  profileBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: (width - 64) / 2, padding: 20, borderRadius: 24, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8 },
  statNum: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginVertical: 8 },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },

  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 20, marginTop: 10 },
  
  menuGrid: { marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 12, elevation: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  menuItemWeb: { width: '100%', maxWidth: 800 },
  iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  menuDesc: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

  activityCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
  activityRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1', marginTop: 6, marginRight: 15 },
  activityText: { fontSize: 14, color: '#475569', fontWeight: '600', lineHeight: 20 },
  activityTime: { fontSize: 11, color: '#CBD5E1', fontWeight: '700', marginTop: 4 },

  logoutBtn: { marginTop: 40, alignItems: 'center', paddingVertical: 20, borderRadius: 20, backgroundColor: '#FEE2E2' },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 16 }
});
