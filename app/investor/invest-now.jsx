import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Dimensions, 
  ScrollView, 
  Modal, 
  StatusBar 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db, auth } from '../../firebaseConfig';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PaymentGateway from '../../components/PaymentGateway';

const { width } = Dimensions.get('window');

const PERKS = [
  { amount: 100, label: "Digital Badge", desc: "Show your support with a verified badge.", color: "#94A3B8" },
  { amount: 500, label: "Early Access", desc: "Get the product 2 months before launch.", color: "#10B981" },
  { amount: 2500, label: "Founders Edition", desc: "Limited edition units + your name in credits.", color: "#6366F1" },
  { amount: 10000, label: "VIP Insider", desc: "Private Q&A with the innovator team.", color: "#A855F7" },
];

export default function InvestNow() {
  const router = useRouter();
  const { pitchId, pitchTitle, entrepreneurId } = useLocalSearchParams();
  
  const [amount, setAmount] = useState('500');
  const [showGateway, setShowGateway] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentPerk = [...PERKS].reverse().find(p => parseInt(amount) >= p.amount) || PERKS[0];

  const handleStartPayment = () => {
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (!numericAmount || numericAmount < 10) {
      Alert.alert("Invalid Amount", "Minimum investment is $10.");
      return;
    }
    setShowGateway(true);
  };

  const handlePaymentSuccess = () => {
    setShowGateway(false);
    setSuccess(true);
    setTimeout(() => {
      router.replace('/investor/dashboard');
    }, 3000);
  };

  const handleProcessPayment = async () => {
    const user = auth.currentUser;
    const numericAmount = Number(amount);
    
    // 1. Create Investment Record (Escrow)
    await addDoc(collection(db, "investments"), {
      projectId: pitchId || "unknown",
      projectTitle: pitchTitle || "Marketplace Investment",
      investorId: user.uid,
      investorEmail: user.email || "anonymous",
      entrepreneurId: entrepreneurId || "unknown",
      amount: numericAmount,
      status: "escrow", 
      createdAt: serverTimestamp()
    });

    // 2. Record Transaction
    await addDoc(collection(db, "transactions"), {
      pitchId: pitchId || "unknown",
      pitchTitle: pitchTitle || "Marketplace Investment",
      investorId: user.uid,
      investorEmail: user.email || "anonymous",
      entrepreneurId: entrepreneurId || "unknown",
      amount: numericAmount,
      timestamp: serverTimestamp(),
      type: 'equity_investment',
      status: 'escrow'
    });

    // 3. Update Pitch Stats
    if (pitchId) {
      await updateDoc(doc(db, "pitches", pitchId), {
        interested: increment(1),
        raisedAmount: increment(numericAmount),
        updatedAt: serverTimestamp()
      });
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.successCircle}>
          <Ionicons name="checkmark" size={60} color="#FFF" />
        </LinearGradient>
        <Text style={styles.successTitle}>Transaction Secured</Text>
        <Text style={styles.successSub}>
          You have successfully backed <Text style={{fontWeight: '800'}}>{pitchTitle}</Text>.
        </Text>
        <ActivityIndicator color="#10B981" style={{marginTop: 30}} />
        <Text style={styles.redirectText}>Finalizing your portfolio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Investment Portal</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Funding Request For</Text>
            <Text style={styles.pitchName}>{pitchTitle}</Text>
          </View>

          {/* PERK HIGHLIGHT */}
          <View style={styles.perkCard}>
             <LinearGradient colors={[currentPerk.color + '15', '#FFF']} style={styles.perkGradient}>
               <View style={styles.perkHeader}>
                  <View style={[styles.perkIconCircle, {backgroundColor: currentPerk.color}]}>
                    <Ionicons name="gift" size={18} color="#FFF" />
                  </View>
                  <Text style={[styles.perkTitle, { color: currentPerk.color }]}>{currentPerk.label}</Text>
               </View>
               <Text style={styles.perkDesc}>{currentPerk.desc}</Text>
               <Text style={styles.perkMin}>Qualification Tier: ${currentPerk.amount.toLocaleString()}</Text>
             </LinearGradient>
          </View>

          {/* TYPE TO FUND SECTION */}
          <View style={styles.fundSection}>
            <Text style={styles.fundLabel}>Enter Investment Amount</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                keyboardType="numeric"
                onChangeText={(val) => setAmount(val.replace(/[^0-9]/g, ''))}
                placeholder="0.00"
                autoFocus
              />
            </View>
            <Text style={styles.fundHint}>Enter any amount starting from $10.00</Text>
          </View>

          <TouchableOpacity 
            style={styles.payBtn} 
            onPress={handleStartPayment}
          >
            <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.btnGradient}>
              <Text style={styles.payText}>Pay ${Number(amount || 0).toLocaleString()}</Text>
              <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{marginLeft: 10}} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={14} color="#94A3B8" />
            <Text style={styles.securityText}>Secured Escrow Simulation</Text>
          </View>
        </ScrollView>

        <Modal
          visible={showGateway}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowGateway(false)}
        >
          <View style={styles.modalOverlay}>
            <PaymentGateway 
              amount={amount}
              onProcessPayment={handleProcessPayment}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowGateway(false)}
            />
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center' },
  backCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  infoBox: { marginBottom: 30 },
  infoLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  pitchName: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginTop: 4 },

  perkCard: { borderRadius: 32, overflow: 'hidden', backgroundColor: '#FFF', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, marginBottom: 40, borderWidth: 1, borderColor: '#F1F5F9' },
  perkGradient: { padding: 24 },
  perkHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  perkIconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  perkTitle: { fontSize: 20, fontWeight: '900', marginLeft: 12 },
  perkDesc: { fontSize: 15, color: '#64748B', lineHeight: 22, fontWeight: '500' },
  perkMin: { fontSize: 12, color: '#94A3B8', fontWeight: '700', marginTop: 15, textTransform: 'uppercase' },

  fundSection: { marginBottom: 40, alignItems: 'center' },
  fundLabel: { fontSize: 14, fontWeight: '800', color: '#64748B', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#4F46E5', paddingBottom: 10, width: '80%' },
  currencySymbol: { fontSize: 40, fontWeight: '900', color: '#1E293B' },
  amountInput: { flex: 1, fontSize: 48, fontWeight: '900', color: '#1E293B', marginLeft: 10, textAlign: 'center' },
  fundHint: { fontSize: 12, color: '#94A3B8', marginTop: 15, fontWeight: '600' },

  payBtn: { height: 72, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.4, shadowRadius: 15, marginTop: 10 },
  disabledBtn: { opacity: 0.7 },
  btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  payText: { color: '#FFF', fontSize: 20, fontWeight: '800' },

  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, gap: 8 },
  securityText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 40 },
  successCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', elevation: 12, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 20 },
  successTitle: { fontSize: 32, fontWeight: '900', color: '#1E293B', marginTop: 30 },
  successSub: { fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 24 },
  redirectText: { fontSize: 14, color: '#94A3B8', marginTop: 15, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
});