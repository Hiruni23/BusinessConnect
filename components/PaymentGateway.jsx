import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentGateway({ amount, onPaymentSuccess, onCancel }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const processPayment = () => {
    // 🛡️ SIMULATION LOGIC: 
    // In a real app, you would send this to Stripe/PayPal API
    if (cardNumber.length < 16 || cvv.length < 3) {
      alert("Invalid Card Details");
      return;
    }
    
    onPaymentSuccess(); // Proceed to Firebase update
  };

  return (
    <View style={styles.gatewayContainer}>
      <Text style={styles.gatewayTitle}>Secure Checkout</Text>
      <Text style={styles.amountLabel}>Total Investment: ${amount}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Card Number</Text>
        <TextInput 
          style={styles.input} 
          placeholder="4242 4242 4242 4242" 
          keyboardType="numeric"
          maxLength={16}
          onChangeText={setCardNumber}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={[styles.inputGroup, { width: '45%' }]}>
          <Text style={styles.label}>Expiry</Text>
          <TextInput style={styles.input} placeholder="MM/YY" maxLength={5} onChangeText={setExpiry}/>
        </View>
        <View style={[styles.inputGroup, { width: '45%' }]}>
          <Text style={styles.label}>CVV</Text>
          <TextInput style={styles.input} placeholder="123" secureTextEntry maxLength={3} onChangeText={setCvv}/>
        </View>
      </View>

      <TouchableOpacity style={styles.payBtn} onPress={processPayment}>
        <Ionicons name="lock-closed" size={18} color="#fff" />
        <Text style={styles.payBtnText}>Authorize Payment</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  gatewayContainer: { backgroundColor: '#fff', padding: 25, borderRadius: 25, elevation: 10 },
  gatewayTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 5 },
  amountLabel: { fontSize: 16, color: '#4F46E5', fontWeight: '700', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 5 },
  input: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 8, fontSize: 16 },
  payBtn: { backgroundColor: '#1E293B', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 10 },
  cancelText: { textAlign: 'center', marginTop: 15, color: '#94A3B8', fontSize: 12 }
});