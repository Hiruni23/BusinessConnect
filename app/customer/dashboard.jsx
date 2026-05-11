import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, doc, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;

  const openMenu = () => {
    setIsMenuOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.8,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setIsMenuOpen(false));
  };

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
        { icon: 'storefront-outline', label: 'Explore',  color: '#60A5FA', bg: '#1E3A8A', route: '/customer/marketplace' },
        { icon: 'pricetag-outline',   label: 'Offers',   color: '#FDBA74', bg: '#7C2D12', route: '/customer/offers' },
        { icon: 'cart-outline',       label: 'Cart',     color: '#93C5FD', bg: '#172554', route: '/customer/cart' },
        { icon: 'receipt-outline',    label: 'Orders',   color: '#38BDF8', bg: '#0C4A6E', route: '/customer/orders' },
        { icon: 'notifications-outline', label: 'Alerts', color: '#818CF8', bg: '#312E81', route: '/customer/notifications' },
      ]
    : [
        { icon: 'storefront-outline', label: 'Explore',  color: '#2563EB', bg: '#EFF6FF', route: '/customer/marketplace' },
        { icon: 'pricetag-outline',   label: 'Offers',   color: '#F97316', bg: '#FFF7ED', route: '/customer/offers' },
        { icon: 'cart-outline',       label: 'Cart',     color: '#3B82F6', bg: '#DBEAFE', route: '/customer/cart' },
        { icon: 'receipt-outline',    label: 'Orders',   color: '#0284C7', bg: '#E0F2FE', route: '/customer/orders' },
        { icon: 'notifications-outline', label: 'Alerts', color: '#4F46E5', bg: '#EEF2FF', route: '/customer/notifications' },
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={openMenu} style={s.hamburgerBtn}>
                <Ionicons name="menu" size={28} color={T.text} />
              </TouchableOpacity>
              <View>
                <Text style={s.greetingText}>{getHour()}</Text>
                <Text style={s.nameText}>{firstName}</Text>
              </View>
            </View>
            <View style={s.headerActions}>

              {/* ── DARK MODE TOGGLE ── */}
              <TouchableOpacity style={s.themeToggle} onPress={toggleTheme} activeOpacity={0.85}>
                <View style={s.toggleTrack}>
                  <View style={[s.toggleThumb, isDark && s.toggleThumbRight]}>
                    <Ionicons
                      name={isDark ? 'moon' : 'sunny'}
                      size={13}
                      color={isDark ? '#60A5FA' : '#F59E0B'}
                    />
                  </View>
                  <Ionicons name="sunny" size={12} color={isDark ? T.subtext : '#F59E0B'} style={{ position: 'absolute', left: 8 }} />
                  <Ionicons name="moon"  size={12} color={isDark ? '#60A5FA' : T.subtext} style={{ position: 'absolute', right: 8 }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/customer/cart')}>
                <Ionicons name="cart-outline" size={22} color={T.text} />
                {cartCount > 0 && (
                  <View style={s.badge}><Text style={s.badgeText}>{cartCount}</Text></View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/customer/profile')}>
                <Ionicons name="person-outline" size={22} color={T.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── STATS CARD ── */}
          <View style={s.cardWrap}>
            <LinearGradient
              colors={isDark ? ['#1E3A8A', '#1E40AF', '#172554'] : ['#2563EB', '#3B82F6']}
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
                  <Ionicons name="pulse" size={18} color={isDark ? '#93C5FD' : '#DBEAFE'} />
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
                    <LinearGradient colors={isDark ? ['#1E3A8A', '#1E40AF'] : ['#EFF6FF', '#DBEAFE']} style={s.orderIconWrap}>
                      <Ionicons name="cube" size={18} color={isDark ? '#93C5FD' : T.accent} />
                    </LinearGradient>
                    <View style={s.orderInfo}>
                      <Text style={s.orderTitle}>Order #{order.id.substring(0, 8).toUpperCase()}</Text>
                      <Text style={s.orderSub}>{order.items?.length || 0} items · ${order.total?.toLocaleString()}</Text>
                    </View>
                    <View style={[s.orderBadge, {
                      backgroundColor: order.status === 'pending'
                        ? (isDark ? '#172554' : '#EFF6FF')
                        : (isDark ? '#064E3B' : '#F0FDF4')
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

      {/* ── SIDE MENU MODAL ── */}
      <Modal visible={isMenuOpen} transparent animationType="none" onRequestClose={closeMenu}>
        <View style={s.menuOverlay}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>
          <Animated.View style={[s.sideMenu, { transform: [{ translateX: slideAnim }] }]}>
            <SafeAreaView style={{ flex: 1, backgroundColor: T.surface }}>
               <View style={s.menuHeader}>
                  <Image source={{ uri: user?.photoURL || PLACEHOLDER_IMAGE }} style={s.menuAvatar} defaultSource={{ uri: PLACEHOLDER_IMAGE }} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                     <Text style={s.menuName} numberOfLines={1}>{firstName}</Text>
                     <Text style={s.menuEmail} numberOfLines={1}>{user?.email}</Text>
                  </View>
                  <TouchableOpacity onPress={closeMenu} style={s.closeMenuBtn}>
                     <Ionicons name="close" size={20} color={T.text} />
                  </TouchableOpacity>
               </View>
               
               <ScrollView contentContainerStyle={s.menuScroll} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity style={s.menuItem} onPress={() => { closeMenu(); router.push('/customer/profile'); }}>
                     <Ionicons name="person-outline" size={22} color={isDark ? '#60A5FA' : '#2563EB'} />
                     <Text style={s.menuItemText}>My Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.menuItem} onPress={() => { closeMenu(); router.push('/customer/orders'); }}>
                     <Ionicons name="receipt-outline" size={22} color={isDark ? '#60A5FA' : '#2563EB'} />
                     <Text style={s.menuItemText}>Order History</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.menuItem} onPress={() => { closeMenu(); router.push('/customer/offers'); }}>
                    <Ionicons name="pricetag-outline" size={22} color={isDark ? '#60A5FA' : '#2563EB'} />
                    <Text style={s.menuItemText}>Offers & Deals</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.menuItem} onPress={() => { closeMenu(); router.push('/customer/notifications'); }}>
                     <Ionicons name="notifications-outline" size={22} color={isDark ? '#60A5FA' : '#2563EB'} />
                     <Text style={s.menuItemText}>Notifications</Text>
                  </TouchableOpacity>
                  
                  <View style={s.menuDivider} />
                  
                  <TouchableOpacity style={s.menuItem} onPress={() => { closeMenu(); router.push('/customer/support'); }}>
                     <Ionicons name="help-buoy-outline" size={22} color={isDark ? '#60A5FA' : '#2563EB'} />
                     <Text style={s.menuItemText}>Help & Support</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.menuItem} onPress={() => { closeMenu(); router.push('/customer/privacy'); }}>
                     <Ionicons name="shield-checkmark-outline" size={22} color={isDark ? '#60A5FA' : '#2563EB'} />
                     <Text style={s.menuItemText}>Privacy Policy</Text>
                  </TouchableOpacity>
               </ScrollView>

               <View style={s.menuFooter}>
                  <TouchableOpacity style={s.logoutBtn} onPress={() => { closeMenu(); auth.signOut(); router.replace('/auth/login'); }}>
                     <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                     <Text style={s.logoutText}>Sign Out</Text>
                  </TouchableOpacity>
               </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },

    glow1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(59,130,246,0.12)' },
    glow2: { position: 'absolute', top: 420, left: -120, width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(37,99,235,0.07)' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
    hamburgerBtn: { marginRight: 12, padding: 4 },
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
    heroCard: { borderRadius: 28, padding: 22, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(59,130,246,0.3)' : 'transparent', elevation: 12, shadowColor: T.accent, shadowOpacity: 0.3, shadowRadius: 18 },
    heroGlow: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(59,130,246,0.2)' },
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
    pricePill: { position: 'absolute', top: 12, right: 12, backgroundColor: isDark ? 'rgba(37,99,235,0.85)' : 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
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

    // SIDE MENU
    menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
    sideMenu: { width: width * 0.8, backgroundColor: T.surface, height: '100%', shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20, borderRightWidth: 1, borderRightColor: isDark ? T.border : 'transparent' },
    menuHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: T.border },
    menuAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: T.border },
    menuName: { fontSize: 18, fontWeight: '900', color: T.text },
    menuEmail: { fontSize: 13, color: T.subtext, fontWeight: '600', marginTop: 2 },
    closeMenuBtn: { position: 'absolute', right: 20, top: 24, width: 32, height: 32, borderRadius: 16, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' },
    menuScroll: { paddingVertical: 10 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 },
    menuItemText: { fontSize: 15, fontWeight: '700', color: T.text, marginLeft: 16 },
    menuDivider: { height: 1, backgroundColor: T.border, marginVertical: 10, marginHorizontal: 24 },
    menuFooter: { padding: 24, borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.surface2 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center' },
    logoutText: { fontSize: 15, fontWeight: '800', color: '#EF4444', marginLeft: 16 }
  });
}
