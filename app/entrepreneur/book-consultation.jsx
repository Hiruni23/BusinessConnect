import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, Timestamp, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from "expo-linear-gradient";
import { Modal } from 'react-native';
import PaymentGateway from '../../components/PaymentGateway';

export default function BookConsultation() {
  const { theme: T, isDark } = useTheme();
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [stakeholders, setStakeholders] = useState([]);
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [fee, setFee] = useState(0);
  const [showGateway, setShowGateway] = useState(false);
  
  // Date and Time picker state
  const [dateVal, setDateVal] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    // Load available stakeholders (users.role == 'stakeholder')
    const q = query(collection(db, 'users'), where('role', '==', 'stakeholder'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStakeholders(list);
      if (list.length > 0) {
        setSelectedStakeholder(list[0]);
        setFee(list[0]?.consultationFee || list[0]?.fee || 50);
      }
      setLoading(false);
    }, (err) => {
      console.error('Stakeholders listener error', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSelect = (s) => {
    setSelectedStakeholder(s);
    setFee(s?.consultationFee || s?.fee || 50);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const current = new Date(dateVal);
      current.setFullYear(selectedDate.getFullYear());
      current.setMonth(selectedDate.getMonth());
      current.setDate(selectedDate.getDate());
      setDateVal(current);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const current = new Date(dateVal);
      current.setHours(selectedTime.getHours());
      current.setMinutes(selectedTime.getMinutes());
      setDateVal(current);
    }
  };

  const handleProcessPayment = async () => {
    if (!user) return Alert.alert('Sign in required', 'Please sign in to book a consultation');
    if (!selectedStakeholder) return Alert.alert('Select stakeholder', 'Please choose a stakeholder to book with');
    if (!topic) return Alert.alert('Add a topic', 'Please add a brief topic for the consultation');

    try {
      const consultationsRef = collection(db, 'consultations');
      const docRef = await addDoc(consultationsRef, {
        entrepreneurId: user.uid,
        entrepreneurName: user.displayName || user.email?.split('@')[0] || 'Entrepreneur',
        stakeholderId: selectedStakeholder.id,
        stakeholderName: selectedStakeholder.fullName || selectedStakeholder.displayName || '',
        topic,
        notes,
        fee: Number(fee || 0),
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        scheduledAt: Timestamp.fromDate(dateVal),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // create notification for stakeholder
      await addDoc(collection(db, 'notifications'), {
        userId: selectedStakeholder.id,
        type: 'CONSULTATION_REQUEST',
        consultationId: docRef.id,
        title: 'New consultation request',
        message: `${user.displayName || 'Someone'} requested a consultation: ${topic}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // ensure a chat exists between entrepreneur and stakeholder and link it to consultation
      try {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', user.uid));
        const snap = await getDocs(q);
        let chatId = null;
        for (const d of snap.docs) {
          const data = d.data();
          if (data.participants && data.participants.includes(selectedStakeholder.id)) {
            chatId = d.id;
            break;
          }
        }

        if (!chatId) {
          const chatDoc = await addDoc(chatsRef, {
            participants: [user.uid, selectedStakeholder.id],
            stakeholderId: selectedStakeholder.id,
            entrepreneurId: user.uid,
            entrepreneurName: user.displayName || user.email?.split('@')[0] || '',
            stakeholderName: selectedStakeholder.fullName || selectedStakeholder.displayName || '',
            lastMessage: '',
            unreadBy: [selectedStakeholder.id],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          chatId = chatDoc.id;
        }

        // attach chatId to consultation
        await updateDoc(doc(db, 'consultations', docRef.id), { chatId, updatedAt: serverTimestamp() });
      } catch (err) {
        console.error('Chat linking failed', err);
      }
    } catch (error) {
      console.error('Book consultation error', error);
      Alert.alert('Error', 'Failed to book consultation');
      throw error;
    }
  };

  const handleStartPayment = () => {
    if (!user) return Alert.alert('Sign in required', 'Please sign in to book a consultation');
    if (!selectedStakeholder) return Alert.alert('Select stakeholder', 'Please choose a stakeholder to book with');
    if (!topic) return Alert.alert('Add a topic', 'Please add a brief topic for the consultation');
    setShowGateway(true);
  };

  const handlePaymentSuccess = () => {
    setShowGateway(false);
    Alert.alert('Requested', 'Your consultation request was sent and payment was completed.');
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="small" color={T.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Dynamic header background */}
        <View style={[styles.headerContainer, { borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: T.surface2 }]}>
          <Ionicons name="chevron-back" size={20} color={T.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: T.text }]}>Book Consultation</Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <Text style={[styles.sectionLabel, { color: T.subtext }]}>CHOOSE EXPERT STAKEHOLDER</Text>
        
        {stakeholders.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: T.surface2 }]}>
            <Text style={{ color: T.subtext }}>No consultants are currently available.</Text>
          </View>
        ) : (
          stakeholders.map((s) => {
            const isSelected = selectedStakeholder?.id === s.id;
            return (
              <TouchableOpacity 
                key={s.id} 
                style={[
                  styles.card, 
                  { 
                    backgroundColor: T.surface, 
                    borderColor: isSelected ? T.accent : T.border,
                    shadowColor: T.accent,
                    shadowOpacity: isSelected ? 0.08 : 0.02
                  }
                ]} 
                onPress={() => handleSelect(s)}
                activeOpacity={0.9}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.avatar, { backgroundColor: isSelected ? T.accent : T.surface2 }]}>
                    <Text style={[styles.avatarText, { color: isSelected ? '#FFF' : T.accent }]}>
                      {(s.fullName || s.displayName || 'S').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={[styles.cardTitle, { color: T.text }]}>{s.fullName || s.displayName || s.email}</Text>
                    <Text style={[styles.cardSub, { color: T.subtext }]}>{s.consultantTitle || s.roleTitle || 'Strategic Consultant'}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#FBBF24" />
                      <Text style={[styles.ratingText, { color: T.subtext }]}>4.9 (24 sessions)</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.feeText, { color: T.text }]}>${Number(s?.consultationFee || s?.fee || 50).toLocaleString()}</Text>
                  <Text style={[styles.feeLabel, { color: T.subtext }]}>PER SESSION</Text>
                  {isSelected && (
                    <View style={[styles.checkedBadge, { backgroundColor: T.accent }]}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={[styles.sectionLabel, { color: T.subtext, marginTop: 24 }]}>PREFERRED SCHEDULE</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={[styles.pickerButton, { backgroundColor: T.surface, borderColor: T.border }]} 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.pickerIconWrap, { backgroundColor: T.surface2 }]}>
              <Ionicons name="calendar" size={18} color={T.accent} />
            </View>
            <View style={styles.pickerTextWrap}>
              <Text style={[styles.pickerBtnLabel, { color: T.subtext }]}>DATE</Text>
              <Text style={[styles.pickerBtnValue, { color: T.text }]}>
                {dateVal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.pickerButton, { backgroundColor: T.surface, borderColor: T.border }]} 
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.pickerIconWrap, { backgroundColor: T.surface2 }]}>
              <Ionicons name="time" size={18} color={T.accent} />
            </View>
            <View style={styles.pickerTextWrap}>
              <Text style={[styles.pickerBtnLabel, { color: T.subtext }]}>TIME</Text>
              <Text style={[styles.pickerBtnValue, { color: T.text }]}>
                {dateVal.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dateVal}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={dateVal}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        <Text style={[styles.sectionLabel, { color: T.subtext, marginTop: 24 }]}>CONSULTATION TOPIC</Text>
        <TextInput 
          value={topic} 
          onChangeText={setTopic} 
          placeholder="Brief topic or question (e.g. Seed investment advisory)" 
          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
          style={[styles.input, { backgroundColor: T.surface, borderColor: T.border, color: T.text }]} 
        />

        <Text style={[styles.sectionLabel, { color: T.subtext, marginTop: 20 }]}>ADDITIONAL CONTEXT (OPTIONAL)</Text>
        <TextInput 
          value={notes} 
          onChangeText={setNotes} 
          placeholder="Enter context, pitch slides link, or specific questions for the consultant..." 
          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
          style={[styles.input, { backgroundColor: T.surface, borderColor: T.border, color: T.text, height: 110, textAlignVertical: 'top' }]} 
          multiline 
        />

        <Text style={[styles.sectionLabel, { color: T.subtext, marginTop: 20 }]}>CONSULTATION SESSION FEE</Text>
        <View style={[styles.input, { backgroundColor: T.surface2, borderColor: T.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={{ color: T.subtext, fontSize: 14, fontWeight: '600' }}>Platform Booking Fee</Text>
          <Text style={{ color: T.text, fontSize: 16, fontWeight: '800' }}>${Number(fee || 0).toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.submitBtnWrapper} onPress={handleStartPayment} activeOpacity={0.95}>
          <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.button}>
            <Text style={styles.buttonText}>Pay & Request Consultation</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showGateway}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGateway(false)}
      >
        <View style={styles.modalOverlay}>
          <PaymentGateway
            amount={fee}
            title="Pay Consultant Securely"
            subtitle="Powered by Stripe"
            amountLabel="Consultation Fee"
            payButtonText="Pay Consultant"
            successTitle="Payment Completed!"
            successSub="Your consultation request has been submitted."
            processingText="Confirming Consultant Payment..."
            subProcessingText="Saving your consultation request"
            onProcessPayment={handleProcessPayment}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowGateway(false)}
          />
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  backBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12,
  },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.01 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  emptyContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  card: { 
    padding: 16, 
    borderRadius: 16, 
    marginTop: 10, 
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.01,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 3,
    position: 'relative',
    height: 48,
    justifyContent: 'center',
  },
  feeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  feeLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  checkedBadge: {
    position: 'absolute',
    bottom: -6,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  pickerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerTextWrap: {
    gap: 2,
  },
  pickerBtnLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pickerBtnValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: { 
    borderRadius: 14, 
    padding: 14, 
    marginTop: 10, 
    borderWidth: 1, 
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtnWrapper: {
    marginTop: 30,
    borderRadius: 14,
    overflow: 'hidden',
  },
  button: { 
    paddingVertical: 16, 
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
