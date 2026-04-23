import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerProfile() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={80} color="#4F46E5" />
        <Text style={styles.name}>{user?.displayName || 'Customer'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={20} color="#1E293B" />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={[styles.menuText, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  name: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginTop: 10 },
  email: { fontSize: 14, color: '#64748B' },
  menu: { backgroundColor: '#FFF', borderRadius: 20, padding: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuText: { marginLeft: 15, fontSize: 16, fontWeight: '600', color: '#1E293B' },
});
