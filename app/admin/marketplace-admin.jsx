import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, StatusBar, Alert, ScrollView, Dimensions } from 'react-native';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function MarketplaceAdmin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  
  // Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Products
    const qProducts = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Products listener failed:", error);
    });

    // Fetch Orders
    const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Orders listener failed:", error);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, []);

  const handleUpdateProductStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      await updateDoc(doc(db, "products", id), { status: newStatus });
    } catch (e) {
      Alert.alert("Error", "Failed to update product status.");
    }
  };

  const handleUpdateOrderStatus = async (id, currentStatus) => {
    const nextStatusMap = {
       'pending': 'shipped',
       'shipped': 'delivered',
       'delivered': 'pending'
    };
    const newStatus = nextStatusMap[currentStatus] || 'pending';
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
    } catch (e) {
      Alert.alert("Error", "Failed to update order status.");
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'shipped': return '#3B82F6';
      case 'delivered': return '#10B981';
      default: return '#64748B';
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.adminCard}>
      <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
           <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status?.toUpperCase()}</Text>
           </View>
        </View>
        <Text style={styles.cardPrice}>${item.price?.toLocaleString()}</Text>
        <Text style={styles.cardMeta}>Seller: {item.sellerId.substring(0,8)}</Text>
        
        <View style={styles.actionRow}>
           <TouchableOpacity 
             style={[styles.actionBtn, { backgroundColor: item.status === 'approved' ? '#FEE2E2' : '#DCFCE7' }]}
             onPress={() => handleUpdateProductStatus(item.id, item.status)}
           >
              <Ionicons 
                name={item.status === 'approved' ? "close-circle-outline" : "checkmark-circle-outline"} 
                size={18} 
                color={item.status === 'approved' ? '#EF4444' : '#10B981'} 
              />
              <Text style={[styles.btnText, { color: item.status === 'approved' ? '#EF4444' : '#10B981' }]}>
                {item.status === 'approved' ? 'Revoke' : 'Approve'}
              </Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.detailsBtn}>
              <Ionicons name="eye-outline" size={18} color="#64748B" />
           </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderOrder = ({ item }) => (
    <View style={styles.adminCard}>
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
           <Text style={styles.cardTitle}>Order #{item.id.substring(0,8).toUpperCase()}</Text>
           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status?.toUpperCase()}</Text>
           </View>
        </View>
        <View style={styles.orderSummary}>
           <Text style={styles.orderTotal}>Total: <Text style={styles.bold}>${item.total?.toLocaleString()}</Text></Text>
           <Text style={styles.orderItems}>{item.items?.length || 0} Items</Text>
        </View>

        <View style={styles.actionRow}>
           <TouchableOpacity 
             style={[styles.actionBtn, { backgroundColor: '#EEF2FF' }]}
             onPress={() => handleUpdateOrderStatus(item.id, item.status)}
           >
              <Ionicons name="refresh-outline" size={18} color="#6366F1" />
              <Text style={[styles.btnText, { color: '#6366F1' }]}>Progress Status</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.detailsBtn}>
              <Ionicons name="list-outline" size={18} color="#64748B" />
           </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.topHeader}>
         <SafeAreaView edges={['top']}>
            <View style={styles.headerNav}>
               <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
               </TouchableOpacity>
               <Text style={styles.headerTitle}>Governance</Text>
               <TouchableOpacity style={styles.iconCircle}>
                  <Ionicons name="settings-outline" size={24} color="#FFF" />
               </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
               <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Pending Products</Text>
                  <Text style={styles.statVal}>{products.filter(p => p.status !== 'approved').length}</Text>
               </View>
               <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Active Orders</Text>
                  <Text style={styles.statVal}>{orders.filter(o => o.status !== 'delivered').length}</Text>
               </View>
               <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total Inventory</Text>
                  <Text style={styles.statVal}>{products.length}</Text>
               </View>
            </ScrollView>
         </SafeAreaView>
      </LinearGradient>

      <View style={styles.mainContent}>
         <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'products' && styles.tabBtnActive]}
              onPress={() => setActiveTab('products')}
            >
               <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>Products</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
              onPress={() => setActiveTab('orders')}
            >
               <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Orders</Text>
            </TouchableOpacity>
         </View>

         {loading ? (
           <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
         ) : (
           <FlatList 
             data={activeTab === 'products' ? products : orders}
             renderItem={activeTab === 'products' ? renderProduct : renderOrder}
             keyExtractor={item => item.id}
             contentContainerStyle={styles.listContainer}
             showsVerticalScrollIndicator={false}
             ListEmptyComponent={
               <View style={styles.emptyState}>
                  <Ionicons name="shield-checkmark-outline" size={60} color="#E2E8F0" />
                  <Text style={styles.emptyTitle}>All Clear</Text>
                  <Text style={styles.emptySub}>No {activeTab} requiring attention at this moment.</Text>
               </View>
             }
           />
         )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  topHeader: { paddingBottom: 30, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 15 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  
  statsScroll: { paddingLeft: 24, marginTop: 20 },
  statCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 24, marginRight: 15, width: 160 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  statVal: { color: '#FFF', fontSize: 24, fontWeight: '900' },

  mainContent: { flex: 1, marginTop: -30, backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 24, paddingTop: 30 },
  tabBar: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 6, marginBottom: 25 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
  tabBtnActive: { backgroundColor: '#FFF', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  tabTextActive: { color: '#1E293B' },

  listContainer: { paddingBottom: 50 },
  adminCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 28, padding: 16, marginBottom: 16, borderWeight: 1, borderColor: '#F1F5F9', elevation: 5, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12 },
  cardImage: { width: 100, height: 100, borderRadius: 20, backgroundColor: '#F8FAFC' },
  cardInfo: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', width: '70%' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  cardPrice: { fontSize: 18, fontWeight: '900', color: '#6366F1' },
  cardMeta: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  
  orderSummary: { marginVertical: 10 },
  orderTotal: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  orderItems: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  bold: { fontWeight: '900', color: '#1E293B' },

  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14 },
  btnText: { fontSize: 12, fontWeight: '800', marginLeft: 8 },
  detailsBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20 }
});
