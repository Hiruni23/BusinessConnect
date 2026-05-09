import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, doc, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from "../../context/ThemeContext";
import { auth, db } from "../../firebaseConfig";

const { width } = Dimensions.get("window");
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=400";

export default function CustomerDashboard() {
  const router = useRouter();
  const user = auth.currentUser;
  const { theme: T, isDark, toggleTheme } = useTheme();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setOrders([]);
      setCartCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const handleListenerError = (label, error) => {
      console.error(`${label} listener failed:`, error);
      setLoading(false);
    };

    const qProducts = query(
      collection(db, "products"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(6)
    );
    const unsubProducts = onSnapshot(
      qProducts,
      (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => handleListenerError("Products", error)
    );

    const qOrders = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const unsubOrders = onSnapshot(
      qOrders,
      (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => handleListenerError("Orders", error)
    );

    const cartRef = doc(db, "cart", user.uid);
    const unsubCart = onSnapshot(
      cartRef,
      (docSnap) => {
        setCartCount(docSnap.exists() ? (docSnap.data().items || []).length : 0);
        setLoading(false);
      },
      (error) => handleListenerError("Cart", error)
    );

    return () => { unsubProducts(); unsubOrders(); unsubCart(); };
  }, [user]);

  const firstName = user?.displayName?.split(' ')[0] || "Innovator";

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning 🌤️';
    if (h < 18) return 'Good Afternoon ☀️';
    return 'Good Evening 🌙';
  };

  const quickActions = isDark
    ? [
        { icon: 'storefront-outline', label: 'Explore',  color: '#A78BFA', bg: '#3B0764', route: '/customer/marketplace' },
        { icon: 'cart-outline',       label: 'Cart',     color: '#34D399', bg: '#052E16', route: '/customer/cart' },
        { icon: 'receipt-outline',    label: 'Orders',   color: '#FCD34D', bg: '#451A03', route: '/customer/orders' },
        { icon: 'notifications-outline', label: 'Alerts', color: '#F9A8D4', bg: '#500724', route: '/customer/notifications' },
      ]
    : [
        { icon: 'storefront-outline', label: 'Explore',  color: '#6366F1', bg: '#EEF2FF', route: '/customer/marketplace' },
        { icon: 'cart-outline',       label: 'Cart',     color: '#10B981', bg: '#F0FDF4', route: '/customer/cart' },
        { icon: 'receipt-outline',    label: 'Orders',   color: '#F59E0B', bg: '#FFFBEB', route: '/customer/orders' },
        { icon: 'notifications-outline', label: 'Alerts', color: '#EC4899', bg: '#FDF2F8', route: '/customer/notifications' },
      ];

  const s = makeStyles(T, isDark);

  return (
    <View style={s.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />

      {/* Ambient glow (dark only) */}
      {isDark && <>
        <View style={s.glow1} />
        <View style={s.glow2} />
      </>}

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── HEADER ── */}
          <View style={s.header}>
            <View>
              <Text style={s.greetingText}>{getHour()}</Text>
              <Text style={s.nameText}>{firstName}</Text>
            </View>
            <View style={s.headerActions}>

              {/* ── DARK MODE TOGGLE ── */}
              <TouchableOpacity style={s.themeToggle} onPress={toggleTheme} activeOpacity={0.85}>
                <View style={s.toggleTrack}>
                  <View style={[s.toggleThumb, isDark && s.toggleThumbRight]}>
                    <Ionicons
                      name={isDark ? 'moon' : 'sunny'}
                      size={13}
                      color={isDark ? '#A78BFA' : '#F59E0B'}
                    />
                  </View>
                  <Ionicons name="sunny" size={12} color={isDark ? T.subtext : '#F59E0B'} style={{ position: 'absolute', left: 8 }} />
                  <Ionicons name="moon"  size={12} color={isDark ? '#A78BFA' : T.subtext} style={{ position: 'absolute', right: 8 }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/customer/cart')}>
                <Ionicons name="cart-outline" size={22} color={T.text} />
                {cartCount > 0 && (
                  <View style={s.badge}><Text style={s.badgeText}>{cartCount}</Text></View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/customer/profile')}>
                <Image
                  source={{ uri: user?.photoURL || `https://i.pravatar.cc/100?u=${user?.uid}` }}
                  style={s.avatar}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── STATS CARD ── */}
          <View style={s.cardWrap}>
            <LinearGradient
              colors={isDark ? ['#4C1D95', '#1E1B4B', '#0D0D0D'] : ['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.heroCard}
            >
              {isDark && <View style={s.heroGlow} />}
              <View style={s.heroTop}>
                <View>
                  <Text style={s.heroLabel}>MARKETPLACE OVERVIEW</Text>
                  <Text style={s.heroTitle}>Your Activity</Text>
                </View>
                <View style={s.heroBadge}>
                  <Ionicons name="pulse" size={18} color={isDark ? '#A78BFA' : '#FDE68A'} />
                </View>
              </View>
              <View style={s.heroStats}>
                <View style={s.heroStat}>
                  <Text style={s.heroVal}>{orders.length}</Text>
                  <Text style={s.heroLab}>Orders</Text>
                </View>
                <View style={s.heroDiv} />
                <View style={s.heroStat}>
                  <Text style={s.heroVal}>{products.length}</Text>
                  <Text style={s.heroLab}>Products</Text>
                </View>
                <View style={s.heroDiv} />
                <View style={s.heroStat}>
                  <Text style={s.heroVal}>{cartCount}</Text>
                  <Text style={s.heroLab}>In Cart</Text>
                </View>
              </View>
              <TouchableOpacity style={s.heroFooter} onPress={() => router.push('/customer/orders')}>
                <Text style={s.heroFooterText}>Track your orders</Text>
                <Ionicons name="arrow-forward-circle-outline" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <View style={s.decCircle1} />
              <View style={s.decCircle2} />
            </LinearGradient>
          </View>

          {/* ── QUICK ACTIONS ── */}
          <View style={s.actionGrid}>
            {quickActions.map((a, i) => (
              <TouchableOpacity key={i} style={s.actionCard} onPress={() => router.push(a.route)}>
                <View style={[s.actionIcon, { backgroundColor: a.bg }]}>
                  <Ionicons name={a.icon} size={22} color={a.color} />
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── FEATURED PRODUCTS ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>New Breakthroughs</Text>
              <TouchableOpacity onPress={() => router.push('/customer/marketplace')}>
                <Text style={s.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator color={T.accent} style={{ marginTop: 20 }} />
            ) : products.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="cube-outline" size={42} color={T.border} />
                <Text style={s.emptyText}>No products yet.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizList}>
                {products.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={s.productCard}
                    onPress={() => router.push({ pathname: '/customer/service-details', params: { id: item.id } })}
                  >
                    <Image source={{ uri: item.imageUrl || PLACEHOLDER_IMAGE }} style={s.productImg} defaultSource={{ uri: PLACEHOLDER_IMAGE }} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={s.productGradient} />
                    <View style={s.pricePill}>
                      <Text style={s.priceText}>${item.price?.toLocaleString()}</Text>
                    </View>
                    <View style={s.productContent}>
                      <Text style={s.productName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.productCat}>{item.category}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── RECENT ORDERS ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/customer/orders')}>
                <Text style={s.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.orderList}>
              {orders.length === 0 ? (
                <View style={s.orderEmpty}>
                  <Ionicons name="receipt-outline" size={32} color={T.subtext} />
                  <Text style={s.orderEmptyText}>No recent orders found.</Text>
                </View>
              ) : (
                orders.map(order => (
                  <TouchableOpacity key={order.id} style={s.orderItem} onPress={() => router.push('/customer/orders')}>
                    <LinearGradient colors={isDark ? ['#3B0764', '#1E1B4B'] : ['#EEF2FF', '#E0E7FF']} style={s.orderIconWrap}>
                      <Ionicons name="cube" size={18} color={isDark ? '#A78BFA' : T.accent} />
                    </LinearGradient>
                    <View style={s.orderInfo}>
                      <Text style={s.orderTitle}>Order #{order.id.substring(0, 8).toUpperCase()}</Text>
                      <Text style={s.orderSub}>{order.items?.length || 0} items · ${order.total?.toLocaleString()}</Text>
                    </View>
                    <View style={[s.orderBadge, {
                      backgroundColor: order.status === 'pending'
                        ? (isDark ? '#451A03' : '#FFFBEB')
                        : (isDark ? '#052E16' : '#F0FDF4')
                    }]}>
                      <Text style={[s.orderBadgeText, {
                        color: order.status === 'pending' ? T.amber : T.green
                      }]}>
                        {order.status?.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },

    glow1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(124,58,237,0.12)' },
    glow2: { position: 'absolute', top: 420, left: -120, width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(37,99,235,0.07)' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
    greetingText: { fontSize: 14, color: T.subtext, fontWeight: '600' },
    nameText: { fontSize: 28, fontWeight: '900', color: T.text, letterSpacing: -0.5 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

    // Theme toggle pill
    themeToggle: { justifyContent: 'center', alignItems: 'center' },
    toggleTrack: {
      width: 56, height: 28, borderRadius: 14,
      backgroundColor: isDark ? '#2A2A2A' : '#E2E8F0',
      borderWidth: 1, borderColor: isDark ? '#3A3A3A' : '#CBD5E1',
      justifyContent: 'center', position: 'relative',
    },
    toggleThumb: {
      position: 'absolute', left: 3,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: isDark ? '#1A1A1A' : '#FFF',
      justifyContent: 'center', alignItems: 'center',
      elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4,
    },
    toggleThumbRight: { left: undefined, right: 3 },

    iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border },
    badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    avatar: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: T.accent },

    cardWrap: { paddingHorizontal: 24, marginTop: 14 },
    heroCard: { borderRadius: 28, padding: 22, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(124,58,237,0.3)' : 'transparent', elevation: 12, shadowColor: T.accent, shadowOpacity: 0.3, shadowRadius: 18 },
    heroGlow: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(124,58,237,0.2)' },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    heroLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.8 },
    heroTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', marginTop: 4 },
    heroBadge: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    heroStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    heroStat: { flex: 1, alignItems: 'center' },
    heroVal: { fontSize: 32, fontWeight: '900', color: '#FFF' },
    heroLab: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '700', marginTop: 2 },
    heroDiv: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },
    heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
    heroFooterText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
    decCircle1: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)' },
    decCircle2: { position: 'absolute', bottom: -50, right: 50, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.04)' },

    actionGrid: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 22, gap: 10 },
    actionCard: { flex: 1, backgroundColor: T.surface, borderRadius: 20, alignItems: 'center', paddingVertical: 15, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
    actionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 11, fontWeight: '800', color: T.subtext },

    section: { marginTop: 26 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 14 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: T.text },
    seeAll: { fontSize: 13, fontWeight: '700', color: T.accent },

    horizList: { paddingLeft: 24, paddingRight: 10 },
    productCard: { width: 190, height: 230, borderRadius: 24, marginRight: 16, overflow: 'hidden', backgroundColor: T.surface2, borderWidth: 1, borderColor: T.border },
    productImg: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute' },
    productGradient: { ...StyleSheet.absoluteFillObject },
    pricePill: { position: 'absolute', top: 12, right: 12, backgroundColor: isDark ? 'rgba(124,58,237,0.85)' : 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    priceText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
    productContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
    productName: { fontSize: 15, fontWeight: '800', color: '#FFF' },
    productCat: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '700', marginTop: 3 },

    orderList: { paddingHorizontal: 24, gap: 10 },
    orderItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
    orderIconWrap: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    orderInfo: { flex: 1, marginLeft: 14 },
    orderTitle: { fontSize: 14, fontWeight: '800', color: T.text },
    orderSub: { fontSize: 12, color: T.subtext, fontWeight: '600', marginTop: 2 },
    orderBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    orderBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    orderEmpty: { padding: 28, backgroundColor: T.surface, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: T.border },
    orderEmptyText: { color: T.subtext, fontWeight: '600', fontSize: 14, marginTop: 8 },

    emptyState: { alignItems: 'center', padding: 30 },
    emptyText: { color: T.subtext, marginTop: 10, fontWeight: '600' },
  });
}
