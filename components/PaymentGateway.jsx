import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { useStripe } from '@stripe/stripe-react-native';
import { auth, functions } from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function PaymentGateway({ 
  amount, 
  onProcessPayment, 
  onSuccess, 
  onCancel,
  title = 'Secure Payment Portal',
  subtitle = 'Powered by Stripe',
  amountLabel = 'Total Investment',
  payButtonText = 'Pay with Stripe',
  successTitle = 'Payment Successful!',
  successSub = 'Record added to Escrow.',
  processingText = 'Confirming Transaction...',
  subProcessingText = 'Updating your investment portfolio'
}) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState('summary'); // 'summary', 'processing', 'success'

  useEffect(() => {
    initializePaymentSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (onProcessPayment) {
        await onProcessPayment();
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

  // Clean the title by removing trailing lock emoji if it was passed from a hardcoded default
  const cleanTitle = title ? title.replace(/[🔒🔒]/g, '').trim() : 'Secure Payment Portal';

  return (
    <View style={styles.container}>
      {step === 'summary' && (
        <View style={styles.card}>
          {/* Subtle drag/notch bar to mimic native bottom sheet */}
          <View style={styles.sheetHandle} />

          {/* Premium Lock Icon Circle */}
          <View style={styles.headerIconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={24} color="#6366F1" />
            </View>
          </View>

          <Text style={styles.title}>{cleanTitle}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          
          <View style={styles.divider} />

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>{amountLabel}</Text>
            <View style={styles.amountValueRow}>
              <Text style={styles.amountValue}>${Number(amount).toLocaleString()}</Text>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyText}>USD</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Bank-Grade Security</Text>
              <Text style={styles.infoText}>
                Payments are processed securely. Your card details are never stored on our servers.
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.payBtn, (!ready || loading) && { opacity: 0.6 }]} 
            onPress={handleRealPayment}
            disabled={!ready || loading}
          >
            <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.btnGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="card-outline" size={20} color="#fff" />
                  <Text style={styles.payBtnText}>{payButtonText}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} disabled={loading}>
            <Text style={styles.cancelText}>Cancel Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'processing' && (
        <View style={styles.centerCard}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.processingText}>{processingText}</Text>
          <Text style={styles.subProcessingText}>{subProcessingText}</Text>
        </View>
      )}

      {step === 'success' && (
        <View style={styles.centerCard}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.successCircle}>
            <Ionicons name="checkmark" size={44} color="#fff" />
          </LinearGradient>
          <Text style={styles.successTitle}>{successTitle}</Text>
          <Text style={styles.successSub}>{successSub}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.92,
    maxWidth: 440,
    alignSelf: 'center',
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  centerCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380,
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 6,
    letterSpacing: 1.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  amountContainer: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  amountValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  currencyBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currencyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    gap: 12,
    alignItems: 'center',
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14532D',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 16,
    fontWeight: '500',
  },
  payBtn: {
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  payBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  cancelBtn: {
    marginTop: 18,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  cancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  processingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 24,
    textAlign: 'center',
  },
  subProcessingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 24,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
