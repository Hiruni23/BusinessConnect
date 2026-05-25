import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDocs, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

const formatMoney = (value) => {
  const amount = Number(value);
  if (!amount && amount !== 0) return "Not specified";
  return `$${amount.toLocaleString()}`;
};

const Tag = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const profileId = useMemo(() => {
    const value = Array.isArray(params.id) ? params.id[0] : params.id;
    return value || "";
  }, [params.id]);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const openChat = async () => {
    if (!currentUser || !profileId) return;

    try {
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("participants", "array-contains", currentUser.uid));
      const snapshot = await getDocs(q);

      let chatId = null;
      for (const chatDoc of snapshot.docs) {
        const data = chatDoc.data();
        if (Array.isArray(data.participants) && data.participants.includes(profileId)) {
          chatId = chatDoc.id;
          break;
        }
      }

      if (!chatId) {
        const createdChat = await addDoc(chatsRef, {
          participants: [currentUser.uid, profileId],
          entrepreneurId: currentUser.uid,
          investorId: profileId,
          updatedAt: serverTimestamp(),
          unreadBy: [],
          lastMessage: "",
          createdAt: serverTimestamp(),
        });
        chatId = createdChat.id;
      }

      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Failed to open chat:", error);
    }
  };

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", profileId),
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile({ id: snapshot.id, ...snapshot.data() });
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Profile listener failed:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profileId]);

  const displayName = profile?.fullName || profile?.name || profile?.businessName || "User";
  const role = String(profile?.role || "Investor").toUpperCase();
  const isOwnProfile = currentUser?.uid === profileId;
  const initials = displayName.charAt(0).toUpperCase();
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#EFF6FF', '#E0F2FE']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          {isOwnProfile ? (
            <TouchableOpacity onPress={() => router.push('/profile/edit')} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={20} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconBtnPlaceholder} />
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {!profile ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="person-circle-outline" size={32} color="#2563EB" />
              </View>
              <Text style={styles.emptyTitle}>Profile not found</Text>
              <Text style={styles.emptyText}>The selected user profile could not be loaded.</Text>
            </View>
          ) : (
            <>
              <LinearGradient colors={['#2563EB', '#1D4ED8', '#0F766E']} style={styles.heroCard}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                </View>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.meta}>{role} • {profile?.location || 'Global'}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{profile?.verified ? 'VERIFIED' : 'PROFILE'}</Text>
                  </View>
                  <View style={styles.badgeAlt}>
                    <Text style={styles.badgeAltText}>{profile?.investorType || profile?.company || 'BusinessConnect'}</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bodyText}>{profile?.bio || profile?.businessBio || 'No biography has been added yet.'}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.detailCard}>
                  <DetailRow label="Email" value={profile?.email || 'Not shared'} />
                  <DetailRow label="Phone" value={profile?.phone || 'Not shared'} />
                  <DetailRow label="Company" value={profile?.company || profile?.businessName || 'Not specified'} />
                  <DetailRow label="Focus" value={profile?.stageFocus || profile?.industry || profile?.category || 'General'} />
                  <DetailRow label="Max Investment" value={formatMoney(profile?.maxInvestment || profile?.budget)} />
                  <DetailRow label="Funding Goal" value={formatMoney(profile?.fundingGoal || profile?.targetFunding || profile?.requestedAmount)} />
                </View>
              </View>

              {interests.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Interests</Text>
                  <View style={styles.tagsRow}>
                    {interests.slice(0, 8).map((interest, index) => (
                      <Tag key={`${interest}-${index}`} label={interest} />
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actionRow}>
                {!isOwnProfile && (
                  <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={openChat}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#2563EB" />
                    <Text style={styles.secondaryBtnText}>Message</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn, isOwnProfile && { flex: 1 }]}
                  onPress={() => (isOwnProfile ? router.push('/profile/edit') : router.push('/entrepreneur/recommendations'))}
                >
                  <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.primaryGradient}>
                    <Ionicons name={isOwnProfile ? 'create-outline' : 'sparkles'} size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>{isOwnProfile ? 'Edit Profile' : 'More Matches'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  iconBtnPlaceholder: { width: 42, height: 42 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  avatarWrap: { marginBottom: 14 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: '900', color: '#fff' },
  name: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center' },
  meta: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  badgeAlt: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.16)' },
  badgeAltText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A', marginBottom: 10, letterSpacing: 0.4 },
  bodyText: { fontSize: 14, lineHeight: 22, color: '#334155' },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  detailValue: { fontSize: 13, color: '#0F172A', fontWeight: '800', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(37,99,235,0.1)' },
  tagText: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 22 },
  actionBtn: { flex: 1, borderRadius: 18, overflow: 'hidden' },
  primaryBtn: { flex: 1.2 },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  secondaryBtnText: { color: '#2563EB', fontSize: 14, fontWeight: '900' },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  emptyState: {
    marginTop: 48,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(37,99,235,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 20 },
});