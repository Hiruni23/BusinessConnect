import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// 1. Updated SafeAreaView import to fix deprecation warning
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- FIREBASE IMPORTS ---
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const LoginScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 2. Updated Login Logic
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      console.log('Starting login...');

      let userCredential = null;
      let lastError = null;

      // Retry once for transient network failures.
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          break;
        } catch (err) {
          lastError = err;
          if (err?.code !== 'auth/network-request-failed' || attempt === 2) {
            throw err;
          }
          await wait(800);
        }
      }

      const user = userCredential.user;
      
      console.log("Logged in user:", user.email);
      setLoading(false);
      
      // Check if user has completed setup
     const roleRoutes = {
  entrepreneur: '/entrepreneur/dashboard',
  investor: '/investor/dashboard',
  stakeholder: '/stakeholder/dashboard',
  customer: '/(tabs)/dashboard',
};

const userDoc = await getDoc(doc(db, "users", user.uid));

if (userDoc.exists()) {
  const role = userDoc.data().role;
  const route = roleRoutes[role];

  if (route) {
    router.replace(route);
  } else {
    router.replace('/auth/role-selection');
  }
} }catch (error) {
      console.log('Login error:', error);
      setLoading(false);
      let errorMessage = "Check your email and password and try again.";
      
      // Specific error handling for Firebase Auth
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network issue detected. Please check your internet connection and try again.";
      }
      
      Alert.alert("Login Failed", errorMessage);
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
              <Text style={styles.formTitle}>Log In</Text>

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

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/auth/forgot-password')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.loginButton, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signUpLinkContainer}>
                <Text style={styles.noAccountText}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                  <Text style={styles.signUpText}>Sign Up</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    padding: 5, 
  },
  forgotText: {
    color: '#0851c5',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#0851c5',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signUpLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  noAccountText: { color: '#666' },
  signUpText: { color: '#1e40af', fontWeight: 'bold' },
});

export default LoginScreen;