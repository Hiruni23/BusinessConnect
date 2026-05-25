import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import PaymentGateway from '../../components/PaymentGateway';

export default function ConsultationRequestsScreen() {
  const router = useRouter();
  const { theme: T, isDark } = useTheme();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);
  
  // Payment gateway modal state
  const [showGateway, setShowGateway] = useState(false);
  const [payingRequest, setPayingRequest] = useState(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'consultations'), where('entrepreneurId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        list.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        setConsultations(list);
        setLoading(false);
      },
      (error) => {
        console.error('Consultation requests listener failed:', error);
        setLoading(false);
        Alert.alert('Error', 'Unable to load consultation requests right now.');
      }
    );

    return unsubscribe;
  }, [user]);

  const counts = useMemo(() => {
    const summary = { pending: 0, accepted: 0, rejected: 0, completed: 0 };
    consultations.forEach((item) => {
      const status = String(item.status || 'pending').toLowerCase();
      if (summary[status] !== undefined) summary[status] += 1;
    });
    return summary;
  }, [consultations]);

  const statusStyle = (status) => {
    switch (String(status || 'pending').toLowerCase()) {
      case 'accepted':
        return { bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', fg: '#10B981', icon: 'checkmark-circle' };
      case 'rejected':
        return { bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', fg: '#EF4444', icon: 'close-circle' };
      case 'completed':
        return { bg: isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF', fg: '#4F46E5', icon: 'flag' };
      default:
        return { bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB', fg: '#D97706', icon: 'time' };
    }
  };

  const handleStartPayment = (request) => {
    setPayingRequest(request);
    setShowGateway(true);
  };

  const handleProcessPayment = async () => {
    if (!payingRequest) return;
    try {
      const consultationRef = doc(db, 'consultations', payingRequest.id);
      await updateDoc(consultationRef, {
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to update consultation payment status:", err);
      throw err;
    }
  };

  const handlePaymentSuccess = () => {
    setShowGateway(false);
    setPayingRequest(null);
    Alert.alert('Payment Successful 💰', 'Your consultation payment was processed successfully. The stakeholder has been notified and can now accept your booking.');
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="small" color={T.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />

      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: T.surface2 }]}>
          <Ionicons name="chevron-back" size={20} color={T.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: T.text }]}>Consultations</Text>
          <Text style={[styles.subtitle, { color: T.subtext }]}>Track accept, reject, and payment status.</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/entrepreneur/book-consultation')} style={[styles.newBtn, { backgroundColor: T.accent }]}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard label="Pending" value={counts.pending} tone="#D97706" bg={isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB'} />
        <SummaryCard label="Accepted" value={counts.accepted} tone="#10B981" bg={isDark ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5'} />
        <SummaryCard label="Completed" value={counts.completed} tone="#4F46E5" bg={isDark ? 'rgba(79, 70, 229, 0.08)' : '#EEF2FF'} />
      </View>

      {consultations.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: T.surface }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={T.subtext} />
          <Text style={[styles.emptyTitle, { color: T.text }]}>No consultations yet</Text>
          <Text style={[styles.emptyText, { color: T.subtext }]}>Your booked consultations will appear here once you request them.</Text>
          <TouchableOpacity 
            style={[styles.bookBtnTextWrap, { backgroundColor: T.accent, marginTop: 18 }]} 
            onPress={() => router.push('/entrepreneur/book-consultation')}
          >
            <Text style={{ color: '#FFF', fontWeight: '800' }}>Request First Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {consultations.map((item) => {
            const palette = statusStyle(item.status);
            const isPaid = String(item.paymentStatus || 'unpaid').toLowerCase() === 'paid';
            return (
              <View key={item.id} style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.cardIconWrap, { backgroundColor: T.surface2 }]}>
                    <Ionicons name="videocam-outline" size={20} color={T.accent} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.cardTitle, { color: T.text }]} numberOfLines={1}>
                      {item.topic || item.title || 'Consultation Request'}
                    </Text>
                    <Text style={[styles.cardMeta, { color: T.subtext }]} numberOfLines={1}>
                      {item.stakeholderName || 'Strategic Expert'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
                    <Ionicons name={palette.icon} size={12} color={palette.fg} />
                    <Text style={[styles.statusText, { color: palette.fg }]}>{String(item.status || 'pending').toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={[styles.description, { color: T.subtext }]} numberOfLines={3}>
                  {item.notes || 'No additional notes provided.'}
                </Text>

                <View style={[styles.divider, { backgroundColor: T.border }]} />

                <View style={styles.cardFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.footerTimeLabel}>SCHEDULED TIME</Text>
                    <Text style={[styles.footerText, { color: T.text }]}>
                      {item.scheduledAt?.toDate 
                        ? item.scheduledAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                        : 'Schedule pending'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.footerTimeLabel}>FEE (USD)</Text>
                    <Text style={[styles.amountText, { color: T.text }]}>${Number(item.fee || 0).toFixed(2)}</Text>
                  </View>
                </View>

                {/* Stripe Payment Status Row */}
                <View style={[styles.paymentRow, { backgroundColor: T.surface2 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons 
                      name={isPaid ? "checkmark-circle" : "alert-circle"} 
                      size={16} 
                      color={isPaid ? T.green : T.amber} 
                    />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isPaid ? T.green : T.amber }}>
                      {isPaid ? "PAID VIA STRIPE SECURE" : "PAYMENT OUTSTANDING"}
                    </Text>
                  </View>
                  
                  {!isPaid && (
                    <TouchableOpacity 
                      style={[styles.payNowBtn, { backgroundColor: T.accent }]} 
                      onPress={() => handleStartPayment(item)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.payNowBtnText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Stripe Payment modal integration */}
      <Modal
        visible={showGateway}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGateway(false)}
      >
        <View style={styles.modalOverlay}>
          {payingRequest && (
            <PaymentGateway
              amount={payingRequest.fee}
              title="Pay Consultant Securely"
              subtitle="Powered by Stripe"
              amountLabel="Consultation Fee"
              payButtonText="Pay Consultant"
              successTitle="Payment Completed!"
              successSub="Payment registered in escrow."
              processingText="Confirming Secure Transaction..."
              subProcessingText="Securing your consult appointment"
              onProcessPayment={handleProcessPayment}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowGateway(false)}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const SummaryCard = ({ label, value, tone, bg }) => (
  <View style={[styles.summaryCard, { backgroundColor: bg }]}>
    <Text style={[styles.summaryValue, { color: tone }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.01 },
  subtitle: { fontSize: 11, marginTop: 1 },
  newBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 34, borderRadius: 17, gap: 4 },
  newBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginVertical: 14 },
  summaryCard: { flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12 },
  summaryValue: { fontSize: 20, fontWeight: '900' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 30, gap: 14 },
  card: { borderRadius: 20, padding: 16, borderWidth: 1, elevation: 3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, shadowOpacity: 0.03 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  description: { fontSize: 12, lineHeight: 18, marginTop: 12 },
  divider: { height: 1, marginVertical: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTimeLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 2 },
  footerText: { fontSize: 12, fontWeight: '700' },
  amountText: { fontSize: 16, fontWeight: '900' },
  emptyCard: { flex: 1, margin: 20, borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 30, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 12 },
  emptyText: { fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  bookBtnTextWrap: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  paymentRow: { marginTop: 14, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payNowBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  payNowBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
});
