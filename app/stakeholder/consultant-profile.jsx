import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export default function ConsultantProfile() {
  const router = useRouter();
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [consultations, setConsultations] = useState([]);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubUser = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
        setLoading(false);
      },
      (error) => {
        console.error("Consultant profile listener failed:", error);
        setLoading(false);
      }
    );

    const qConsultations = query(
      collection(db, "consultations"),
      where("stakeholderId", "==", user.uid)
    );

    const unsubConsultations = onSnapshot(
      qConsultations,
      (snapshot) => {
        setConsultations(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      },
      (error) => {
        console.error("Consultation stats listener failed:", error);
      }
    );

    return () => {
      unsubUser();
      unsubConsultations();
    };
  }, [user]);

  useEffect(() => {
    setImageFailed(false);
  }, [userData?.photoURL, userData?.avatarUrl, userData?.imageUrl]);

  const profile = useMemo(() => {
    const availability = userData?.availability || {};
    const name = userData?.fullName || user?.displayName || user?.email?.split("@")[0] || "Consultant";
    const roleLabel = userData?.consultantTitle || userData?.roleTitle || userData?.role || "Business Consultant";
    const bio = userData?.consultantBio || userData?.bio || userData?.about || "Experienced consultant supporting founders with strategy, funding, and market validation.";
    const consultationFee = userData?.consultationFee || availability?.fee || userData?.fee || 2500;
    const durationMinutes = Number(userData?.consultationDuration || availability?.duration || 45);
    const responseHours = Number(userData?.responseTimeHours || availability?.responseTimeHours || 24);
    const consultationMode = userData?.consultationMode || availability?.mode || "Video call";
    const specialties = normalizeList(
      userData?.specialties ||
      userData?.expertise ||
      userData?.skills ||
      ["Business Strategy", "Marketing", "Startup Funding", "Pitch Coaching"]
    );

    const acceptedOrCompleted = consultations.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      return status === "accepted" || status === "completed";
    });

    const completed = consultations.filter((item) => String(item.status || "").toLowerCase() === "completed");
    const successRate = consultations.length > 0 ? Math.round((acceptedOrCompleted.length / consultations.length) * 100) : 0;

    return {
      name,
      roleLabel,
      bio,
      consultationFee,
      specialties,
      photoURL: userData?.photoURL || userData?.avatarUrl || userData?.imageUrl || "",
      availabilityLabel: buildAvailabilityLabel(availability),
      durationLabel: `${durationMinutes} min session`,
      responseTimeLabel: responseHours === 1 ? "Replies within 1 hour" : `Replies within ${responseHours} hours`,
      consultationMode,
      sessions: consultations.length,
      completedSessions: completed.length,
      successRate,
      rating: Number(userData?.rating || userData?.consultantRating || 4.9),
      reviewCount: Number(userData?.reviewCount || userData?.ratingsCount || consultations.length * 3 || 0),
      location: userData?.location || userData?.city || "Sri Lanka",
    };
  }, [consultations, userData, user]);

  const handleBookConsultation = () => {
    Alert.alert(
      "Booking",
      "Open consultation booking flow from the entrepreneur side or wire this button to a scheduling screen if needed."
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consultant Profile</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={() => router.push("/stakeholder/earnings")} activeOpacity={0.85}>
            <Text style={styles.saveText}>Earnings</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHero}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/profile/edit')}>
                <LinearGradient colors={["#2563EB", "#1E40AF"]} style={styles.avatarGradient}>
                  {profile.photoURL && !imageFailed ? (
                    <Image
                      source={{ uri: profile.photoURL }}
                      style={styles.profileImage}
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <View style={styles.noImageWrap}>
                      <Ionicons name="person-circle-outline" size={48} color="#DBEAFE" />
                      <Text style={styles.noImageText}>No image</Text>
                    </View>
                  )}

                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={12} color="#fff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>{profile.roleLabel} • {profile.location}</Text>

            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color="#FBBF24" />
              <Text style={styles.rating}>{profile.rating.toFixed(1)} Rating</Text>
              <Text style={styles.reviewCount}>({profile.reviewCount} reviews)</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <StatCard value={`${profile.sessions}`} label="Sessions" />
            <StatCard value={`${profile.completedSessions}`} label="Completed" />
            <StatCard value={`${profile.successRate}%`} label="Success" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.description}>{profile.bio}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expertise</Text>
            <View style={styles.skillContainer}>
              {profile.specialties.map((item) => (
                <View key={item} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Consultation Details</Text>
              <TouchableOpacity style={styles.editDetailsBtn} onPress={() => router.push('/stakeholder/availability')} activeOpacity={0.85}>
                <Ionicons name="create-outline" size={14} color="#2563EB" />
                <Text style={styles.editDetailsText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <InfoRow icon="cash-outline" text={formatCurrency(profile.consultationFee)} />
            <InfoRow icon="timer-outline" text={profile.durationLabel} />
            <InfoRow icon="chatbubble-outline" text={profile.responseTimeLabel} />
            <InfoRow icon="pricetag-outline" text={profile.consultationMode} />
            <InfoRow icon="time-outline" text={profile.availabilityLabel} />
            <InfoRow icon="videocam-outline" text="Video consultation supported" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <ActionRow icon="chatbubble-ellipses-outline" label="Consultation Requests" onPress={() => router.push('/stakeholder/consultation-requests')} />
            <ActionRow icon="mail-outline" label="Messages" onPress={() => router.push('/stakeholder/messages')} />
            <ActionRow icon="time-outline" label="Availability" onPress={() => router.push('/stakeholder/availability')} />
            <ActionRow icon="wallet-outline" label="Earnings" onPress={() => router.push('/stakeholder/earnings')} />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleBookConsultation} activeOpacity={0.9}>
            <Text style={styles.buttonText}>Book Consultation</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatCard({ value, label }) {
  return (
    <View style={styles.statsCard}>
      <Text style={styles.statsNumber}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={22} color="#2563EB" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function ActionRow({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color="#2563EB" />
      </View>
      <Text style={styles.actionText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

function buildAvailabilityLabel(availability) {
  const active = Boolean(availability?.active);
  const day = availability?.selectedDay;
  const slot = availability?.selectedSlot;

  if (!active) return "Not available for bookings";
  if (day && slot) return `Available: ${day} • ${slot}`;
  if (day) return `Available: ${day}`;
  if (slot) return `Available: ${slot}`;
  return "Available for bookings";
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return ["Business Strategy", "Marketing", "Startup Funding", "Pitch Coaching"];
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F8FF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  backCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  saveBtn: { backgroundColor: "#4F46E5", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  saveText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  scrollContent: { paddingBottom: 60 },
  profileHero: { alignItems: "center", paddingVertical: 36, backgroundColor: "#FFF", borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  avatarContainer: { marginBottom: 16 },
  avatarGradient: { width: 108, height: 108, borderRadius: 54, justifyContent: "center", alignItems: "center", padding: 3 },
  profileImage: { width: 102, height: 102, borderRadius: 51, borderWidth: 3, borderColor: "#FFF" },
  noImageWrap: { width: 102, height: 102, borderRadius: 51, justifyContent: "center", alignItems: "center" },
  noImageText: { marginTop: 2, fontSize: 11, fontWeight: "700", color: "#DBEAFE" },
  avatarEditBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(37, 99, 235, 0.96)",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 24, fontWeight: "900", color: "#1E293B", textAlign: "center", marginTop: 2 },
  role: { fontSize: 14, color: "#4B5563", marginTop: 6, textAlign: "center" },
  ratingContainer: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, backgroundColor: "#EEF2FF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  rating: { color: "#1E293B", marginLeft: 4, fontWeight: "700" },
  reviewCount: { color: "#64748B", marginLeft: 2, fontSize: 12, fontWeight: "600" },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, marginTop: 18 },
  statsCard: { flex: 1, backgroundColor: "#FFFFFF", marginHorizontal: 5, borderRadius: 16, paddingVertical: 18, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  statsNumber: { fontSize: 24, fontWeight: "800", color: "#2563EB" },
  statsLabel: { fontSize: 13, color: "#6B7280", marginTop: 6 },
  card: { backgroundColor: "#FFFFFF", marginHorizontal: 20, marginTop: 18, borderRadius: 18, padding: 18, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 12 },
  editDetailsBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#EFF6FF" },
  editDetailsText: { color: "#2563EB", fontSize: 12, fontWeight: "800" },
  description: { fontSize: 15, lineHeight: 24, color: "#4B5563" },
  skillContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skillBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  skillText: { color: "#1D4ED8", fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  infoText: { marginLeft: 12, fontSize: 16, color: "#374151", flex: 1 },
  button: { backgroundColor: "#2563EB", marginHorizontal: 20, marginTop: 20, borderRadius: 18, paddingVertical: 16, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  actionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center", marginRight: 12 },
  actionText: { flex: 1, fontSize: 15, color: "#111827", fontWeight: "600" },
});
