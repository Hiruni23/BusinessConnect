import React from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { Alert, ActivityIndicator } from 'react-native';

const ForgotPasswordScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setLoading(false);
      Alert.alert(
        "Link Sent!", 
        "Check your email for a secure link to reset your password.",
        [{ text: "OK", onPress: () => router.push('/auth/login') }]
      );
    } catch (error) {
      setLoading(false);
      let errorMessage = "Unable to send reset link. Please try again.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "We couldn't find an account with that email.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      Alert.alert("Error", errorMessage);
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
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/auth/login'))}
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
            </View>

            <BlurView intensity={40} tint="dark" style={styles.formCard}>
              <Text style={styles.formTitle}>Forgot Password</Text>
              <Text style={styles.instructions}>
                Enter your email address and we&apos;ll send you a secure link to reset your password.
              </Text>

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

              <TouchableOpacity 
                style={[styles.resetButton, loading && { opacity: 0.7 }]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <View style={styles.backToLoginContainer}>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={styles.backToLoginText}>Back to Log In</Text>
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
  formCard: {
    width: '90%',
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  formTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  instructions: { 
    fontSize: 15, 
    color: 'rgba(255,255,255,0.7)', 
    marginBottom: 24, 
    lineHeight: 22 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  resetButton: {
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
  },
  resetButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  backToLoginContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 24 
  },
  backToLoginText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 15 
  },
});

export default ForgotPasswordScreen;