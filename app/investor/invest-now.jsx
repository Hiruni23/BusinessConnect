import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, PanResponder, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80;

const PERKS = [
  { amount: 100, label: "Digital Badge", desc: "Show your support with a verified badge.", color: "#94A3B8" },
  { amount: 500, label: "Early Access", desc: "Get the product 2 months before launch.", color: "#10B981" },
  { amount: 2500, label: "Founders Edition", desc: "Limited edition units + your name in credits.", color: "#6366F1" },
  { amount: 10000, label: "VIP Insider", desc: "Private Q&A with the innovator team.", color: "#A855F7" },
];

export default function InvestNow() {
  const router = useRouter();
  const { pitchId, pitchTitle, entrepreneurId } = useLocalSearchParams();
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showGateway, setShowGateway] = useState(false);

  // Slider Logic
  const [sliderPos, setSliderPos] = useState(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        let newX = Math.max(0, Math.min(gestureState.moveX - 40, SLIDER_WIDTH));
        setSliderPos(newX);
        const ratio = newX / SLIDER_WIDTH;
        const calculatedAmount = Math.round(ratio * 15000); // Max 15k
        setAmount(calculatedAmount.toString());
      },
    })
  ).current;

  const currentPerk = [...PERKS].reverse().find(p => parseInt(amount) >= p.amount) || PERKS[0];

  const handleProceedToPayment = () => {
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid investment figure.");
      return;
    }
    setShowGateway(true);
  };

  const handleConfirmInvestment = async () => {
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    setLoading(true);
    const user = auth.currentUser;

    try {
      await addDoc(collection(db, "transactions"), {
        pitchId: pitchId || "unknown_pitch",
        pitchTitle: pitchTitle || "Unknown Pitch",
        investorId: user.uid,
        investorEmail: user.email || "unknown",
        entrepreneurId: entrepreneurId || "unknown_entrepreneur",
        amount: numericAmount,
        timestamp: serverTimestamp(),
        type: 'equity_investment'
      });

      if (pitchId) {
        const pitchRef = doc(db, "pitches", pitchId);
        await updateDoc(pitchRef, {
          raisedAmount: increment(numericAmount),
          interested: increment(1)
        });
      }

      setSuccess(true);
      setTimeout(async () => {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.data()?.role;
        if (role === 'customer') {
          router.replace('/customer/dashboard');
        } else {
          router.replace('/investor/dashboard');
        }
      }, 3000);

    } catch (error) {
      console.error("Investment Error:", error);
      Alert.alert("Error", "Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={100} color="#10B981" />
        <Text style={styles.successTitle}>Support Confirmed!</Text>
        <Text style={styles.successSub}>You've unlocked the {currentPerk.label} perk!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support Innovation</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Backing Project</Text>
            <Text style={styles.pitchName}>{pitchTitle}</Text>
          </View>

          {/* PERK CALCULATOR */}
          <View style={styles.perkCard}>
             <LinearGradient colors={[currentPerk.color + '20', '#FFF']} style={styles.perkGradient}>
               <View style={styles.perkHeader}>
                  <Ionicons name="gift-outline" size={24} color={currentPerk.color} />
                  <Text style={[styles.perkTitle, { color: currentPerk.color }]}>{currentPerk.label}</Text>
               </View>
               <Text style={styles.perkDesc}>{currentPerk.desc}</Text>
               <Text style={styles.perkMin}>Unlock at ${currentPerk.amount.toLocaleString()}</Text>
             </LinearGradient>
          </View>

          <View style={styles.calculatorSection}>
            <Text style={styles.label}>Your Contribution</Text>
            <View style={styles.amountDisplay}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.input}
                value={Number(amount).toLocaleString()}
                keyboardType="numeric"
                onChangeText={(val) => setAmount(val.replace(/,/g, ''))}
              />
            </View>

            {/* CUSTOM SLIDER */}
            <View style={styles.sliderContainer}>
               <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: sliderPos }]} />
                  <View 
                    {...panResponder.panHandlers}
                    style={[styles.sliderThumb, { left: sliderPos - 15 }]} 
                  />
               </View>
               <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>$100</Text>
                  <Text style={styles.sliderLabelText}>$15,000</Text>
               </View>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleProceedToPayment}>
            <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.btnGradient}>
              <Text style={styles.confirmText}>Commit ${Number(amount).toLocaleString()}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  content: { padding: 24 },
  infoBox: { marginBottom: 30 },
  infoLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  pitchName: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 4 },

  perkCard: { borderRadius: 32, overflow: 'hidden', backgroundColor: '#FFF', elevation: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, marginBottom: 40 },
  perkGradient: { padding: 24 },
  perkHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  perkTitle: { fontSize: 20, fontWeight: '900', marginLeft: 10 },
  perkDesc: { fontSize: 15, color: '#475569', lineHeight: 22, fontWeight: '500' },
  perkMin: { fontSize: 12, color: '#94A3B8', fontWeight: '700', marginTop: 15 },

  calculatorSection: { marginBottom: 40 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 15 },
  amountDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  currency: { fontSize: 40, fontWeight: '900', color: '#1E293B' },
  input: { flex: 1, fontSize: 40, fontWeight: '900', color: '#1E293B', marginLeft: 10 },

  sliderContainer: { height: 60, justifyContent: 'center' },
  sliderTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, position: 'relative' },
  sliderFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 4 },
  sliderThumb: { 
    position: 'absolute', 
    top: -11, 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    backgroundColor: '#FFF', 
    borderWidth: 4, 
    borderColor: '#6366F1',
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  sliderLabelText: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },

  confirmBtn: { height: 64, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 15 },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  confirmText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 20 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginTop: 20 },
  successSub: { fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 10 },
});