import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ResetPasswordScreen = () => {
  const router = useRouter();
  
  // State management
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Toggle state
  const [showSuccess, setShowSuccess] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const handleUpdatePassword = () => {
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setShowSuccess(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setShowSuccess(false);
      router.replace('/auth/login');
    }, 2500);
  };

  return (
    <LinearGradient
      colors={['#2F43D6', '#5F7CFF', '#172554']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={styles.topLeftArrowContainer}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/auth/verify-otp'))}
        >
          <View style={styles.circleBorder}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </View>
        </TouchableOpacity>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoSection}>
              <View style={styles.logoCircle}>
                <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.brandName}>BusinessConnect</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Password</Text>
              <Text style={styles.instructions}>Set your new password below.</Text>

              {/* Password Input with Eye Icon */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#000" style={styles.inputIcon} />
                <TextInput 
                  placeholder="New Password" 
                  style={styles.input} 
                  placeholderTextColor="#999" 
                  secureTextEntry={!showPassword} // Controlled by state
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#000" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Confirm Password" 
                  style={styles.input} 
                  placeholderTextColor="#999" 
                  secureTextEntry={!showPassword} // Sync with first field for convenience
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity style={styles.resetButton} onPress={handleUpdatePassword}>
                <Text style={styles.resetButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Success Modal */}
      <Modal transparent={true} visible={showSuccess} animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.successCard, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={60} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successText}>Your password has been updated.</Text>
          </Animated.View>
        </View>
      </Modal>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topLeftArrowContainer: { position: 'absolute', top: 50, left: 25, zIndex: 10 },
  circleBorder: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { alignItems: 'center', paddingTop: 60 },
  logoSection: { alignItems: 'center', marginBottom: 30 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 10 },
  logo: { width: 60, height: 60 },
  brandName: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  formCard: { width: '90%', backgroundColor: '#F8F9FA', borderRadius: 30, padding: 25, elevation: 5 },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#032a96', marginBottom: 10 },
  instructions: { fontSize: 14, color: '#666', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 15, marginBottom: 15, paddingHorizontal: 15, height: 60, backgroundColor: '#fff' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#333', fontSize: 16 },
  resetButton: { backgroundColor: '#0851c5', borderRadius: 30, height: 60, justifyContent: 'center', alignItems: 'center' },
  resetButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  successCard: { width: '80%', backgroundColor: '#fff', borderRadius: 30, padding: 30, alignItems: 'center' },
  checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  successText: { fontSize: 16, color: '#64748B', textAlign: 'center' },
});

export default ResetPasswordScreen;