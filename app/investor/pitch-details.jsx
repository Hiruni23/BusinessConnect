import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc, addDoc, setDoc, collection, serverTimestamp, increment } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function PitchDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = auth.currentUser;
  const [pitch, setPitch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investing, setInvesting] = useState(false);

  useEffect(() => {
    const recordView = async () => {
      if (!user || !id) return;

      try {
        // Passive analytics tracking
        await addDoc(collection(db, "pitchViews"), {
          pitchId: id,
          investorId: user.uid,
          investorName: user.displayName || "Interested Investor",
          viewedAt: serverTimestamp(),
          type: "view",
        });
        console.log("Analytics: View recorded for pitch ID:", id);
      } catch (error) {
        console.error("Error saving view record:", error);
      }
    };

    recordView();
  }, [id]);

  useEffect(() => {
    if (id) {
      const fetchPitch = async () => {
        try {
          const snap = await getDoc(doc(db, "pitches", id));
          if (snap.exists()) {
            setPitch({ id: snap.id, ...snap.data() });
          }
        } catch (error) {
          console.error("Fetch Error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPitch();
    }
  }, [id]);

  /* ================= CHAT LOGIC ================= */
  const startChat = async () => {
    // 1. Safety Checks
    if (!pitch || !auth.currentUser) {
      Alert.alert("Error", "You must be logged in to start a chat.");
      return;
    }

    // 2. Create the unique Chat ID
    const chatId = `${pitch.id}_${auth.currentUser.uid}`;

    try {
      // 3. INITIALIZE THE CHAT DOCUMENT
      // This is the "Handshake" that satisfies your Firestore Security Rules
      await setDoc(
        doc(db, "chats", chatId),
        {
          participants: [auth.currentUser.uid, pitch.entrepreneurId],
          pitchId: pitch.id,
          pitchTitle: pitch.title,
          lastMessage: "Conversation started...",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      ); // merge: true ensures we don't delete existing messages

      // 4. NAVIGATE TO THE CHAT SCREEN
      router.push({
        pathname: `/chat/${chatId}`,
        params: {
          title: pitch.title,
          receiverName: "Entrepreneur",
        },
      });
    } catch (error) {
      console.error("Chat Init Error:", error);
      Alert.alert("Permission Error", "Check if your Firestore Rules are published.");
    }
  };

  const handleUpdateStatus = async (status) => {
    const user = auth.currentUser;
    if (!user || !pitch?.entrepreneurId) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "pitches", id), {
        status: status,
        updatedAt: serverTimestamp(),
      });

      // Update local state so the Message button appears immediately
      setPitch((prev) => ({ ...prev, status: status }));

      await addDoc(collection(db, "notifications"), {
        userId: pitch.entrepreneurId,
        fromName: user.displayName || "An Investor",
        pitchTitle: pitch.title,
        type: status === "accepted" ? "ACCEPTANCE" : "REJECTION",
        message: `Your pitch "${pitch.title}" has been ${status}.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", `Pitch ${status}!`);
    } catch (error) {
      Alert.alert("Error", "Permission Denied. Check Firestore Rules.");
    } finally {
      setUpdating(false);
    }
  };

  const handleInvest = async (amount) => {
    if (!pitch) return;

    const investor = auth.currentUser;
    const numericAmount = Number(amount);

    if (!investor) {
      Alert.alert("Error", "You must be logged in to invest.");
      return;
    }

    if (numericAmount <= 0 || Number.isNaN(numericAmount)) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }

    try {
      setInvesting(true);

      // 1. Record the transaction
      await addDoc(collection(db, "transactions"), {
        pitchId: pitch.id,
        pitchTitle: pitch.title,
        investorId: investor.uid,
        investorName: investor.displayName || investor.email,
        entrepreneurId: pitch.entrepreneurId,
        amount: numericAmount,
        timestamp: serverTimestamp(),
        status: "completed",
      });

      // 2. Update the pitch with atomic increments
      const pitchRef = doc(db, "pitches", pitch.id);
      await updateDoc(pitchRef, {
        raisedAmount: increment(numericAmount),
        interested: increment(1),
      });

      // 3. Notify entrepreneur
      await addDoc(collection(db, "notifications"), {
        userId: pitch.entrepreneurId,
        title: "New Funding Received!",
        body: `${investor.email} invested $${numericAmount} in ${pitch.title}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      setPitch((prev) => ({
        ...prev,
        raisedAmount: Number(prev?.raisedAmount || 0) + numericAmount,
        interested: Number(prev?.interested || 0) + 1,
      }));
      setInvestmentAmount("");
      setShowInvestModal(false);
      Alert.alert("Success!", `You have successfully invested $${numericAmount}`);
    } catch (error) {
      console.error("Funding Error:", error);
      Alert.alert("Error", "Failed to process your investment. Please try again.");
    } finally {
      setInvesting(false);
    }
  };

  const raisedAmount = Number(pitch?.raisedAmount || 0);
  const fundingGoal = Number(pitch?.fundingGoal || 0);
  const progressPercent = fundingGoal > 0 ? Math.min((raisedAmount / fundingGoal) * 100, 100) : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Pitch</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.mainCard}>
          <View style={styles.topRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{pitch?.category || "General"}</Text>
            </View>
            <Text
              style={[
                styles.statusText,
                pitch?.status === "accepted" && { color: "#10B981" },
                pitch?.status === "rejected" && { color: "#EF4444" },
              ]}
            >
              {pitch?.status?.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.pitchTitle}>{pitch?.title}</Text>

          <View style={styles.fundingSection}>
            <Text style={styles.label}>REQUESTED FUNDING</Text>
            <Text style={styles.fundingAmount}>${pitch?.fundingGoal?.toLocaleString()}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>BUSINESS OVERVIEW</Text>
          <Text style={styles.description}>{pitch?.description}</Text>

          <TouchableOpacity
            style={[styles.pdfButton, !pitch?.pitchDeckUrl && styles.pdfDisabled]}
            onPress={() => pitch?.pitchDeckUrl && Linking.openURL(pitch.pitchDeckUrl)}
          >
            <Ionicons
              name="document-attach-outline"
              size={22}
              color={pitch?.pitchDeckUrl ? "#4F46E5" : "#94A3B8"}
            />
            <Text style={[styles.pdfButtonText, !pitch?.pitchDeckUrl && { color: "#94A3B8" }]}>
              {pitch?.pitchDeckUrl ? "View Full Pitch Deck (PDF)" : "No PDF Provided"}
            </Text>
          </TouchableOpacity>

          {/* MESSAGE BUTTON - Appears only after Acceptance */}
          {pitch?.status === "accepted" && (
            <TouchableOpacity style={styles.messageBtn} onPress={startChat}>
              <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
              <Text style={styles.messageBtnText}>Message Entrepreneur</Text>
            </TouchableOpacity>
          )}

          <View style={styles.fundingContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.raisedText}>${raisedAmount.toLocaleString()} raised</Text>
              <Text style={styles.goalText}>of ${fundingGoal.toLocaleString()} goal</Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>

            <TouchableOpacity style={styles.investBtn} onPress={() => setShowInvestModal(true)}>
              <Text style={styles.investBtnText}>Invest in this Project</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCEPT / REJECT BUTTONS */}
        {pitch?.status === "Open" && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleUpdateStatus("accepted")}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Accept</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleUpdateStatus("rejected")}
              disabled={updating}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showInvestModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInvestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invest in {pitch?.title}</Text>
            <Text style={styles.modalSubtitle}>Enter the amount you want to fund</Text>

            <TextInput
              style={styles.amountInput}
              placeholder="e.g. 500"
              keyboardType="numeric"
              value={investmentAmount}
              onChangeText={setInvestmentAmount}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  if (investing) return;
                  setShowInvestModal(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn, investing && styles.modalBtnDisabled]}
                onPress={() => handleInvest(investmentAmount)}
                disabled={investing}
              >
                {investing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Investment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  scrollContainer: { padding: 20 },
  mainCard: { backgroundColor: "#FFFFFF", borderRadius: 32, padding: 24, elevation: 4 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  categoryBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  categoryText: { color: "#4F46E5", fontWeight: "700", fontSize: 12 },
  statusText: { fontSize: 11, fontWeight: "900", color: "#64748B" },
  pitchTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A", marginBottom: 25 },
  label: { fontSize: 12, fontWeight: "700", color: "#94A3B8", letterSpacing: 1, marginBottom: 8 },
  fundingSection: { marginBottom: 20 },
  fundingAmount: { fontSize: 28, fontWeight: "800", color: "#1E293B" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 20 },
  description: { fontSize: 16, color: "#475569", lineHeight: 24, marginBottom: 30 },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    padding: 18,
    borderRadius: 20,
    gap: 10,
    marginBottom: 15,
  },
  pdfDisabled: { opacity: 0.6 },
  pdfButtonText: { color: "#4F46E5", fontWeight: "700", fontSize: 15 },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#047857",
    padding: 18,
    borderRadius: 20,
    gap: 10,
    marginTop: 10,
  },
  messageBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  fundingContainer: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  raisedText: { color: "#0F172A", fontSize: 15, fontWeight: "800" },
  goalText: { color: "#475569", fontSize: 13, fontWeight: "600" },
  progressBarBg: {
    width: "100%",
    height: 10,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#16A34A",
  },
  investBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  investBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  buttonContainer: { flexDirection: "row", gap: 15, marginTop: 25 },
  actionBtn: {
    flex: 1,
    height: 64,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  acceptBtn: { backgroundColor: "#10B981" },
  rejectBtn: { backgroundColor: "#EF4444" },
  btnText: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 14,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  confirmBtn: {
    backgroundColor: "#4F46E5",
  },
  modalBtnDisabled: {
    opacity: 0.7,
  },
  cancelBtnText: { color: "#334155", fontWeight: "700", fontSize: 14 },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});