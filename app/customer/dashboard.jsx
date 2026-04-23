import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: "1", name: "All", icon: "apps-outline", color: "#6366F1" },
  { id: "2", name: "Tech", icon: "terminal-outline", color: "#0EA5E9" },
  { id: "3", name: "Bio", icon: "fitness-outline", color: "#10B981" },
  { id: "4", name: "Green", icon: "leaf-outline", color: "#84CC16" },
  { id: "5", name: "Fin", icon: "wallet-outline", color: "#F59E0B" },
];

const CURRENCIES = {
  USD: { symbol: "$", rate: 1 },
  EUR: { symbol: "€", rate: 0.92 },
  GBP: { symbol: "£", rate: 0.78 },
};

export default function CustomerDashboard() {
  const router = useRouter();
  const user = auth.currentUser;
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currency, setCurrency] = useState("USD");

  const formatPrice = (amount) => {
    const { symbol, rate } = CURRENCIES[currency];
    return `${symbol}${(amount * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  useEffect(() => {
    const q = query(
      collection(db, "pitches"),
      where("status", "==", "Open"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPitches(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pitches:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPitches = pitches.filter(p => 
    (selectedCategory === "All" || p.category === selectedCategory) &&
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const username = user?.displayName || (user?.email ? user.email.split("@")[0] : "Innovator");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background Decor */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greetingText}>Hello, {user?.displayName?.split(' ')[0] || "Innovator"}</Text>
              <Text style={styles.subGreeting}>Global Innovation Marketplace</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.currencyToggle}>
                {Object.keys(CURRENCIES).map(c => (
                  <TouchableOpacity 
                    key={c} 
                    onPress={() => setCurrency(c)}
                    style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                  >
                    <Text style={[styles.currencyBtnText, currency === c && styles.currencyBtnTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.avatarContainer}>
                <LinearGradient colors={['#6366F1', '#A855F7']} style={styles.avatarRing}>
                  <Image source={{ uri: "https://i.pravatar.cc/100?u=customer" }} style={styles.avatar} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* SEARCH & FILTER */}
          <View style={styles.searchWrapper}>
            <BlurView intensity={40} tint="light" style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#64748B" />
              <TextInput 
                placeholder="Search breakthroughs..." 
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View style={styles.divider} />
              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options-outline" size={20} color="#6366F1" />
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* FEATURED / HERO SECTION */}
          <View style={styles.featuredContainer}>
            <TouchableOpacity activeOpacity={0.9}>
              <LinearGradient 
                colors={['#1E293B', '#0F172A']} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}} 
                style={styles.heroCard}
              >
                <View style={styles.heroContent}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>TRENDING</Text>
                  </View>
                  <Text style={styles.heroTitle}>Quantum Computing for Everyone</Text>
                  <Text style={styles.heroDescription}>Join the next revolution in decentralized processing power.</Text>
                  
                  <View style={styles.heroFooter}>
                    <View style={styles.heroStats}>
                      <Text style={styles.statValue}>85%</Text>
                      <Text style={styles.statLabel}>Funded</Text>
                    </View>
                    <TouchableOpacity style={styles.investBtn}>
                      <Text style={styles.investBtnText}>Support Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Image 
                  source={{ uri: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400" }} 
                  style={styles.heroImage} 
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* AI RECOMMENDATIONS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.aiHeaderTitle}>
                <Ionicons name="sparkles" size={20} color="#6366F1" />
                <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Personalized for You</Text>
              </View>
              <TouchableOpacity><Text style={styles.seeAll}>Magic Refresh</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationList}>
              {pitches.slice(0, 3).map((item) => (
                <RecommendationCard key={item.id} item={item} router={router} formatPrice={formatPrice} />
              ))}
            </ScrollView>
          </View>

          {/* CATEGORIES SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[
                    styles.categoryCard,
                    selectedCategory === cat.name && { backgroundColor: cat.color }
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <View style={[styles.catIconCircle, selectedCategory === cat.name && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name={cat.icon} size={22} color={selectedCategory === cat.name ? "#FFF" : cat.color} />
                  </View>
                  <Text style={[styles.categoryName, selectedCategory === cat.name && { color: '#FFF' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* FLASH FUNDING SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.aiHeaderTitle}>
                <Text style={styles.sectionTitle}>Flash Funding</Text>
                <BlurView intensity={20} tint="dark" style={[styles.aiBadge, { backgroundColor: '#EF4444', marginLeft: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }]}>
                  <Ionicons name="timer-outline" size={12} color="#FFF" />
                  <Text style={styles.aiBadgeText}>ENDING SOON</Text>
                </BlurView>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationList}>
              {pitches.slice(2, 5).map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.flashCard}
                  onPress={() => router.push({ pathname: "/customer/innovation-details", params: { id: item.id } })}
                >
                  <Image source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=300" }} style={styles.flashImage} />
                  <LinearGradient colors={['transparent', 'rgba(239, 68, 68, 0.9)']} style={styles.flashGradient}>
                    <View style={styles.countdownBox}>
                      <Text style={styles.countdownText}>02:44:12</Text>
                    </View>
                    <Text style={styles.flashTitle} numberOfLines={1}>{item.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* INNOVATIONS GRID */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Innovations</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#6366F1" size="large" style={{ marginTop: 30 }} />
            ) : filteredPitches.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="rocket-outline" size={60} color="#E2E8F0" />
                <Text style={styles.emptyText}>No innovations found here yet.</Text>
              </View>
            ) : (
              <View style={styles.innovationGrid}>
                {filteredPitches.map((item) => (
                  <InnovationItem key={item.id} item={item} router={router} formatPrice={formatPrice} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const RecommendationCard = ({ item, router }) => (
  <TouchableOpacity 
    style={styles.recCard} 
    onPress={() => router.push({ pathname: "/customer/innovation-details", params: { id: item.id } })}
  >
    <Image 
      source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300" }} 
      style={styles.recImage} 
    />
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.recGradient}>
      <View style={styles.aiBadge}>
        <Ionicons name="sparkles" size={10} color="#FFF" />
        <Text style={styles.aiBadgeText}>AI RECOMMENDED</Text>
      </View>
      <Text style={styles.recTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.recCategory}>{item.category || "Tech"}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const InnovationItem = ({ item, router }) => (
  <TouchableOpacity 
    style={styles.itemCard} 
    onPress={() => router.push({ pathname: "/customer/innovation-details", params: { id: item.id } })}
  >
    <View style={styles.itemImageContainer}>
      <Image source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=300" }} style={styles.itemImage} />
      <BlurView intensity={40} tint="dark" style={styles.itemBadge}>
        <Text style={styles.itemBadgeText}>{item.category || "Tech"}</Text>
      </BlurView>
      
      {/* Community Pulse Badge */}
      <View style={styles.pulseBadge}>
        <Text style={styles.pulseText}>🔥 {Math.floor(Math.random() * 500) + 50} watching</Text>
      </View>
    </View>
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
      
      <View style={styles.avatarRow}>
        <View style={styles.miniAvatars}>
          {[1,2,3].map(i => (
            <Image 
              key={i}
              source={{ uri: `https://i.pravatar.cc/100?u=${item.id}${i}` }} 
              style={[styles.miniAvatar, { marginLeft: i === 1 ? 0 : -8 }]} 
            />
          ))}
        </View>
        <Text style={styles.interestedText}>+12 interested</Text>
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.progressTrack}>
           <View style={[styles.progressFill, { width: '60%' }]} />
        </View>
        <View style={styles.actionIcons}>
          <TouchableOpacity 
            style={styles.actionCircle} 
            onPress={() => router.push({ pathname: "/customer/ar-view", params: { id: item.id, title: item.title } })}
          >
            <Ionicons name="cube-outline" size={16} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCircle} onPress={() => {/* Chat Logic */}}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Background Blobs
  bgCircle1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99, 102, 241, 0.05)' },
  bgCircle2: { position: 'absolute', top: 200, left: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(168, 85, 247, 0.05)' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 25 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  currencyToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 2 },
  currencyBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  currencyBtnActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  currencyBtnText: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  currencyBtnTextActive: { color: '#6366F1' },
  
  greetingText: { fontSize: 28, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
  subGreeting: { fontSize: 16, color: '#64748B', fontWeight: '500', marginTop: 2 },
  avatarContainer: { elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.2, shadowRadius: 10 },
  avatarRing: { padding: 3, borderRadius: 25 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF' },

  searchWrapper: { paddingHorizontal: 24, paddingVertical: 10 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 64, 
    borderRadius: 24, 
    paddingHorizontal: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden'
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#1E293B' },
  divider: { width: 1, height: 24, backgroundColor: '#E2E8F0', marginHorizontal: 15 },
  filterBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  featuredContainer: { paddingHorizontal: 24, marginVertical: 25 },
  heroCard: { height: 200, borderRadius: 32, padding: 24, flexDirection: 'row', overflow: 'hidden' },
  heroContent: { flex: 1, zIndex: 2, justifyContent: 'space-between' },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  heroBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 10 },
  heroDescription: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500', marginTop: 5 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 10 },
  heroStats: { alignItems: 'flex-start' },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  investBtn: { backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  investBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  heroImage: { position: 'absolute', right: -50, top: 0, bottom: 0, width: width * 0.5, opacity: 0.6, resizeMode: 'cover' },

  section: { marginVertical: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  aiHeaderTitle: { flexDirection: 'row', alignItems: 'center' },
  seeAll: { color: '#6366F1', fontSize: 14, fontWeight: '700' },

  recommendationList: { paddingLeft: 24, paddingRight: 10 },
  recCard: { 
    width: 200, 
    height: 260, 
    borderRadius: 30, 
    marginRight: 20, 
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
    shadowRadius: 15
  },
  recImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  recGradient: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: '60%', 
    padding: 20, 
    justifyContent: 'flex-end' 
  },
  aiBadge: { 
    backgroundColor: '#6366F1', 
    alignSelf: 'flex-start', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  aiBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900', marginLeft: 4 },
  recTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  recCategory: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 2 },

  categoryList: { paddingLeft: 24, paddingRight: 10 },
  categoryCard: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 24, 
    marginRight: 15, 
    alignItems: 'center', 
    width: 100,
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  catIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  categoryName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },

  flashCard: { 
    width: 240, 
    height: 180, 
    borderRadius: 32, 
    marginRight: 15, 
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.15,
    shadowRadius: 15
  },
  flashImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  flashGradient: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: '100%', 
    padding: 20, 
    justifyContent: 'flex-end' 
  },
  countdownBox: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  countdownText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  flashTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  innovationGrid: { paddingHorizontal: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  itemCard: { 
    width: (width - 64) / 2, 
    backgroundColor: '#FFF', 
    borderRadius: 28, 
    marginBottom: 20, 
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15
  },
  itemImageContainer: { height: 140, position: 'relative' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  itemBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  pulseBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  pulseText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  itemContent: { padding: 16 },
  itemTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  miniAvatars: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#FFF' },
  interestedText: { fontSize: 10, color: '#64748B', fontWeight: '600', marginLeft: 8 },

  itemFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 3 },
  
  actionIcons: { flexDirection: 'row', gap: 6 },
  actionCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },

  emptyState: { alignItems: 'center', padding: 50 },
  emptyText: { color: '#94A3B8', marginTop: 15, fontWeight: '600' },
});
