import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function PersonalInfo() {
  const router = useRouter();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({
            ...prev,
            phone: data.phone || '',
            address: data.address || ''
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    
    setSaving(true);
    try {
      // Update Auth Profile
      await updateProfile(user, { displayName: formData.displayName });
      
      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
        updatedAt: new Date()
      });
      
      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Info</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <Image source={{ uri: `https://i.pravatar.cc/150?u=${user?.uid}` }} style={styles.avatar} />
            <TouchableOpacity style={styles.changePhotoBtn}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  value={formData.displayName}
                  onChangeText={text => setFormData({...formData, displayName: text})}
                  placeholder="John Doe"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, styles.disabledInput]}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { color: '#94A3B8' }]}
                  value={formData.email}
                  editable={false}
                />
              </View>
              <Text style={styles.helperText}>Email cannot be changed.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={text => setFormData({...formData, phone: text})}
                  placeholder="+1 234 567 8900"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Address</Text>
              <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
                <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { height: 100 }]}
                  value={formData.address}
                  onChangeText={text => setFormData({...formData, address: text})}
                  placeholder="Street, City, Country"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  
  scrollContent: { padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E2E8F0', borderWidth: 4, borderColor: '#FFF' },
  changePhotoBtn: { marginTop: 12 },
  changePhotoText: { color: '#6366F1', fontWeight: '800', fontSize: 14 },

  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 56, fontSize: 16, color: '#1E293B', fontWeight: '600' },
  disabledInput: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  helperText: { fontSize: 12, color: '#94A3B8', marginLeft: 4, marginTop: 2 },

  saveBtn: { backgroundColor: '#6366F1', height: 60, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginTop: 40, elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.3, shadowRadius: 20 },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' }
});
