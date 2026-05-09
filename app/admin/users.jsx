import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("User management listener failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateRole = (id, currentRole) => {
    const roles = ['Customer', 'Entrepreneur', 'Investor', 'Stakeholder', 'Admin'];
    Alert.alert("Change User Role", `Current: ${currentRole}`, roles.map(role => ({
      text: role,
      onPress: async () => {
        await updateDoc(doc(db, "users", id), { role });
      }
    })));
  };

  const getRoleColor = (role) => {
    switch(role?.toLowerCase()) {
      case 'admin': return '#EF4444';
      case 'entrepreneur': return '#6366F1';
      case 'investor': return '#10B981';
      case 'stakeholder': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const filteredUsers = users.filter(u => 
     u.email?.toLowerCase().includes(search.toLowerCase()) || 
     u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) + '20' }]}>
         <Text style={[styles.avatarText, { color: getRoleColor(item.role) }]}>
          {item.fullName?.charAt(0) || 'U'}
         </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName || 'User'}</Text>
         <Text style={styles.userEmail}>{item.email}</Text>
         <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '15' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>{item.role?.toUpperCase()}</Text>
         </View>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateRole(item.id, item.role)}>
         <Ionicons name="shield-outline" size={20} color="#6366F1" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Management</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.searchContainer}>
           <Ionicons name="search-outline" size={20} color="#94A3B8" />
           <TextInput 
             style={styles.searchInput} 
             placeholder="Search by name or email..." 
             value={search}
             onChangeText={setSearch}
             placeholderTextColor="#CBD5E1"
           />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 24, paddingHorizontal: 15, height: 56, borderRadius: 18, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1E293B', fontWeight: '600' },

  listContent: { paddingHorizontal: 24, paddingBottom: 50 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 24, marginBottom: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '900' },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  userEmail: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 6 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  actionBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }
});
