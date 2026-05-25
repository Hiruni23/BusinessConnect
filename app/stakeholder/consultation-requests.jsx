// stakeholder/consultation-requests.jsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useTheme } from '../../context/ThemeContext';

export default function ConsultationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const user = auth.currentUser;
  const { theme: T } = useTheme();

  useEffect(() => {
    // Load pending consultation requests (for simplicity: all pending)
    const q = query(collection(db, 'consultations'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(list);
      setLoading(false);
    }, (err) => {
      console.error('Consultations listener error', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateStatus = async (id, status) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const req = requests.find(r => r.id === id) || {};

      // Prevent accepting if payment not completed
      if (String(status).toLowerCase() === 'accepted' && String(req.paymentStatus || 'unpaid').toLowerCase() !== 'paid') {
        Alert.alert('Payment required', 'You can only accept consultations after payment.');
        setIsProcessing(false);
        return;
      }

      await updateDoc(doc(db, 'consultations', id), {
        status,
        stakeholderId: user?.uid || null,
        updatedAt: serverTimestamp()
      });

      // Create a notification for the entrepreneur
      if (req?.entrepreneurId) {
        await addDoc(collection(db, 'notifications'), {
          userId: req.entrepreneurId,
          title: `Consultation ${status}`,
          message: `Your consultation request for "${req.idea || 'consultation'}" was ${status.toLowerCase()} by a stakeholder.`,
          type: 'CONSULTATION_UPDATE',
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }

      // If stakeholder accepted, create a meeting record linked to this consultation
      if (String(status).toLowerCase() === 'accepted') {
        try {
          await setDoc(doc(db, 'meetings', id), {
            id,
            consultationId: id,
            meetingId: id,
            stakeholderId: user?.uid || null,
            entrepreneurId: req.entrepreneurId || null,
            title: req.topic || req.idea || 'Consultation',
            scheduledAt: req.scheduledAt || null,
            fee: Number(req.fee || 0),
            feeCurrency: 'USD',
            status: 'scheduled',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (meetingErr) {
          console.error('Failed to create meeting for consultation', meetingErr);
        }
      }

      Alert.alert('Success', `Request ${status}`);
    } catch (error) {
      console.error('Update consultation status error', error);
      Alert.alert('Error', 'Failed to update request status.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmation modal state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const openConfirm = (action, item) => {
    setSelectedRequest(item);
    setConfirmAction(action);
    setConfirmVisible(true);
  };

  const handleConfirm = async () => {
    setConfirmVisible(false);
    if (!selectedRequest || !confirmAction) return;
    await updateStatus(selectedRequest.id, confirmAction);
    setSelectedRequest(null);
    setConfirmAction(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: T.bg }]} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={[styles.title, { color: T.text }]}>Consultation Requests</Text>
      <Text style={[styles.subtitle, { color: T.subtext }]}>Accept or reject entrepreneur consultation bookings.</Text>

      {requests.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: T.subtext }]}>No consultation requests yet.</Text>
        </View>
      )}

      {requests.map((item) => {
        const sched = item?.scheduledAt && typeof item.scheduledAt.toDate === 'function'
          ? item.scheduledAt.toDate()
          : (item?.scheduledAt ? new Date(item.scheduledAt) : null);
        const dateText = sched ? sched.toLocaleDateString() : (item.date || '.');
        const timeText = sched ? sched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (item.time || '.');
        const paymentStatus = String(item.paymentStatus || 'unpaid').toLowerCase();
        const paymentBadgeStyle = paymentStatus === 'paid' ? styles.paidBadge : styles.unpaidBadge;
        const paymentLabel = paymentStatus === 'paid' ? 'PAID VIA STRIPE' : 'UNPAID';

        return (
          <View key={item.id} style={[styles.card, { backgroundColor: T.card || '#fff' }]}> 
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name || item.entrepreneurName || 'Entrepreneur'}</Text>
                <Text style={styles.idea}>{item.idea || item.topic}</Text>
                {(item.notes || item.description || item.message) && (
                  <Text style={styles.description} numberOfLines={2}>{item.notes || item.description || item.message}</Text>
                )}
              </View>

              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={[styles.paymentBadge, paymentBadgeStyle]}>
                  <Ionicons name={paymentStatus === 'paid' ? 'card' : 'alert-circle'} size={12} color={paymentStatus === 'paid' ? '#047857' : '#B45309'} />
                  <Text style={[styles.paymentText, paymentStatus === 'paid' ? styles.paymentPaidText : styles.paymentUnpaidText]}>{paymentLabel}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'accepted' ? styles.accepted : item.status === 'rejected' ? styles.rejected : styles.pending]}>
                  <Text style={styles.statusText}>{String(item.status || '').toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}><Ionicons name="calendar-outline" size={18} color="#2563eb" /><Text style={styles.metaText}>{dateText}</Text></View>
              <View style={styles.metaItem}><Ionicons name="time-outline" size={18} color="#2563eb" /><Text style={styles.metaText}>{timeText}</Text></View>
              <View style={styles.metaItem}><Ionicons name="card-outline" size={18} color="#2563eb" /><Text style={styles.metaText}>{`$${Number(item.fee || 0).toFixed(2)}`}</Text></View>
            </View>

            {item.status === 'pending' && (() => {
              const canAccept = paymentStatus === 'paid';
              return (
                <View style={styles.buttonRow}>
                  {canAccept ? (
                    <TouchableOpacity style={styles.acceptButton} onPress={() => openConfirm('accepted', item)} disabled={isProcessing}>
                      <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity style={[styles.acceptButton, { backgroundColor: '#9CA3AF', opacity: 0.9 }]} disabled>
                        <Text style={styles.buttonText}>Accept</Text>
                      </TouchableOpacity>
                      <Text style={{ marginTop: 8, color: '#6B7280', fontSize: 13 }}>Payment required to accept this consultation.</Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.rejectButton} onPress={() => openConfirm('rejected', item)} disabled={isProcessing}>
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        );
      })}

        {/* Confirmation Modal */}
        <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: T.card || '#fff' }]}> 
              <Text style={styles.modalTitle}>{confirmAction === 'accepted' ? 'Confirm Acceptance' : 'Confirm Rejection'}</Text>
              <Text style={styles.modalBody}>{confirmAction === 'accepted' ? 'Accepting will schedule a meeting and notify the entrepreneur.' : 'Rejecting will notify the entrepreneur.'}</Text>
              <View style={styles.modalActions}>
                <Pressable style={styles.modalBtn} onPress={() => setConfirmVisible(false)}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.modalBtn, styles.modalConfirmBtn, isProcessing && { opacity: 0.75 }]} onPress={handleConfirm} disabled={isProcessing}>
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>{confirmAction === 'accepted' ? 'Confirm Accept' : 'Confirm Reject'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FF",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  idea: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paidBadge: {
    backgroundColor: '#ECFDF5',
  },
  unpaidBadge: {
    backgroundColor: '#FFFBEB',
  },
  paymentText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  paymentPaidText: {
    color: '#047857',
  },
  paymentUnpaidText: {
    color: '#B45309',
  },
  pending: {
    backgroundColor: "#FEF3C7",
  },
  accepted: {
    backgroundColor: "#DCFCE7",
  },
  rejected: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#374151",
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 18,
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    alignItems: 'center'
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { marginLeft: 8, color: '#374151', fontSize: 14 },
  emptyContainer: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '86%', borderRadius: 12, padding: 18, elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalBody: { marginTop: 8, color: '#6B7280' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18, gap: 12 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F3F4F6' },
  modalBtnText: { color: '#111827', fontWeight: '700' },
  modalConfirmBtn: { backgroundColor: '#2563EB' },
});