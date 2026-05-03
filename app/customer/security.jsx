import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecuritySettings() {
  const router = useRouter();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(false);
  const [toggles, setToggles] = useState({
    biometrics: true,
    twoFactor: false,
    dataSharing: true,
    personalizedAds: false
  });

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Success", "Password reset email sent! Please check your inbox.");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSwitch = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security & Privacy</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* LOGIN SECURITY */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Login Security</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.actionRow} onPress={handlePasswordReset}>
                <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="key-outline" size={20} color="#6366F1" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Change Password</Text>
                  <Text style={styles.rowSub}>Send reset link to your email</Text>
                </View>
                {loading ? <ActivityIndicator size="small" color="#6366F1" /> : <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />}
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="finger-print-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Biometric Login</Text>
                  <Text style={styles.rowSub}>Use FaceID or Fingerprint</Text>
                </View>
                <Switch 
                  value={toggles.biometrics} 
                  onValueChange={() => toggleSwitch('biometrics')}
                  trackColor={{ false: '#E2E8F0', true: '#6366F1' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="shield-half-outline" size={20} color="#F59E0B" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Two-Factor Auth</Text>
                  <Text style={styles.rowSub}>Additional security layer</Text>
                </View>
                <Switch 
                  value={toggles.twoFactor} 
                  onValueChange={() => toggleSwitch('twoFactor')}
                  trackColor={{ false: '#E2E8F0', true: '#6366F1' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </View>

          {/* PRIVACY SETTINGS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Controls</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="share-social-outline" size={20} color="#64748B" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Data Sharing</Text>
                  <Text style={styles.rowSub}>Share usage data with partners</Text>
                </View>
                <Switch 
                  value={toggles.dataSharing} 
                  onValueChange={() => toggleSwitch('dataSharing')}
                  trackColor={{ false: '#E2E8F0', true: '#6366F1' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="megaphone-outline" size={20} color="#64748B" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Personalized Ads</Text>
                  <Text style={styles.rowSub}>Show ads based on interests</Text>
                </View>
                <Switch 
                  value={toggles.personalizedAds} 
                  onValueChange={() => toggleSwitch('personalizedAds')}
                  trackColor={{ false: '#E2E8F0', true: '#6366F1' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </View>

          {/* DANGER ZONE */}
          <TouchableOpacity style={styles.deleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  
  scrollContent: { padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 32, padding: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  rowSub: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: 15 },

  deleteAccount: { padding: 20, alignItems: 'center' },
  deleteText: { color: '#EF4444', fontWeight: '800', fontSize: 15 }
});
