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
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity 
            onPress={() => removeItem(item.productId)}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={T.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Bag</Text>
          <View style={styles.itemCountBadge}>
             <Text style={styles.itemCountText}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={T.accent} /></View>
        ) : cartItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
               <Ionicons name="cart-outline" size={54} color={T.accent} />
            </View>
            <Text style={styles.emptyTitle}>Your bag is empty</Text>
            <Text style={styles.emptySub}>Looks like you haven't added any innovations to your bag yet.</Text>
            <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.push('/customer/marketplace')}>
               <Text style={styles.shopNowText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
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
               <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalVal}>${total.toLocaleString()}</Text>
               </View>

               <TouchableOpacity 
                 style={styles.checkoutBtn}
                 onPress={() => router.push({ pathname: '/customer/checkout', params: { total } })}
               >
                 <LinearGradient 
                   colors={isDark ? ['#4F46E5', '#3730A3'] : ['#6366F1', '#4F46E5']} 
                   style={styles.checkoutGradient}
                   start={{x: 0, y: 0}} 
                   end={{x: 1, y: 0}}
                 >
                   <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                   <Ionicons name="arrow-forward" size={18} color="#FFF" />
                 </LinearGradient>
               </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 24, 
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : '#F1F5F9',
      backgroundColor: T.bg,
    },
    backBtn: { 
      width: 42, 
      height: 42, 
      borderRadius: 14, 
      backgroundColor: T.surface, 
      justifyContent: 'center', 
      alignItems: 'center', 
      elevation: 2, 
      shadowColor: '#0F172A', 
      shadowOpacity: 0.05, 
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    headerTitle: { 
      fontSize: 20, 
      fontWeight: '800', 
      color: T.text,
      letterSpacing: -0.3,
    },
    itemCountBadge: { 
      backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF', 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#E0E7FF',
    },
    itemCountText: { 
      fontSize: 12, 
      fontWeight: '800', 
      color: isDark ? '#818CF8' : '#4F46E5',
    },

    listContent: { 
      paddingHorizontal: 24, 
      paddingBottom: 40, 
      paddingTop: 20 
    },
    cartCard: { 
      flexDirection: 'row', 
      backgroundColor: T.surface, 
      borderRadius: 24, 
      padding: 14, 
      marginBottom: 18, 
      elevation: 6, 
      shadowColor: '#0F172A', 
      shadowOpacity: 0.06, 
      shadowRadius: 16, 
      shadowOffset: { width: 0, height: 4 },
      alignItems: 'center', 
      borderWidth: 1, 
      borderColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    imageContainer: {
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    itemImage: { 
      width: 88, 
      height: 88, 
      backgroundColor: T.border 
    },
    itemInfo: { 
      flex: 1, 
      marginLeft: 16, 
      height: 88, 
      justifyContent: 'space-between' 
    },
    itemHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    itemName: { 
      fontSize: 16, 
      fontWeight: '800', 
      color: T.text, 
      width: '80%',
      letterSpacing: -0.2,
    },
    deleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FEF2F2',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#FEE2E2',
    },
    itemPrice: { 
      fontSize: 14, 
      color: T.subtext, 
      fontWeight: '700',
      marginTop: -2,
    },
    itemFooter: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    itemTotal: { 
      fontSize: 16, 
      fontWeight: '800', 
      color: T.text 
    },
    
    qtyControl: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: T.surface2, 
      borderRadius: 30, 
      padding: 3, 
      borderWidth: 1, 
      borderColor: isDark ? '#1E293B' : '#E2E8F0' 
    },
    qtyBtn: { 
      width: 26, 
      height: 26, 
      backgroundColor: T.surface, 
      borderRadius: 13, 
      justifyContent: 'center', 
      alignItems: 'center', 
      elevation: 2, 
      shadowColor: '#000', 
      shadowOpacity: 0.08, 
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    qtyText: { 
      marginHorizontal: 12, 
      fontSize: 13, 
      fontWeight: '800', 
      color: T.text 
    },

    summaryContainer: { 
      backgroundColor: T.surface, 
      paddingHorizontal: 24, 
      paddingTop: 24, 
      paddingBottom: 90, // Floating the checkout button above the bottom tab bar comfortably
      borderTopLeftRadius: 36, 
      borderTopRightRadius: 36, 
      elevation: 25, 
      shadowColor: '#0F172A', 
      shadowOpacity: 0.12, 
      shadowRadius: 24,
      shadowOffset: { width: 0, height: -8 },
      borderWidth: 1,
      borderColor: isDark ? '#1E293B' : '#F1F5F9',
    },
    summaryRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      marginBottom: 12 
    },
    summaryLabel: { 
      fontSize: 14, 
      color: T.subtext, 
      fontWeight: '600' 
    },
    summaryVal: { 
      fontSize: 14, 
      color: T.text, 
      fontWeight: '700' 
    },
    totalRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      marginTop: 8, 
      borderTopWidth: 1, 
      borderTopColor: isDark ? '#1E293B' : '#F1F5F9', 
      paddingTop: 16,
      alignItems: 'center',
    },
    totalLabel: { 
      fontSize: 18, 
      fontWeight: '800', 
      color: T.text,
      letterSpacing: -0.3,
    },
    totalVal: { 
      fontSize: 24, 
      fontWeight: '900', 
      color: isDark ? '#818CF8' : '#4F46E5',
    },

    checkoutBtn: { 
      marginTop: 20, 
      borderRadius: 20, 
      overflow: 'hidden', 
      elevation: 8, 
      shadowColor: '#4F46E5', 
      shadowOpacity: 0.35, 
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
    },
    checkoutGradient: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingVertical: 18,
      gap: 8,
    },
    checkoutBtnText: { 
      color: '#FFF', 
      fontSize: 16, 
      fontWeight: '800', 
      letterSpacing: -0.1,
    },

    emptyState: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingHorizontal: 40 
    },
    emptyCircle: { 
      width: 112, 
      height: 112, 
      borderRadius: 56, 
      backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#EEF2FF', 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(99,102,241,0.2)' : '#E0E7FF',
    },
    emptyTitle: { 
      fontSize: 20, 
      fontWeight: '800', 
      color: T.text, 
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    emptySub: { 
      fontSize: 14, 
      color: T.subtext, 
      textAlign: 'center', 
      lineHeight: 22, 
      marginBottom: 28 
    },
    shopNowBtn: { 
      backgroundColor: isDark ? '#4F46E5' : '#0F172A', 
      paddingHorizontal: 28, 
      paddingVertical: 15, 
      borderRadius: 18,
      elevation: 4,
      shadowColor: '#0F172A',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    shopNowText: { 
      color: '#FFF', 
      fontSize: 15, 
      fontWeight: '800' 
    }
  });
}
