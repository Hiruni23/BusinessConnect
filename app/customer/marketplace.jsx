import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StatusBar, Image, Dimensions } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CATEGORIES = ["All", "Tech ", "Food ", "Fashion ", "Services "];
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=400";

export default function Marketplace() {
  const router = useRouter();
  const user = auth.currentUser;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddToCart = async (product) => {
    if (!user) return;
    setAddingToCart(product.id);
    try {
      const cartRef = doc(db, "cart", user.uid);
      const cartSnap = await getDoc(cartRef);
      
      let items = [];
      if (cartSnap.exists()) {
        items = cartSnap.data().items || [];
      }

      const existingItemIndex = items.findIndex(item => item.productId === product.id);
      if (existingItemIndex >= 0) {
        items[existingItemIndex].qty += 1;
      } else {
        items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          qty: 1
        });
      }

      await setDoc(cartRef, { userId: user.uid, items }, { merge: true });
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddingToCart(null);
    }
  };

  const filteredProducts = products.filter(p => 
    (selectedCategory === "All" || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={styles.itemCard}
      onPress={() => router.push({ pathname: '/customer/service-details', params: { id: item.id } })}
    >
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: item.imageUrl || PLACEHOLDER_IMAGE }} 
          style={styles.itemImage}
          defaultSource={{ uri: PLACEHOLDER_IMAGE }}
        />
        <View style={styles.categoryBadge}>
           <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
        <TouchableOpacity style={styles.favBtn}>
           <Ionicons name="heart-outline" size={18} color="#1E293B" />
        </TouchableOpacity>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.priceRow}>
           <Text style={styles.itemPrice}>${item.price?.toLocaleString()}</Text>
           <TouchableOpacity 
             style={styles.addSmallBtn} 
             onPress={() => handleAddToCart(item)}
             disabled={addingToCart === item.id}
           >
             {addingToCart === item.id ? (
                <ActivityIndicator size="small" color="#FFF" />
             ) : (
                <Ionicons name="add" size={20} color="#FFF" />
             )}
           </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER & SEARCH */}
        <View style={styles.header}>
           <View style={styles.topBar}>
              <View>
                 <Text style={styles.headerLabel}>EXPLORE</Text>
                 <Text style={styles.headerTitle}>Marketplace</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/customer/cart')} style={styles.cartIconBox}>
                 <Ionicons name="bag-handle-outline" size={24} color="#1E293B" />
              </TouchableOpacity>
           </View>

           <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" />
              <TextInput 
                placeholder="Search innovations..." 
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#CBD5E1"
              />
              <View style={styles.divider} />
              <TouchableOpacity style={styles.filterBtn}>
                 <Ionicons name="options-outline" size={20} color="#6366F1" />
              </TouchableOpacity>
           </View>
        </View>

        {/* CATEGORIES */}
        <View style={styles.catSection}>
           <FlatList 
             horizontal
             showsHorizontalScrollIndicator={false}
             data={CATEGORIES}
             keyExtractor={item => item}
             renderItem={({ item }) => (
               <TouchableOpacity 
                 style={[styles.catBtn, selectedCategory === item && styles.catBtnActive]}
                 onPress={() => setSelectedCategory(item)}
               >
                 <Text style={[styles.catText, selectedCategory === item && styles.catTextActive]}>
                   {item}
                 </Text>
               </TouchableOpacity>
             )}
             contentContainerStyle={styles.catList}
           />
        </View>

        {/* PRODUCT GRID */}
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>
        ) : (
          <FlatList 
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={60} color="#E2E8F0" />
                <Text style={styles.emptyText}>No results found.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { paddingHorizontal: 24, paddingTop: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLabel: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  cartIconBox: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 15, height: 56, elevation: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1E293B', fontWeight: '600' },
  divider: { width: 1, height: 24, backgroundColor: '#F1F5F9', marginHorizontal: 10 },
  filterBtn: { padding: 5 },

  catSection: { marginVertical: 15 },
  catList: { paddingHorizontal: 24 },
  catBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, marginRight: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9' },
  catBtnActive: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  catText: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  catTextActive: { color: '#FFF' },

  gridContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 120 },
  itemCard: { width: (width - 64) / 2, marginBottom: 20, backgroundColor: '#FFF', borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 15 },
  imageWrapper: { height: 160, backgroundColor: '#F1F5F9', position: 'relative' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 9, fontWeight: '900', color: '#1E293B', textTransform: 'uppercase' },
  favBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  
  itemContent: { padding: 15 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { fontSize: 16, color: '#6366F1', fontWeight: '900' },
  addSmallBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '600', marginTop: 20 }
});
