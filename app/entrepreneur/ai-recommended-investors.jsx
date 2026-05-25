import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import matchAlgorithm from '../../utils/matchAlgorithm';

const { width } = Dimensions.get('window');

export default function AIRecommendedInvestors() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const setupListeners = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const cUser = { id: user.uid, ...userDoc.data() };
          setUserData(cUser);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    setupListeners();

    const qInvestors = query(collection(db, "users"), where("role", "in", ["investor", "Investor"]));
    const unsubscribe = onSnapshot(qInvestors, (snap) => {
      try {
        const investorsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const cUser = {
          id: user.uid,
          email: user.email,
          role: userData?.role || "entrepreneur",
          ...(userData || {}),
        };
        
        const matches = matchAlgorithm(cUser, investorsList, "entrepreneur");
        setInvestors(matches);
        setLoading(false);
      } catch (error) {
        console.error("Error processing investors:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("AI recommended investors listener failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Smart Match</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero Section */}
          <LinearGradient
            colors={['#4F46E5', '#6366F1']}
            style={styles.heroSection}
          >
            <Ionicons name="sparkles" size={32} color="#FFF" style={styles.heroIcon} />
            <Text style={styles.heroTitle}>Intelligent Recommendations</Text>
            <Text style={styles.heroSubtitle}>
              Our AI analyzed your business profile and matched you with these high-intent investors.
            </Text>
          </LinearGradient>

          {loading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.investorList}>
              <Text style={styles.listTitle}>{investors.length} Optimal Matches Found</Text>
              
              {investors.map((investor, index) => (
                <TouchableOpacity 
                  key={investor.id} 
                  style={styles.investorCard}
                  onPress={() => router.push(`/profile/${investor.id}`)}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {(investor.fullName || investor.name || 'I').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.investorInfo}>
                      <Text style={styles.investorName}>{investor.fullName || investor.name || "Investor"}</Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color="#64748B" />
                        <Text style={styles.investorLocation}>{investor.location || investor.city || "Global"}</Text>
                      </View>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{Math.round(investor.score || investor.matchPercent || 0)}%</Text>
                      <Text style={styles.scoreLabel}>Match</Text>
                    </View>
                  </View>

                  <View style={styles.aiReasonBox}>
                    <View style={styles.aiBadge}>
                      <Ionicons name="sparkles" size={10} color="#10B981" />
                      <Text style={styles.aiBadgeText}>AI INSIGHT</Text>
                    </View>
                    <Text style={styles.matchReasonText}>{investor.matchReason}</Text>
                  </View>

                  <View style={styles.tagsContainer}>
                    {(investor.interests || []).slice(0, 3).map((interest, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{interest}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.cardFooter}>
                    <TouchableOpacity 
                      style={styles.profileBtn}
                      onPress={() => router.push(`/profile/${investor.id}`)}
                    >
                      <Text style={styles.profileBtnText}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.messageBtn}
                      onPress={() => router.push(`/chat/${investor.id}`)}
                    >
                      <LinearGradient
                        colors={['#4F46E5', '#6366F1']}
                        style={styles.messageGradient}
                      >
                        <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
                        <Text style={styles.messageBtnText}>Connect</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  scrollContent: { paddingBottom: 40 },
  heroSection: {
    margin: 20,
    padding: 25,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 }
  },
  heroIcon: { marginBottom: 15 },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  investorList: { paddingHorizontal: 20 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#64748B', marginBottom: 20 },
  investorCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#4F46E5' },
  investorInfo: { flex: 1, marginLeft: 15 },
  investorName: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  investorLocation: { fontSize: 13, color: '#64748B', marginLeft: 4 },
  scoreBadge: { alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  scoreText: { fontSize: 16, fontWeight: '900', color: '#10B981' },
  scoreLabel: { fontSize: 9, fontWeight: '700', color: '#10B981', textTransform: 'uppercase' },
  aiReasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 15,
    marginTop: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981'
  },
  aiBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  aiBadgeText: { fontSize: 10, fontWeight: '900', color: '#10B981', marginLeft: 4 },
  matchReasonText: { fontSize: 13, color: '#475569', fontWeight: '600', fontStyle: 'italic' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15, gap: 8 },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  cardFooter: { flexDirection: 'row', marginTop: 20, gap: 10 },
  profileBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  messageBtn: { flex: 1.5, height: 48, borderRadius: 14, overflow: 'hidden' },
  messageGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  messageBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' }
});
