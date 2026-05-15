import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, StatusBar, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, query, collection, where, setDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

export default function PayoutsScreen() {
  const router = useRouter();
  const { status: redirectStatus } = useLocalSearchParams();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Stripe Connect State
  const [stripeAccountId, setStripeAccountId] = useState(null);
  const [isStripeActive, setIsStripeActive] = useState(false);
  const [stripeBalance, setStripeBalance] = useState({ available: 0, pending: 0 });

  useEffect(() => {
    if (!user) return;

    // 1. Listen to Wallet & Stripe Profile
    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStripeAccountId(data.stripeAccountId || null);
        setIsStripeActive(data.stripeOnboarded || false);
        
        if (data.stripeAccountId) {
          fetchRealTimeBalance(data.stripeAccountId);
        }
      }
    }, (error) => {
      console.error('Payouts user listener failed:', error);
      setLoading(false);
    });

    const walletRef = doc(db, 'wallets', user.uid);
    const unsubWallet = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data().balance || 0);
      } else {
        setDoc(walletRef, { userId: user.uid, balance: 0 });
      }
      setLoading(false);
    }, (error) => {
      console.error('Payouts wallet listener failed:', error);
      setLoading(false);
    });

    // 2. Listen to Escrow Investments
    const qEscrow = query(
      collection(db, "investments"), 
      where("entrepreneurId", "==", user.uid),
      where("status", "==", "escrow")
    );
    const unsubEscrow = onSnapshot(qEscrow, (snap) => {
      const total = snap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      setEscrowBalance(total);
    }, (error) => {
      console.error('Escrow listener failed:', error);
    });

    // 3. Listen to Transaction History
    const qTrans = query(
      collection(db, "transactions"), 
      where("entrepreneurId", "==", user.uid)
    );
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('Transactions listener failed:', error);
    });

    // 4. Handle Redirect from Stripe
    if (redirectStatus === 'success') {
      Alert.alert("Success", "Your Stripe account is now linked!");
      router.setParams({ status: null });
    }

    return () => {
      unsubUser();
      unsubWallet();
      unsubEscrow();
      unsubTrans();
    };
  }, [user, redirectStatus]);

  const fetchRealTimeBalance = async (accountId) => {
    try {
      const getBalance = httpsCallable(functions, 'getConnectBalance');
      const res = await getBalance({ accountId });
      const available = res.data.balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
      const pending = res.data.balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;
      setStripeBalance({ available, pending });
    } catch (e) {
      console.error("Balance Fetch Error:", e);
    }
  };

  const handleOnboard = async () => {
    setActionLoading(true);
    try {
      const createAccount = httpsCallable(functions, 'createConnectAccount');
      const accRes = await createAccount();
      const accountId = accRes.data.accountId;

      const createLink = httpsCallable(functions, 'createConnectAccountLink');
      const linkRes = await createLink({ accountId });
      
      if (linkRes.data.url) {
        await Linking.openURL(linkRes.data.url);
      }
    } catch (e) {
      Alert.alert("Error", "Could not initiate Stripe onboarding.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = () => {
    if (!isStripeActive) {
      Alert.alert("Verification Required", "Please link your bank account via Stripe first.", [
        { text: "Later", style: 'cancel' },
        { text: "Link Now", onPress: handleOnboard }
      ]);
      return;
    }

    const availableAmount = balance; // Use internal wallet balance for payout
    if (availableAmount <= 0) {
      Alert.alert("Notice", "No available funds to withdraw.");
      return;
    }

    Alert.alert(
      "Confirm Payout",
      `Transfer $${availableAmount.toLocaleString()} to your bank account?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Transfer", 
          onPress: async () => {
            setActionLoading(true);
            try {
              const processPayout = httpsCallable(functions, 'processConnectPayout');
              await processPayout({ accountId: stripeAccountId, amount: Math.round(availableAmount * 100) });
              
              // Record locally as well (simulation since we don't have a backend trigger for this yet)
              // In production, this would be handled by a webhook
              Alert.alert("Success!", "Payout processed. Real-time transfer initiated.");
            } catch (e) {
              Alert.alert("Transfer Failed", e.message || "Gateway error.");
            } finally {
              setActionLoading(false);
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entrepreneur Wallet</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* REAL-TIME GATEWAY CARD */}
        <View style={styles.balanceCard}>
          <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.cardGradient}>
            <View style={styles.gateLabel}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.balanceLabel}>Real-Time Payout Balance</Text>
            </View>
            <Text style={styles.balanceBig}>${balance.toLocaleString()}</Text>
            
            <View style={styles.stripeInfo}>
               <Text style={styles.stripeText}>
                 {isStripeActive ? `Connected: ${stripeAccountId.slice(0,10)}...` : 'Banking Not Connected'}
               </Text>
            </View>

            <TouchableOpacity 
              style={[styles.withdrawBtn, (balance <= 0 || actionLoading) && { opacity: 0.7 }]} 
              onPress={isStripeActive ? handleWithdraw : handleOnboard}
              disabled={actionLoading || (isStripeActive && balance <= 0)}
            >
              {actionLoading ? <ActivityIndicator color="#4F46E5" /> : (
                <Text style={styles.withdrawBtnText}>
                  {isStripeActive ? 'Withdraw via Gateway' : 'Setup Real-Time Payouts'}
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.miniStat}>
             <Text style={styles.statLabel}>Pending Escrow</Text>
             <Text style={styles.statValue}>${escrowBalance.toLocaleString()}</Text>
          </View>
          <View style={styles.miniStat}>
             <Text style={styles.statLabel}>Gateway Available</Text>
             <Text style={styles.statValue}>${stripeBalance.available.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={20} color="#4F46E5" />
          <Text style={styles.infoText}>
            Your payouts are secured by <Text style={{fontWeight: '700'}}>Stripe Connect</Text>. Verify your identity to enable instant bank transfers.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Transaction Gateway Feed</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent transactions found.</Text>
          </View>
        ) : (
          transactions.map((t) => (
            <View key={t.id} style={styles.transCard}>
              <View style={[styles.transIcon, { backgroundColor: (t.status || 'pending') === 'escrow' ? '#FFFBEB' : '#ECFDF5' }]}>
                <Ionicons 
                  name={(t.status || 'pending') === 'escrow' ? 'time' : 'flash'} 
                  size={20} 
                  color={(t.status || 'pending') === 'escrow' ? '#F59E0B' : '#10B981'} 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.transTitle}>{t.pitchTitle || 'Direct Investment'}</Text>
                <Text style={styles.transDate}>
                  {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleTimeString() : 'Real-time'} • {(t.status || 'pending').toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.transAmount, { color: (t.status || 'pending') === 'escrow' ? '#64748B' : '#10B981' }]}>
                +${t.amount?.toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', justifyContent: 'space-between', elevation: 2 },
  backCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  content: { padding: 20 },
  balanceCard: { borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 15 },
  cardGradient: { padding: 30, alignItems: 'center' },
  gateLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  balanceBig: { color: '#fff', fontSize: 48, fontWeight: '900' },
  stripeInfo: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  stripeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  withdrawBtn: { backgroundColor: '#fff', width: '100%', paddingVertical: 16, borderRadius: 16, marginTop: 25, alignItems: 'center' },
  withdrawBtnText: { color: '#4F46E5', fontSize: 16, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 15 },
  miniStat: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginTop: 4 },
  infoCard: { flexDirection: 'row', backgroundColor: '#EEF2FF', padding: 16, borderRadius: 20, marginTop: 20, gap: 12, borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  infoText: { flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 30, marginBottom: 15 },
  transCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 24, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
  transIcon: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  transTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  transDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  transAmount: { fontSize: 16, fontWeight: '900' },
  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 24 },
  emptyText: { color: '#94A3B8', fontWeight: '600' }
});
