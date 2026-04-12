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

const ForgotPasswordScreen = () => {
  const router = useRouter();

  const handleSendCode = () => {
    // Navigates to the OTP verification screen
    router.push('/auth/verify-otp');
  };

  return (
    <LinearGradient
      colors={['#2F43D6', '#5F7CFF', '#172554']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Circular Back Arrow on the Left */}
        <TouchableOpacity 
          style={styles.topLeftArrowContainer} 
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/auth/login'))}
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
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Forgot Password</Text>
              <Text style={styles.instructions}>
                Enter your email address and we&apos;ll send you a 4-digit code to reset your password.
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#000" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Email" 
                  style={styles.input} 
                  placeholderTextColor="#999" 
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleSendCode}
              >
                <Text style={styles.resetButtonText}>Send Code</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backToLogin}
                onPress={() => router.push('/auth/login')}
              >
                <Text style={styles.backToLoginText}>Back to Log In</Text>
              </TouchableOpacity>
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
    backgroundColor: 'transparent',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
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
    shadowColor: "#fff",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logo: { width: 60, height: 60 },
  brandName: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  formCard: {
    width: '90%',
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    padding: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#032a96', marginBottom: 10 },
  instructions: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 60,
    backgroundColor: '#fff',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#333', fontSize: 16 },
  resetButton: {
    backgroundColor: '#0851c5',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backToLogin: {
    marginTop: 20,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#032a96',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;