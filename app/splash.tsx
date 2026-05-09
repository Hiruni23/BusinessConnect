import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  Animated, 
  StatusBar,  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

const Splash = () => {
  const router = useRouter();
  
  // Animation value for the main content fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation values for the 3 loading dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation for Logo and Text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 2. Function to animate dots with TypeScript types defined
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          // Slide right and brighten
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          // Slide left and dim
          Animated.timing(dot, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Start the loading sequence
    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);

    // 3. Navigate to Welcome screen after 4 seconds
    const timer = setTimeout(() => {
      router.replace('/auth/welcome');
    }, 4000);

    return () => clearTimeout(timer);
  }, [fadeAnim, dot1, dot2, dot3, router]);

  // Helper function with TypeScript types for styling the dots
  const getDotStyle = (animValue: Animated.Value) => ({
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [{
      translateX: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-6, 6], // Adjust these numbers for more/less sliding
      })
    }]
  });

  return (
    <LinearGradient
      colors={['#0F172A', '#1E3A8A', '#020617']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={styles.contentContainer}>
        <Animated.View style={[styles.innerContent, { opacity: fadeAnim }]}>
          
          {/* Logo with Refined Glow */}
          <View style={styles.logoWrapper}>
            <View style={styles.glow} />
            <BlurView intensity={20} tint="light" style={styles.logoCircle}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </BlurView>
          </View>

          {/* Branding */}
          <Text style={styles.brandName}>BusinessConnect</Text>
          <Text style={styles.slogan}>
            Empowering Entrepreneurs,{"\n"}Engaging Investors
          </Text>

          {/* Animated Loading Dots */}
          <View style={styles.pagination}>
            <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
            <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
            <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
          </View>

        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContent: {
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    zIndex: 1,
  },
  logo: {
    width: 130,
    height: 130,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  slogan: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 100,
    gap: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
});

export default Splash;