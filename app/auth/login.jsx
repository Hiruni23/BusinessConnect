import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

// --- FIREBASE IMPORTS ---
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const LoginScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const inferRoleFromUserData = (userData) => {
    const normalizedRole = String(userData?.role || '').trim().toLowerCase();
    if (normalizedRole) {
      return normalizedRole;
    }

    if (userData?.businessCategory || userData?.targetInvestorId || userData?.targetInvestorCategory) {
      return 'entrepreneur';
    }

    if (userData?.investorType) {
      return 'investor';
    }

    if (userData?.customerPreferences || userData?.shippingAddress || userData?.cartCount) {
      return 'customer';
    }

    if (userData?.governanceScope || userData?.oversightNotes) {
      return 'stakeholder';
    }

    return null;
  };

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
        const userData = userDoc.data();
        const role = inferRoleFromUserData(userData);
        const route = roleRoutes[role];

        if (route) {
          if (String(userData?.role || '').trim().toLowerCase() !== role) {
            await setDoc(doc(db, "users", user.uid), {
              role,
              setupComplete: true,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }

          router.replace(route);
        } else {
          // Allow role selection as fallback if role is missing
          router.replace({
            pathname: '/auth/role-selection',
            params: {
              uid: user.uid,
              fullName: userDoc.data().fullName || user.displayName || '',
              email: userDoc.data().email || user.email,
              phoneNumber: userDoc.data().phoneNumber || '',
            }
          });
        }
      } else {
        Alert.alert("Error", "User profile not found. Please contact support.");
      }
    } catch (error) {
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
                Welcome back, please log in to continue
              </Text>
            </View>

            <BlurView intensity={40} tint="dark" style={styles.formCard}>
              <Text style={styles.formTitle}>Log In</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email address"
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

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
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 10,
  },
  logo: { width: 120, height: 70, overflow: 'hidden' },
  brandName: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 0.5, display: 'none' },
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    paddingVertical: 5,
  },
  forgotText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
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
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  signUpLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  noAccountText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  signUpText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default LoginScreen;