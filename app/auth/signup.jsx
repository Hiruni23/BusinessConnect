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

// --- FIREBASE IMPORTS ---
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const SignUpScreen = () => {
  const router = useRouter();

  // STATE FOR INPUTS
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // 🔥 Added Phone Number State
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
        phoneNumber: phoneNumber.trim(), // 🔥 Saved Phone Number to Firestore
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
      colors={['#2F43D6', '#5F7CFF', '#172554']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity 
          style={styles.topLeftArrowContainer} 
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/auth/welcome'))}
        >
          <View style={styles.circleBorder}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </View>
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
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
                Empowering Entrepreneurs,{"\n"}Engaging Investors
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Sign Up</Text>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#000" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Name" 
                  style={styles.input} 
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#000" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Email" 
                  style={styles.input} 
                  placeholderTextColor="#999" 
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* 🔥 Phone Number Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#000" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (e.g. +94771234567)"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#000" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Password" 
                  style={styles.input} 
                  placeholderTextColor="#999" 
                  secureTextEntry 
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#000" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Confirm Password" 
                  style={styles.input} 
                  placeholderTextColor="#999" 
                  secureTextEntry 
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity 
                style={styles.signUpButton} 
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
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topLeftArrowContainer: {
    position: 'absolute',
    top: 50,
    left: 25,
    zIndex: 10,
  },
  circleBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 10,
  },
  logo: { width: 60, height: 60 },
  brandName: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  brandSlogan: { fontSize: 14, color: '#fff', textAlign: 'center', opacity: 0.8 },
  formCard: {
    width: '90%',
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    padding: 25,
    marginTop: 10,
    elevation: 5,
  },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#032a96', marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 60,
    backgroundColor: '#fff',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#333', fontSize: 16 },
  signUpButton: {
    backgroundColor: '#0851c5',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  alreadyText: { color: '#666' },
  loginText: { color: '#1e40af', fontWeight: 'bold' },
});

export default SignUpScreen;