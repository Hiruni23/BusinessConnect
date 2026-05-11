import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { auth, db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

export default function Cart() {
  const router = useRouter();
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();
  const styles = makeStyles(T, isDark);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const cartRef = doc(db, "cart", user.uid);
    const unsubscribe = onSnapshot(cartRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().items) {
        setCartItems(docSnap.data().items);
      } else {
        setCartItems([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Cart listener failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateQuantity = async (productId, delta) => {
    const updatedItems = cartItems.map(item => {
      if (item.productId === productId) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0);
    
    await setDoc(doc(db, "cart", user.uid), { userId: user.uid, items: updatedItems }, { merge: true });
  };

  const removeItem = async (productId) => {
    const updatedItems = cartItems.filter(item => item.productId !== productId);
    await setDoc(doc(db, "cart", user.uid), { userId: user.uid, items: updatedItems }, { merge: true });
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = subtotal > 0 ? 10 : 0;
  const total = subtotal + shipping;

  const renderItem = ({ item }) => (
    <View style={styles.cartCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeItem(item.productId)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemPrice}>${item.price?.toLocaleString()}</Text>
        
        <View style={styles.itemFooter}>
          <View style={styles.qtyControl}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, -1)}>
              <Ionicons name="remove" size={14} color={T.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, 1)}>
              <Ionicons name="add" size={14} color={T.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemTotal}>${(item.price * item.qty).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bag</Text>
          <View style={styles.itemCountBadge}>
             <Text style={styles.itemCountText}>{cartItems.length} items</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={T.accent} /></View>
        ) : cartItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
               <Ionicons name="cart-outline" size={60} color={T.border} />
            </View>
            <Text style={styles.emptyTitle}>Your bag is empty</Text>
            <Text style={styles.emptySub}>Looks like you haven't added any innovations to your bag yet.</Text>
            <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.push('/customer/marketplace')}>
               <Text style={styles.shopNowText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderItem}
              keyExtractor={item => item.productId}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
            
            <View style={styles.summaryContainer}>
               <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryVal}>${subtotal.toLocaleString()}</Text>
               </View>
               <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryVal}>${shipping.toLocaleString()}</Text>
               </View>
               <View style={[styles.summaryRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: T.border, paddingTop: 15 }]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalVal}>${total.toLocaleString()}</Text>
               </View>

               <TouchableOpacity 
                 style={styles.checkoutBtn}
                 onPress={() => router.push({ pathname: '/customer/checkout', params: { total } })}
               >
                 <LinearGradient 
                   colors={isDark ? ['#1E3A8A', '#2563EB'] : ['#2563EB', '#3B82F6']} 
                   style={styles.checkoutGradient}
                   start={{x: 0, y: 0}} 
                   end={{x: 1, y: 0}}
                 >
                   <Text style={styles.checkoutBtnText}>Checkout</Text>
                   <Ionicons name="arrow-forward" size={20} color="#FFF" />
                 </LinearGradient>
               </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    headerTitle: { fontSize: 24, fontWeight: '900', color: T.text },
    itemCountBadge: { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    itemCountText: { fontSize: 12, fontWeight: '800', color: isDark ? '#60A5FA' : '#2563EB' },

    listContent: { paddingHorizontal: 24, paddingBottom: 30, paddingTop: 10 },
    cartCard: { flexDirection: 'row', backgroundColor: T.surface, borderRadius: 24, padding: 12, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: isDark ? T.border : 'transparent' },
    itemImage: { width: 90, height: 90, borderRadius: 18, backgroundColor: T.border },
    itemInfo: { flex: 1, marginLeft: 15, height: 90, justifyContent: 'space-between' },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemName: { fontSize: 16, fontWeight: '800', color: T.text, width: '85%' },
    itemPrice: { fontSize: 14, color: T.subtext, fontWeight: '700' },
    itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemTotal: { fontSize: 16, fontWeight: '900', color: T.text },
    
    qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface2, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: T.border },
    qtyBtn: { width: 28, height: 28, backgroundColor: T.surface, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
    qtyText: { marginHorizontal: 12, fontSize: 14, fontWeight: '800', color: T.text },

    summaryContainer: { backgroundColor: T.surface, paddingHorizontal: 24, paddingVertical: 24, borderTopLeftRadius: 36, borderTopRightRadius: 36, elevation: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 14, color: T.subtext, fontWeight: '600' },
    summaryVal: { fontSize: 14, color: T.text, fontWeight: '700' },
    totalLabel: { fontSize: 18, fontWeight: '800', color: T.text },
    totalVal: { fontSize: 24, fontWeight: '900', color: isDark ? '#60A5FA' : '#2563EB' },

    checkoutBtn: { marginTop: 20, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 15 },
    checkoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
    checkoutBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', marginRight: 10, letterSpacing: 0.5 },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    emptyTitle: { fontSize: 22, fontWeight: '900', color: T.text, marginBottom: 10 },
    emptySub: { fontSize: 14, color: T.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    shopNowBtn: { backgroundColor: isDark ? '#3B82F6' : '#1E293B', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 20 },
    shopNowText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
  });
}
