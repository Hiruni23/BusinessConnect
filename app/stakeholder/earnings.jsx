import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../../firebaseConfig";
import { useTheme } from "../../context/ThemeContext";

export default function Earnings() {
  const router = useRouter();
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "consultations"),
      where("stakeholderId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setConsultations(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Earnings listener failed:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const totals = consultations.reduce(
      (accumulator, item) => {
        const amount = parseMoney(item.fee ?? item.amount ?? item.price ?? 0);
        const normalizedStatus = String(item.status || "").toLowerCase();
        const payoutStatus = String(item.paymentStatus || item.earningStatus || "").toLowerCase();

        if (normalizedStatus === "rejected") {
          accumulator.rejected += 1;
          return accumulator;
        }

        accumulator.gross += amount;

        if (payoutStatus === "paid" || normalizedStatus === "completed") {
          accumulator.completed += amount;
        } else {
          accumulator.pending += amount;
        }

        if (normalizedStatus === "accepted" || normalizedStatus === "completed") {
          accumulator.approvedCount += 1;
        }

        return accumulator;
      },
      { gross: 0, completed: 0, pending: 0, rejected: 0, approvedCount: 0 }
    );

    return {
      gross: totals.gross,
      completed: totals.completed,
      pending: totals.pending,
      rejected: totals.rejected,
      approvedCount: totals.approvedCount,
      average: totals.approvedCount > 0 ? totals.gross / totals.approvedCount : 0,
    };
  }, [consultations]);

  const recentItems = consultations.slice(0, 8);

  const handleWithdraw = () => {
    Alert.alert(
      "Withdraw Earnings",
      "Withdrawals are not wired yet. This screen now tracks your earnings from consultation records in Firestore."
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
        <LinearGradient colors={isDark ? ["#0F172A", "#1E293B"] : ["#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
      <LinearGradient colors={isDark ? ["#0F172A", "#1E293B"] : ["#F8FAFC", "#F1F5F9"]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={handleWithdraw}>
            <Ionicons name="cash-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Consultation Earnings</Text>
          <Text style={styles.subtitle}>Track income from accepted and completed consultation bookings.</Text>

          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>Total Earnings</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(stats.gross)}</Text>
              <Text style={styles.balanceHint}>{consultations.length} consultation record{consultations.length === 1 ? "" : "s"}</Text>
            </View>

            <View style={styles.iconCircle}>
              <Ionicons name="wallet-outline" size={30} color="#2563EB" />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <SummaryCard label="Paid" value={formatCurrency(stats.completed)} accent="#10B981" />
            <SummaryCard label="Pending" value={formatCurrency(stats.pending)} accent="#F59E0B" />
          </View>

          <View style={styles.summaryRow}>
            <SummaryCard label="Approved" value={`${stats.approvedCount}`} accent="#2563EB" />
            <SummaryCard label="Avg. Fee" value={formatCurrency(stats.average)} accent="#7C3AED" />
          </View>

          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw} activeOpacity={0.9}>
            <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.withdrawText}>Withdraw Earnings</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Recent Records</Text>

          {recentItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={42} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No earnings yet</Text>
              <Text style={styles.emptySub}>Accepted consultation requests will appear here with their fee totals.</Text>
            </View>
          ) : (
            recentItems.map((item) => {
              const amount = parseMoney(item.fee ?? item.amount ?? item.price ?? 0);
              const normalizedStatus = String(item.status || "").toLowerCase();
              const statusLabel = getEarningsStatusLabel(item);

              return (
                <View key={item.id} style={styles.transactionCard}>
                  <View style={styles.transactionTop}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.clientName} numberOfLines={1}>{item.name || item.entrepreneurName || item.topic || "Consultation"}</Text>
                      <Text style={styles.service} numberOfLines={2}>{item.idea || item.category || item.service || "Consultation booking"}</Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.amount}>{formatCurrency(amount)}</Text>
                      <View style={[styles.statusBadge, statusBadgeStyle(normalizedStatus, item.paymentStatus || item.earningStatus, isDark)]}>
                        <Text style={styles.statusText}>{statusLabel}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.transactionBottom}>
                    <Text style={styles.date}>
                      {item.date || item.scheduledDate || item.time || formatDate(item.updatedAt?.toDate ? item.updatedAt.toDate() : null)}
                    </Text>
                    <Text style={styles.metaText}>{item.category || item.duration || "Stakeholder consultation"}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={[styles.summaryAmount, { color: accent }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function parseMoney(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const numeric = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date) {
  if (!date) return "Recent";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function getEarningsStatusLabel(item) {
  const status = String(item.status || "").toLowerCase();
  const paymentStatus = String(item.paymentStatus || item.earningStatus || "").toLowerCase();

  if (paymentStatus === "paid" || status === "completed") return "PAID";
  if (status === "accepted") return "PENDING";
  if (status === "rejected") return "REJECTED";
  return String(item.status || "OPEN").toUpperCase();
}

function statusBadgeStyle(status, paymentStatus, isDark) {
  const normalizedStatus = String(status || "").toLowerCase();
  const normalizedPayment = String(paymentStatus || "").toLowerCase();

  if (normalizedStatus === "rejected") return { backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#FEE2E2" };
  if (normalizedPayment === "paid" || normalizedStatus === "completed") return { backgroundColor: isDark ? "rgba(16,185,129,0.15)" : "#DCFCE7" };
  return { backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7" };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F8FF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 15, color: "#6B7280", marginTop: 6, marginBottom: 20 },
  balanceCard: {
    backgroundColor: "#2563EB",
    borderRadius: 22,
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: { fontSize: 15, color: "#DBEAFE" },
  balanceAmount: { fontSize: 34, fontWeight: "800", color: "#FFFFFF", marginTop: 8 },
  balanceHint: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },
  withdrawButton: {
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  withdrawText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginTop: 28,
    marginBottom: 14,
  },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clientName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  service: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  amount: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2563EB",
  },
  transactionBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    alignItems: "center",
    gap: 10,
  },
  date: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: "flex-end",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8FF",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
});
