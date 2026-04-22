import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, functions } from '../../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export default function PayoutsScreen() {
  const router = useRouter();
  const { status } = useLocalSearchParams();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(true);
  const [stripeAccountId, setStripeAccountId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      Alert.alert("Success!", "Your bank account has been connected securely.");
    }
    fetchData();
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const data = snap.data();
      
      if (data?.stripeAccountId) {
        setStripeAccountId(data.stripeAccountId);
        await fetchBalance(data.stripeAccountId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (accountId) => {
    try {
      const getConnectBalance = httpsCallable(functions, 'getConnectBalance');
      const res = await getConnectBalance({ accountId });
      setBalance(res.data.balance);
    } catch (e) {
      console.error("Balance fetch error:", e);
    }
  };

  const handleConnectBank = async () => {
    setActionLoading(true);
    try {
      const createConnectAccount = httpsCallable(functions, 'createConnectAccount');
      const createConnectAccountLink = httpsCallable(functions, 'createConnectAccountLink');

      // 1. Ensure Stripe Express account exists for Entrepreneur
      const actRes = await createConnectAccount();
      const acctId = actRes.data.accountId;

      // 2. Generate secure onboarding link
      const linkRes = await createConnectAccountLink({ accountId: acctId });
      const url = linkRes.data.url;

      // 3. Open default browser securely
      Linking.openURL(url);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e.message || "Could not start bank linking process.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
     if (!balance?.available?.[0]?.amount) {
         Alert.alert("Notice", "No available funds to withdraw right now.");
         return;
     }
     const availableAmount = balance.available[0].amount;
     
     setActionLoading(true);
     try {
       const processConnectPayout = httpsCallable(functions, 'processConnectPayout');
       await processConnectPayout({ accountId: stripeAccountId, amount: availableAmount });
       Alert.alert("Success!", "Your funds are actively being transferred to your bank!");
       await fetchBalance(stripeAccountId); // Refresh displayed balance
     } catch (e) {
       console.error("Withdraw error", e);
       Alert.alert("Withdrawal Failed", e.message || "An error occurred fetching your payout.");
     } finally {
       setActionLoading(false);
     }
  };

  if (loading) {
     return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
  }

  // Format balances nicely
  const availableStr = balance?.available?.[0]?.amount ? `$${(balance.available[0].amount / 100).toFixed(2)}` : '$0.00';
  const pendingStr = balance?.pending?.[0]?.amount ? `$${(balance.pending[0].amount / 100).toFixed(2)}` : '$0.00';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payouts & Escrow</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.content}>
        {!stripeAccountId ? (
           <View style={styles.onboardCard}>
              <Ionicons name="business" size={60} color="#4F46E5" style={{ alignSelf: 'center', marginBottom: 20 }}/>
              <Text style={styles.onboardTitle}>Verify Identity & Bank</Text>
              <Text style={styles.onboardText}>
                We partner with Stripe to securely pay out your funded investments directly to your checking account. 
                You need to briefly verify your identity and link a bank.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleConnectBank} disabled={actionLoading}>
                 {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Complete Verification</Text>}
              </TouchableOpacity>
           </View>
        ) : (
           <View>
              <View style={styles.balanceCard}>
                 <Text style={styles.balanceLabel}>Available to Withdraw</Text>
                 <Text style={styles.balanceBig}>{availableStr}</Text>
                 
                 <View style={styles.pendingRow}>
                     <Text style={styles.pendingText}>Pending in Escrow</Text>
                     <Text style={styles.pendingAmount}>{pendingStr}</Text>
                 </View>

                 <TouchableOpacity 
                    style={[styles.primaryBtn, {marginTop: 20, opacity: balance?.available?.[0]?.amount ? 1 : 0.6}]} 
                    onPress={handleWithdraw} 
                    disabled={actionLoading || !balance?.available?.[0]?.amount}
                 >
                    {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Transfer to Bank</Text>}
                 </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                  <Ionicons name="information-circle-outline" size={20} color="#64748B" />
                  <Text style={styles.infoText}>Funds from investors sit securely in pending escrow for 2-3 days before becoming available for withdrawal.</Text>
              </View>

              <TouchableOpacity style={styles.secondaryBtn} onPress={handleConnectBank} disabled={actionLoading}>
                <Ionicons name="open-outline" size={18} color="#4F46E5" />
                <Text style={styles.secondaryBtnText}>Update Tax & Bank Details</Text>
              </TouchableOpacity>
           </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', justifyContent: 'space-between', elevation: 2 },
  backCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  content: { padding: 20 },
  onboardCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 30, elevation: 4, marginTop: 40 },
  onboardTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 15 },
  onboardText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  primaryBtn: { backgroundColor: '#4F46E5', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  balanceCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, elevation: 4, marginTop: 10 },
  balanceLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', alignSelf: 'center' },
  balanceBig: { fontSize: 48, fontWeight: '900', color: '#10B981', alignSelf: 'center', marginVertical: 10 },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginTop: 10 },
  pendingText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  pendingAmount: { fontSize: 14, fontWeight: '800', color: '#F59E0B' },
  infoCard: { flexDirection: 'row', backgroundColor: '#E2E8F0', padding: 16, borderRadius: 12, marginTop: 20, gap: 10 },
  infoText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
  secondaryBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 30, alignSelf: 'center', padding: 15 },
  secondaryBtnText: { color: '#4F46E5', fontSize: 14, fontWeight: '700' }
});
