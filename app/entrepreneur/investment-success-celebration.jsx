import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function InvestmentCelebration() {
  const router = useRouter();
  const { amount, investor } = useLocalSearchParams();
  const confettiRef = useRef(null);
  
  const handleGoToDashboard = () => {
    try {
      router.replace('/entrepreneur/dashboard');
    } catch (error) {
      router.push('/entrepreneur/dashboard');
    }
  };
  
  // Animation for the card pop-in
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // 1. Play Confetti
    confettiRef.current?.play();

    // 2. Animate the Card
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* 🎉 CONFETTI LAYER */}
      <LottieView
        ref={confettiRef}
        // ✅ Using a URL instead of a local file to avoid the "Unable to resolve" error
        source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_u4yrau.json' }}
        autoPlay
        loop={false}
        style={styles.lottie}
        resizeMode="cover"
        onAnimationFinish={() => {
          console.log("Animation Finished");
        }}
      />

      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="cash" size={40} color="#10B981" />
        </View>
        
        <Text style={styles.congratsText}>New Funding Secured!</Text>
        <Text style={styles.amountText}>${Number(amount).toLocaleString()}</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Investor</Text>
          <Text style={styles.infoValue}>{investor || "Anonymous Investor"}</Text>
        </View>

        <TouchableOpacity 
          style={styles.continueBtn}
          onPress={handleGoToDashboard}
        >
          <Text style={styles.continueText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  lottie: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' },
  card: { width: '85%', backgroundColor: '#fff', borderRadius: 30, padding: 30, alignItems: 'center', elevation: 20, zIndex: 2 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  congratsText: { fontSize: 18, fontWeight: '700', color: '#64748B' },
  amountText: { fontSize: 42, fontWeight: '900', color: '#1E293B', marginVertical: 10 },
  infoBox: { width: '100%', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 20, marginTop: 10, alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 5 },
  continueBtn: { backgroundColor: '#4F46E5', width: '100%', paddingVertical: 15, borderRadius: 15, marginTop: 30, alignItems: 'center' },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});