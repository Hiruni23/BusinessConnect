import React, { useState } from 'react';
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
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// --- FIREBASE IMPORTS ---
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const SignUpScreen = () => {
  const router = useRouter();

  // STATE FOR INPUTS
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // SIGNUP HANDLER
  const handleSignUp = async () => {
    // Basic Validation
    if (!name || !email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters.");
      return;
    }
    // Optional: Basic phone length validation
    if (phoneNumber.length < 10) {
        Alert.alert("Error", "Please enter a valid phone number.");
        return;
    }

    setLoading(true);
    try {
      console.log('Starting signup...');
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      console.log('User created:', user.uid);

      // 2. Save additional info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: name,
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        createdAt: serverTimestamp(),
        setupComplete: false, 
      });
      console.log('User data saved to Firestore');

      setLoading(false);
      
      // 3. Navigate to role selection
      router.replace('/auth/role-selection');

    } catch (error) {
      console.log('Signup error:', error);
      setLoading(false);
      let errorMessage = error.message;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      
      Alert.alert("Signup Failed", errorMessage);
    }
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E3A8A', '#020617']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity 
          style={styles.topLeftArrowContainer} 
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/auth/welcome'))}
        >
          <BlurView intensity={20} tint="light" style={styles.circleBorder}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </BlurView>
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            
            <View style={styles.logoSection}>
              <View style={styles.logoCircle}>
                <Image 
                  source={require('../../assets/images/logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandName}>BusinessConnect</Text>
              <Text style={styles.brandSlogan}>
                Create an account to get started
              </Text>
            </View>

            <BlurView intensity={40} tint="dark" style={styles.formCard}>
              <Text style={styles.formTitle}>Sign Up</Text>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Full Name" 
                  style={styles.input} 
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Email Address" 
                  style={styles.input} 
                  placeholderTextColor="#94A3B8" 
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Phone Number Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (e.g. +94771234567)"
                  placeholderTextColor="#94A3B8"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Password" 
                  style={styles.input} 
                  placeholderTextColor="#94A3B8" 
                  secureTextEntry 
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Confirm Password" 
                  style={styles.input} 
                  placeholderTextColor="#94A3B8" 
                  secureTextEntry 
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity 
                style={[styles.signUpButton, loading && { opacity: 0.7 }]}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginLinkContainer}>
                <Text style={styles.alreadyText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={styles.loginText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </BlurView>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  topLeftArrowContainer: {
    position: 'absolute',
    top: 50,
    left: 25,
    zIndex: 10,
    borderRadius: 22,
    overflow: 'hidden',
  },
  circleBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logo: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden' },
  brandName: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  brandSlogan: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8 },
  formCard: {
    width: '90%',
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  formTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 24 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  signUpButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
  },
  signUpButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  alreadyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  loginText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default SignUpScreen;