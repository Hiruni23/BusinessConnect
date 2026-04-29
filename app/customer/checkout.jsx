import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, StatusBar, Alert, ScrollView, Image } from 'react-native';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function Checkout() {
  const router = useRouter();
  const { total } = useLocalSearchParams();
  const user = auth.currentUser;
  
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const fetchCart = async () => {
       const cartSnap = await getDoc(doc(db, "cart", user.uid));
       if (cartSnap.exists()) {
          setCartItems(cartSnap.data().items || []);
       }
    };
    fetchCart();
  }, [user]);

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvc || !name) {
      Alert.alert("Missing Details", "Please fill in all card details.");
      return;
    }

    setProcessing(true);

    try {
      if (cartItems.length === 0) {
        Alert.alert("Empty Cart", "Your cart is empty.");
        setProcessing(false);
        return;
      }
      
      // Simulate Payment Delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      const newOrder = {
        userId: user.uid,
        items: cartItems,
        total: parseFloat(total) || 0,
        status: "pending",
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "orders"), newOrder);
      await deleteDoc(doc(db, "cart", user.uid));

      Alert.alert(
        "Success", 
        "Your order has been placed successfully!",
        [{ text: "View Orders", onPress: () => router.replace('/customer/orders') }]
      );
    } catch (error) {
      console.error("Payment Error:", error);
      Alert.alert("Payment Failed", "An error occurred while processing your payment.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* CART SUMMARY PREVIEW */}
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Review Items</Text>
             <View style={styles.itemsPreview}>
                {cartItems.map((item, idx) => (
                   <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{item.qty}x</Text>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemPrice}>${(item.price * item.qty).toLocaleString()}</Text>
                   </View>
                ))}
                <View style={styles.totalPreviewRow}>
                   <Text style={styles.totalPreviewLabel}>Order Total</Text>
                   <Text style={styles.totalPreviewVal}>${Number(total || 0).toLocaleString()}</Text>
                </View>
             </View>
          </View>

          {/* CARD VISUAL */}
          <View style={styles.cardContainer}>
             <LinearGradient 
               colors={['#1E293B', '#334155']} 
               style={styles.cardVisual}
               start={{x: 0, y: 0}}
               end={{x: 1, y: 1}}
             >
                <View style={styles.cardTop}>
                   <Ionicons name="wifi" size={24} color="rgba(255,255,255,0.3)" style={{ transform: [{ rotate: '90deg' }] }} />
                   <Text style={styles.cardBrand}>SILICON RESERVE</Text>
                </View>
                <Text style={styles.cardNumberText}>
                   {cardNumber ? cardNumber.replace(/(.{4})/g, '$1 ') : '•••• •••• •••• ••••'}
                </Text>
                <View style={styles.cardBottom}>
                   <View>
                      <Text style={styles.cardLabel}>CARD HOLDER</Text>
                      <Text style={styles.cardVal}>{name || 'YOUR NAME'}</Text>
                   </View>
                   <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardLabel}>EXPIRES</Text>
                      <Text style={styles.cardVal}>{expiry || 'MM/YY'}</Text>
                   </View>
                </View>
             </LinearGradient>
          </View>

          {/* PAYMENT INPUTS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" />
                <TextInput 
                  placeholder="e.g. John Doe" 
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.inputBox}>
                <Ionicons name="card-outline" size={20} color="#94A3B8" />
                <TextInput 
                  placeholder="0000 0000 0000 0000" 
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={16}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 15 }]}>
                <Text style={styles.inputLabel}>Expiry</Text>
                <View style={styles.inputBox}>
                  <TextInput 
                    placeholder="MM/YY" 
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={5}
                    value={expiry}
                    onChangeText={setExpiry}
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVC</Text>
                <View style={styles.inputBox}>
                  <TextInput 
                    placeholder="123" 
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    value={cvc}
                    onChangeText={setCvc}
                    placeholderTextColor="#CBD5E1"
                  />
                  <Ionicons name="help-circle-outline" size={18} color="#CBD5E1" />
                </View>
              </View>
            </View>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.payBtn, processing && styles.payBtnDisabled]} 
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.payBtnText}>Confirm Payment • ${Number(total || 0).toLocaleString()}</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.secureText}>
            <Ionicons name="shield-checkmark" size={12} color="#10B981" /> Secure SSL Encryption
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  section: { marginVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
  
  itemsPreview: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemQty: { fontSize: 14, fontWeight: '800', color: '#6366F1', width: 30 },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#475569' },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  totalPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15, marginTop: 5 },
  totalPreviewLabel: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  totalPreviewVal: { fontSize: 18, fontWeight: '900', color: '#6366F1' },

  cardContainer: { marginVertical: 20 },
  cardVisual: { height: 200, borderRadius: 28, padding: 25, justifyContent: 'space-between', elevation: 12, shadowColor: '#1E293B', shadowOpacity: 0.3, shadowRadius: 15 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrand: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  cardNumberText: { color: '#FFF', fontSize: 22, fontWeight: '700', letterSpacing: 3, textAlign: 'center' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  cardVal: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  inputWrapper: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 8, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 15, height: 56 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1E293B', fontWeight: '600' },
  row: { flexDirection: 'row' },

  footer: { paddingHorizontal: 24, paddingBottom: 30, paddingTop: 10, backgroundColor: '#F8FAFC' },
  payBtn: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 20, paddingVertical: 20, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15 },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  secureText: { textAlign: 'center', marginTop: 15, fontSize: 12, color: '#10B981', fontWeight: '700' }
});
