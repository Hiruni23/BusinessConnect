import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import matchAlgorithm, { calculateMatchScore } from '../../utils/matchAlgorithm';
import { getCurrentUserProfile } from '../../services/recommendationService';

const getMatchTone = (score) => {
  if (score >= 80) {
    return {
      container: '#ECFDF5',
      text: '#059669',
      border: 'rgba(16, 185, 129, 0.25)',
      icon: 'checkmark-circle',
      label: 'High',
    };
  }

  if (score >= 50) {
    return {
      container: '#FFF7ED',
      text: '#EA580C',
      border: 'rgba(249, 115, 22, 0.25)',
      icon: 'time',
      label: 'Medium',
    };
  }

  return {
    container: '#FEF2F2',
    text: '#DC2626',
    border: 'rgba(239, 68, 68, 0.25)',
    icon: 'alert-circle',
    label: 'Low',
  };
};

const getModeText = (mode) => {
  if (mode === 'investor') {
    return {
      heroTitle: 'Recommended Businesses',
      heroSubtitle: 'Startups matching your interests',
      heroHelper: 'Review promising ventures, compare risk levels, and open the most relevant pitches first.',
      sectionTitle: 'Recommended Businesses',
      sectionSubtitle: 'Based on your interests and activity',
      emptyTitle: 'No businesses matched yet',
      emptyText: 'New startup opportunities will appear here as soon as they align with your investor profile.',
      badge: 'Investor View',
      buttonLabel: 'View Pitch',
      matchLabel: 'Funding Match',
    };
  }

  return {
    heroTitle: 'Recommended Investors',
    heroSubtitle: 'Investors interested in your business',
    heroHelper: 'Find the best-fit backers by focus, budget range, and location before you reach out.',
    sectionTitle: 'Recommended Investors',
    sectionSubtitle: 'Based on your interests and activity',
    emptyTitle: 'No investors matched yet',
    emptyText: 'Investor recommendations will appear once your pitch and profile have enough activity data.',
    badge: 'Entrepreneur View',
    buttonLabel: 'Connect',
    matchLabel: 'Investor Match',
  };
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!amount && amount !== 0) return 'N/A';
  return `$${amount.toLocaleString()}`;
};

const getRiskLevel = (score) => {
  if (score >= 80) return { label: 'Low', color: '#10B981', bg: '#ECFDF5' };
  if (score >= 50) return { label: 'Medium', color: '#F97316', bg: '#FFF7ED' };
  return { label: 'High', color: '#EF4444', bg: '#FEF2F2' };
};

const getBudgetRange = (item) => {
  const minBudget = Number(item?.minInvestment || item?.minBudget || item?.budgetMin || 0);
  const maxBudget = Number(item?.maxInvestment || item?.budget || item?.budgetMax || 0);

  if (minBudget && maxBudget) {
    return `${formatCurrency(minBudget)} - ${formatCurrency(maxBudget)}`;
  }

  if (maxBudget) {
    return `Up to ${formatCurrency(maxBudget)}`;
  }

  if (minBudget) {
    return `From ${formatCurrency(minBudget)}`;
  }

  return 'Flexible budget';
};

export default function RoleRecommendationsScreen({ mode = 'investor' }) {
  const router = useRouter();
  const copy = useMemo(() => getModeText(mode), [mode]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const sendConnection = async (investor) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'connections'), {
        fromUserId: currentUser.uid,
        toUserId: investor.id,
        status: 'pending',
        createdAt: new Date()
      });
      Alert.alert('Success', 'Connection request sent successfully!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send connection request.');
    }
  };

  const investNow = async (business) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'investments'), {
        investorId: currentUser.uid,
        businessId: business.id,
        amount: 1000,
        status: 'pending',
        createdAt: new Date()
      });
      Alert.alert('Success', 'Investment initiated successfully!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to initiate investment.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUserData(null);
      setRecommendations([]);
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const profile = await getCurrentUserProfile(currentUser.uid);
        setUserData(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setLoading(false);
      }
    };

    loadUser();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !userData) return;

    let unsubscribe;

    if (mode === 'investor') {
      // For investors: subscribe to pitches collection
      const q = query(
        collection(db, 'pitches'),
        where('status', 'in', ['Open', 'pending', 'approved', 'accepted', 'active', 'funded'])
      );
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          const prefs = {
            interests: userData?.interests || [],
            maxInvestment: Number(userData?.maxInvestment) || Number.MAX_SAFE_INTEGER,
          };
          const ranked = list
            .map((pitch) => {
              const match = calculateMatchScore(pitch, prefs);
              return {
                ...pitch,
                score: match.score,
                matchPercent: match.score,
                matchReason: match.matchReason,
              };
            })
            .sort((a, b) => b.score - a.score);
          setRecommendations(ranked);
          setLoading(false);
        },
        (error) => {
          console.error('Pitches subscription failed:', error);
          setLoading(false);
        }
      );
    } else {
      // For entrepreneurs: subscribe to target users (investors)
      const q = query(collection(db, 'users'), where('role', 'in', ['investor', 'Investor']));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          const ranked = matchAlgorithm(userData, list);
          setRecommendations(ranked);
          setLoading(false);
        },
        (error) => {
          console.error('Investors subscription failed:', error);
          setLoading(false);
        }
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, userData, mode]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((item) => {
      const score = item.score || 0;
      if (selectedFilter === 'high') return score >= 80;
      if (selectedFilter === 'medium') return score >= 50 && score < 80;
      if (selectedFilter === 'low') return score < 50;
      return true;
    });
  }, [recommendations, selectedFilter]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#EFF6FF', '#E0F2FE']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BusinessConnect</Text>
          <View style={styles.iconBtnPlaceholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <LinearGradient colors={mode === 'investor' ? ['#1D4ED8', '#2563EB', '#3B82F6'] : ['#0F766E', '#0EA5E9', '#2563EB']} style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconCircle}>
                <Ionicons name={mode === 'investor' ? 'business-outline' : 'people-outline'} size={18} color="#FFFFFF" />
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{copy.badge}</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
            <Text style={styles.heroHelper}>{copy.heroHelper}</Text>

            <View style={styles.legendRow}>
              <LegendPill label="80%+" tone="high" active={selectedFilter === 'high'} onPress={() => setSelectedFilter(selectedFilter === 'high' ? 'all' : 'high')} />
              <LegendPill label="50-79%" tone="medium" active={selectedFilter === 'medium'} onPress={() => setSelectedFilter(selectedFilter === 'medium' ? 'all' : 'medium')} />
              <LegendPill label="Under 50%" tone="low" active={selectedFilter === 'low'} onPress={() => setSelectedFilter(selectedFilter === 'low' ? 'all' : 'low')} />
            </View>
          </LinearGradient>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{copy.sectionTitle}</Text>
            <Text style={styles.sectionCount}>
              {filteredRecommendations.length} {filteredRecommendations.length === 1 ? 'match' : 'matches'}
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>{copy.sectionSubtitle}</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 32 }} />
          ) : filteredRecommendations.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="scan-outline" size={28} color="#2563EB" />
              </View>
              <Text style={styles.emptyTitle}>No matching records found</Text>
              <Text style={styles.emptyText}>Try selecting a different match score filter above or updating your profile interests.</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {filteredRecommendations.map((item) => {
                const tone = getMatchTone(item.score || 0);
                const isInvestorMode = mode === 'investor';
                const title = isInvestorMode ? (item.businessName || item.title || item.name || 'Startup') : (item.name || item.fullName || 'Investor');
                const subtitle = isInvestorMode ? (item.category || item.industry || 'Startup') : (item.interests?.[0] || item.category || item.industry || 'Investment Focus');
                const imageUri = item.photoURL || item.profileImage || item.avatar || item.image || item.logo;
                const description = isInvestorMode
                  ? (item.description || item.summary || 'Startup opportunity with strong growth potential.')
                  : (item.bio || item.description || 'Investor profile aligned with your venture.');
                const industryText = isInvestorMode ? subtitle : `Focus: ${subtitle}`;
                const riskLevel = getRiskLevel(item.score || 0);
                const budgetText = isInvestorMode ? formatCurrency(item.fundingGoal || item.targetFunding || item.requestedAmount) : getBudgetRange(item);
                const locationText = item.location || 'Global';
                const verified = Boolean(item.verified || item.isVerified);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    activeOpacity={0.9}
                    onPress={() => (isInvestorMode ? router.push({ pathname: '/investor/pitch-details', params: { id: item.id } }) : router.push(`/chat/${item.id}`))}
                  >
                    <View style={styles.cardTopRow}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.avatar} />
                      ) : (
                        <AvatarFallback name={title} role={item.role} />
                      )}

                      <View style={styles.cardInfo}>
                        <View style={styles.titleRow}>
                          <Text style={styles.cardName} numberOfLines={1}>{title}</Text>
                          {verified && (
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="shield-checkmark" size={12} color="#2563EB" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.cardRole}>{isInvestorMode ? 'Startup' : 'Investor'}</Text>
                        <View style={styles.metaRow}>
                          <Ionicons name={isInvestorMode ? 'pricetag-outline' : 'briefcase-outline'} size={12} color="#64748B" />
                          <Text style={styles.metaText} numberOfLines={1}>{industryText}</Text>
                        </View>
                        <View style={styles.metaRow}>
                          <Ionicons name="location-outline" size={12} color="#64748B" />
                          <Text style={styles.metaText} numberOfLines={1}>{locationText}</Text>
                        </View>
                      </View>

                      <View style={[styles.matchPill, { backgroundColor: tone.container, borderColor: tone.border }]}>
                        <Ionicons name={tone.icon} size={14} color={tone.text} />
                        <Text style={[styles.matchPillText, { color: tone.text }]}>{Math.round(item.score || 0)}%</Text>
                      </View>
                    </View>

                    <View style={styles.matchReasonBox}>
                      <Ionicons name="sparkles" size={12} color="#2563EB" />
                      <Text style={styles.matchReasonText}>{item.matchReason}</Text>
                    </View>

                    <Text style={styles.descriptionText} numberOfLines={3}>{description}</Text>

                    <View style={styles.detailGrid}>
                      <DetailPill label={isInvestorMode ? 'Funding Needed' : 'Budget Range'} value={budgetText} />
                      <DetailPill label={isInvestorMode ? 'Risk Level' : 'Location'} value={isInvestorMode ? riskLevel.label : locationText} tone={isInvestorMode ? riskLevel : null} />
                    </View>

                    <AnimatedMatchBar score={Math.round(item.score || 0)} />

                    <View style={styles.tagRow}>
                      {(item.interests || [item.category, item.industry].filter(Boolean)).slice(0, 3).map((tag) => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity style={styles.viewButton} onPress={() => (isInvestorMode ? investNow(item) : sendConnection(item))}>
                      <LinearGradient colors={isInvestorMode ? ['#2563EB', '#1D4ED8'] : ['#0EA5E9', '#2563EB']} style={styles.viewButtonGradient}>
                        <Text style={styles.viewButtonText}>{isInvestorMode ? 'Invest' : 'Connect'}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const LegendPill = ({ label, tone, active, onPress }) => {
  const colors = {
    high: { bg: 'rgba(16, 185, 129, 0.18)', text: '#D1FAE5', border: 'rgba(110, 231, 183, 0.35)', activeBg: '#10B981' },
    medium: { bg: 'rgba(249, 115, 22, 0.18)', text: '#FFEDD5', border: 'rgba(253, 186, 116, 0.35)', activeBg: '#F97316' },
    low: { bg: 'rgba(239, 68, 68, 0.18)', text: '#FEE2E2', border: 'rgba(252, 165, 165, 0.35)', activeBg: '#EF4444' },
  };

  return (
    <TouchableOpacity 
      style={[
        styles.legendPill, 
        { 
          backgroundColor: active ? colors[tone].activeBg : colors[tone].bg, 
          borderColor: colors[tone].border 
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.legendText, { color: active ? '#FFFFFF' : colors[tone].text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const DetailPill = ({ label, value, tone }) => (
  <View style={[styles.detailPill, tone ? { backgroundColor: tone.bg, borderColor: 'rgba(0,0,0,0.05)' } : null]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, tone ? { color: tone.color } : null]} numberOfLines={1}>{value}</Text>
  </View>
);

const AnimatedMatchBar = ({ score = 0 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const tone = getMatchTone(score);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const widthInterpolate = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.matchBarContainer}>
      <View style={styles.matchBarBg}>
        <Animated.View
          style={[
            styles.matchBarFill,
            { width: widthInterpolate, backgroundColor: tone.text },
          ]}
        />
      </View>
      <Text style={[styles.matchBarLabel, { color: tone.text }]}>{Math.round(score)}%</Text>
    </View>
  );
};

const AvatarFallback = ({ name, role }) => {
  const isInvestor = String(role || '').toLowerCase() === 'investor';
  const colors = isInvestor ? ['#DBEAFE', '#BFDBFE'] : ['#D1D5DB', '#E5E7EB'];
  const textColor = isInvestor ? '#1D4ED8' : '#4B5563';

  return (
    <LinearGradient colors={colors} style={styles.avatarFallback} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={[styles.avatarFallbackText, { color: textColor }]}>{name.charAt(0).toUpperCase()}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBtnPlaceholder: { width: 40, height: 40 },
  scrollContent: { paddingBottom: 40 },
  heroCard: {
    marginHorizontal: 20,
    marginTop: 18,
    padding: 22,
    borderRadius: 30,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { marginTop: 18, color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  heroSubtitle: { marginTop: 6, color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  heroHelper: { marginTop: 12, color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 19 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  legendPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  legendText: { fontSize: 11, fontWeight: '800' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
  },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  sectionCount: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  sectionSubtitle: { paddingHorizontal: 20, marginTop: 4, color: '#64748B', fontSize: 13 },
  cardList: { paddingHorizontal: 20, marginTop: 18, gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#DBEAFE' },
  avatarFallback: { width: 58, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { fontSize: 22, fontWeight: '900', color: '#1D4ED8' },
  cardInfo: { flex: 1, marginLeft: 14, paddingRight: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 18, fontWeight: '900', color: '#0F172A', flex: 1 },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRole: { marginTop: 3, fontSize: 12, fontWeight: '800', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { marginLeft: 4, fontSize: 12, color: '#64748B', fontWeight: '600', flex: 1 },
  matchPill: {
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchPillText: { marginTop: 2, fontSize: 14, fontWeight: '900' },
  matchReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  matchReasonText: { flex: 1, color: '#475569', fontSize: 13, fontStyle: 'italic', fontWeight: '600' },
  descriptionText: { marginTop: 12, color: '#475569', fontSize: 13, lineHeight: 19 },
  detailGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  detailPill: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailLabel: { color: '#64748B', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { marginTop: 4, color: '#0F172A', fontSize: 13, fontWeight: '800' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tag: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '800', color: '#1D4ED8' },
  viewButton: { marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  viewButtonGradient: { minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  viewButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  emptyText: { marginTop: 8, textAlign: 'center', color: '#64748B', fontSize: 13, lineHeight: 19 },
  matchBarContainer: { marginTop: 14, gap: 8 },
  matchBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  matchBarFill: { height: '100%', borderRadius: 4 },
  matchBarLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});
