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

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#2F43D6', '#5F7CFF', '#3e6bf3ff']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subtitleText}>Connecting Ideas, People, and Growth</Text>
        </View>

        {/* --- GLOWING ROUND IMAGE SECTION --- */}
        <View style={styles.illustrationContainer}>
          {/* Outer Glow Layer */}
          <View style={styles.outerGlow}>
            {/* Inner Shadow/Border Layer */}
            <View style={styles.imageShadowBox}>
              <View style={styles.imageRoundWrapper}>
                <Image
                  source={require('../../assets/images/welcome.png')}
                  style={styles.illustration}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logInButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.logInText}>Log In</Text>
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
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Soft outer halo
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageShadowBox: {
    // Standard Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    // Elevation for Android
    elevation: 20,
  },
  imageRoundWrapper: {
    width: width * 0.78,
    height: width * 0.78,
    borderRadius: (width * 0.78) / 2,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)', // Sharp inner white border
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
    backgroundColor: '#3248D7',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    // Add shadow to button too
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logInButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
  },
  logInText: {
    color: '#3248D7',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;