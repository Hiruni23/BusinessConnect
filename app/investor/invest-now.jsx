import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native'; // Optional: for confetti
import PaymentGateway from '../../components/PaymentGateway';

export default function InvestNow() {
  const router = useRouter();
  const { pitchId, pitchTitle, entrepreneurId } = useLocalSearchParams();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showGateway, setShowGateway] = useState(false);

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
    
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid investment figure.");
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    try {
      // 1. CREATE TRANSACTION RECORD (Audit Trail)
      await addDoc(collection(db, "transactions"), {
        pitchId,
        pitchTitle,
        investorId: user.uid,
        investorEmail: user.email,
        entrepreneurId: entrepreneurId,
        amount: numericAmount,
        timestamp: serverTimestamp(),
        type: 'equity_investment'
      });

      // 2. UPDATE PITCH DATA (Atomic Increment)
      const pitchRef = doc(db, "pitches", pitchId);
      await updateDoc(pitchRef, {
        raisedAmount: increment(numericAmount),
        interested: increment(1)
      });

      // 3. NOTIFY ENTREPRENEUR
      await addDoc(collection(db, "notifications"), {
        userId: entrepreneurId,
        title: "New Investment! 💰",
        message: `${user.email} has invested $${numericAmount} in ${pitchTitle}.`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      // Wait 3 seconds to show success then go back
      setTimeout(() => router.replace('/investor/dashboard'), 3000);

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
        <Text style={styles.successTitle}>Investment Successful!</Text>
        <Text style={styles.successSub}>You are now a stakeholder in {pitchTitle}.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Project</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Investing in</Text>
          <Text style={styles.pitchName}>{pitchTitle}</Text>
        </View>

        {!showGateway ? (
          <>
            <Text style={styles.label}>Investment Amount ($)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            <Text style={styles.disclaimer}>
              By proceeding to checkout, you agree to commit these funds to the entrepreneur's business plan.
            </Text>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleProceedToPayment}
            >
              <Text style={styles.confirmText}>Proceed to Secure Checkout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <PaymentGateway
            amount={amount}
            onPaymentSuccess={handleConfirmInvestment}
            onCancel={() => setShowGateway(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  content: { padding: 25 },
  infoBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 15, marginBottom: 30 },
  infoLabel: { color: '#64748B', fontSize: 12, textTransform: 'uppercase' },
  pitchName: { fontSize: 20, fontWeight: '800', color: '#4F46E5', marginTop: 5 },
  label: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#4F46E5', paddingBottom: 10 },
  currencySymbol: { fontSize: 32, fontWeight: '800', color: '#1E293B' },
  input: { flex: 1, fontSize: 32, fontWeight: '800', marginLeft: 10 },
  disclaimer: { color: '#94A3B8', fontSize: 12, marginTop: 20, lineHeight: 18 },
  confirmBtn: { backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 15, marginTop: 40, alignItems: 'center', elevation: 5 },
  confirmText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginTop: 20 },
  successSub: { fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 10 },
});