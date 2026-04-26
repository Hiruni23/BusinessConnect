import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useStripe } from '@stripe/stripe-react-native';
import { db, auth, functions } from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

export default function PaymentGateway({ 
  amount, 
  projectId, 
  projectTitle, 
  entrepreneurId, 
  onSuccess, 
  onCancel 
}) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState('summary'); // 'summary', 'processing', 'success'

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  const initializePaymentSheet = async () => {
    setLoading(true);
    try {
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const response = await createPaymentIntent({ 
        amount: Number(amount), 
        currency: 'usd' 
      });
      
      const { clientSecret } = response.data;
      if (!clientSecret) throw new Error("No client secret returned");

      const { error } = await initPaymentSheet({
        merchantDisplayName: "BusinessConnect Marketplace",
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          email: auth.currentUser?.email,
        },
        allowsDelayedPaymentMethods: false,
      });

      if (error) {
        Alert.alert("Gateway Error", error.message);
      } else {
        setReady(true);
      }
    } catch (e) {
      console.error("Payment Init Error:", e);
      Alert.alert("Error", "Could not initialize secure payment interface.");
    } finally {
      setLoading(false);
    }
  };

  const handleRealPayment = async () => {
    if (!ready) return;
    
    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code !== 'Canceled') {
        Alert.alert(`Payment Failed`, error.message);
      }
    } else {
      await processPostPayment();
    }
  };

  const processPostPayment = async () => {
    setLoading(true);
    setStep('processing');
    
    try {
      const user = auth.currentUser;
      
      // 1. Create Investment Record (Escrow)
      await addDoc(collection(db, "investments"), {
        projectId: projectId || "unknown",
        projectTitle: projectTitle || "Marketplace Investment",
        investorId: user.uid,
        investorEmail: user.email || "anonymous",
        entrepreneurId: entrepreneurId || "unknown",
        amount: Number(amount),
        status: "escrow", 
        createdAt: serverTimestamp()
      });

      // 2. Record Transaction
      await addDoc(collection(db, "transactions"), {
        pitchId: projectId || "unknown",
        pitchTitle: projectTitle || "Marketplace Investment",
        investorId: user.uid,
        investorEmail: user.email || "anonymous",
        entrepreneurId: entrepreneurId || "unknown",
        amount: Number(amount),
        timestamp: serverTimestamp(),
        type: 'equity_investment',
        status: 'escrow'
      });

      // 3. Update Pitch Stats
      if (projectId) {
        await updateDoc(doc(db, "pitches", projectId), {
          interested: increment(1)
        });
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error(error);
      Alert.alert("Post-Payment Error", "Payment was successful but we couldn't update the record. Please contact support.");
      setStep('summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === 'summary' && (
        <View style={styles.card}>
          <Text style={styles.title}>Secure Payment Portal 🔒</Text>
          <Text style={styles.subtitle}>Powered by Stripe</Text>
          
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Investment</Text>
            <Text style={styles.amountValue}>${Number(amount).toLocaleString()}</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={20} color="#4F46E5" />
            <Text style={styles.infoText}>
              Payments are processed securely. Your card details are never stored on our servers.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.payBtn, (!ready || loading) && { opacity: 0.6 }]} 
            onPress={handleRealPayment}
            disabled={!ready || loading}
          >
            <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.btnGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.payBtnText}>Pay with Stripe</Text>
                  <Ionicons name="card-outline" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} disabled={loading}>
            <Text style={styles.cancelText}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'processing' && (
        <View style={styles.centerCard}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.processingText}>Confirming Transaction...</Text>
          <Text style={styles.subProcessingText}>Updating your investment portfolio</Text>
        </View>
      )}

      {step === 'success' && (
        <View style={styles.centerCard}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={50} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSub}>Record added to Escrow.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  centerCard: { backgroundColor: '#fff', borderRadius: 30, padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  title: { fontSize: 20, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#6366F1', fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 },
  amountContainer: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, marginVertical: 25, alignItems: 'center' },
  amountLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  amountValue: { fontSize: 36, fontWeight: '900', color: '#1E293B', marginTop: 5 },
  infoBox: { flexDirection: 'row', backgroundColor: '#EEF2FF', padding: 15, borderRadius: 15, marginBottom: 25, gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 18 },
  payBtn: { height: 60, borderRadius: 18, overflow: 'hidden' },
  btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { marginTop: 20, alignSelf: 'center' },
  cancelText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  processingText: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 20 },
  subProcessingText: { fontSize: 13, color: '#64748B', marginTop: 8 },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginTop: 20 },
  successSub: { fontSize: 14, color: '#64748B', marginTop: 8 }
});
