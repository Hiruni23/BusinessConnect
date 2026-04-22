import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#0F172A', '#1E3A8A', '#020617']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <Text style={styles.welcomeText}>BusinessConnect</Text>
          <Text style={styles.subtitleText}>Connecting Ideas, People, and Growth</Text>
        </View>

        {/* --- GLOWING ROUND IMAGE SECTION --- */}
        <View style={styles.illustrationContainer}>
          {/* Outer Glass Halo */}
          <BlurView intensity={30} tint="light" style={styles.outerGlow}>
            {/* Inner Border Layer */}
            <View style={styles.imageRoundWrapper}>
              <Image
                source={require('../../assets/images/welcome.png')}
                style={styles.illustration}
                resizeMode="cover"
              />
            </View>
          </BlurView>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.signUpText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logInButtonWrapper}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.7}
          >
            <BlurView intensity={30} tint="dark" style={styles.logInButton}>
              <Text style={styles.logInText}>Log In</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  illustrationContainer: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    width: width * 0.88,
    height: width * 0.88,
    borderRadius: (width * 0.88) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageRoundWrapper: {
    width: width * 0.78,
    height: width * 0.78,
    borderRadius: (width * 0.78) / 2,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  signUpButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logInButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  logInButton: {
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  logInText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default WelcomeScreen;