import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

let useStripe;
if (Platform.OS !== 'web') {
  const stripeModule = require('@stripe/stripe-react-native');
  useStripe = stripeModule.useStripe;
}

export default function PaymentGateway({ amount, onPaymentSuccess, onCancel }) {
  const stripeHook = Platform.OS !== 'web' && useStripe ? useStripe() : {};
  const { initPaymentSheet, presentPaymentSheet } = stripeHook;
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      initializePaymentSheet();
    } else {
      setLoading(false);
    }
  }, []);

  const initializePaymentSheet = async () => {
    setLoading(true);
    try {
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      
      const response = await createPaymentIntent({ amount });
      const { clientSecret } = response.data;
      
      if (!clientSecret) throw new Error("No client secret returned");

      const { error } = await initPaymentSheet({
        merchantDisplayName: "BusinessConnect Inc.",
        paymentIntentClientSecret: clientSecret,
        returnURL: 'businessconnect://stripe-redirect',
        allowsDelayedPaymentMethods: false,
      });

      if (error) {
        Alert.alert("Initialization Error", error.message);
      } else {
        setReady(true);
      }
    } catch (e) {
      console.error("Initialization Failed:", e);
      Alert.alert("Error", "Could not initialize secure payment interface.");
    } finally {
      setLoading(false);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    
    if (error) {
      if (error.code !== 'Canceled') {
        Alert.alert(`Payment Failed`, error.message);
      }
    } else {
      onPaymentSuccess();
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.gatewayContainer}>
        <Text style={styles.gatewayTitle}>Payment Not Available</Text>
        <Text style={styles.infoText}>
          Payment processing is only available on mobile devices. Please use the app on iOS or Android.
        </Text>
        <TouchableOpacity onPress={onCancel} style={{ marginTop: 25 }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.gatewayContainer}>
      <Text style={styles.gatewayTitle}>Secure Checkout 🔒</Text>
      <Text style={styles.amountLabel}>Total Investment: ${amount}</Text>
      
      <Text style={styles.infoText}>
        We partner with Stripe to securely process your transactions. Your card details never touch our servers.
      </Text>

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Connecting to Secure Server...</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.payBtn, !ready && { opacity: 0.5 }]} 
          onPress={openPaymentSheet} 
          disabled={!ready}
        >
          <Ionicons name="card" size={18} color="#fff" />
          <Text style={styles.payBtnText}>Pay with Stripe</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onCancel} style={{ marginTop: 25 }}>
        <Text style={styles.cancelText}>Cancel Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  gatewayContainer: { backgroundColor: '#fff', padding: 25, borderRadius: 25, elevation: 10 },
  gatewayTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 5 },
  amountLabel: { fontSize: 16, color: '#4F46E5', fontWeight: '700', marginBottom: 20 },
  infoText: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 20, fontStyle: 'italic' },
  loaderArea: { marginVertical: 20, alignItems: 'center' },
  loaderText: { marginTop: 10, fontSize: 12, color: '#94A3B8' },
  payBtn: { backgroundColor: '#4F46E5', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 10 },
  cancelText: { textAlign: 'center', color: '#EF4444', fontSize: 13, fontWeight: '600' }
});