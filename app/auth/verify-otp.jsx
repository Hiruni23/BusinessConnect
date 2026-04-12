import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const VerifyOTPScreen = () => {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  
  // Fixed: Removed the <TextInput[]> TypeScript syntax
  const inputs = useRef([]);

  // Fixed: Removed the : string and : number type annotations
  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input when a number is entered
    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Auto-focus previous input on backspace if current is empty
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
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
          style={styles.backArrow}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/auth/forgot-password'))}
        >
          <View style={styles.circleBorder}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </View>
        </TouchableOpacity>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.content}
        >
          <View style={styles.formCard}>
            <Text style={styles.title}>Verify Code</Text>
            <Text style={styles.subtitle}>Enter the 4-digit code sent to your email.</Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputs.current[index] = el)}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  value={digit}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={styles.verifyButton}
              onPress={() => router.push('/auth/reset-password')}
            >
              <Text style={styles.verifyText}>Verify & Proceed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn&apos;t receive a code? <Text style={styles.link}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  backArrow: { 
    position: 'absolute', 
    top: 50, 
    left: 25, 
    zIndex: 10 
  },
  circleBorder: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    borderWidth: 2, 
    borderColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
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
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#032a96', 
    marginBottom: 10 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 30 
  },
  otpContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 30 
  },
  otpInput: { 
    width: 60, 
    height: 60, 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    textAlign: 'center', 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#032a96' 
  },
  verifyButton: { 
    backgroundColor: '#0851c5', 
    borderRadius: 30, 
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  verifyText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  resendContainer: { 
    marginTop: 20, 
    alignItems: 'center' 
  },
  resendText: { 
    color: '#666', 
    fontSize: 14 
  },
  link: { 
    color: '#032a96', 
    fontWeight: 'bold' 
  },
});

export default VerifyOTPScreen;