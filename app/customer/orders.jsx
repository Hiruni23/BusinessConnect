import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar, Image, TouchableOpacity, Dimensions } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(list);
      setLoading(false);
    }, (error) => {
      console.error("Orders Fetch Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusConfig = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return { color: '#F59E0B', icon: 'time', label: 'Processing' };
      case 'shipped': return { color: '#3B82F6', icon: 'airplane', label: 'In Transit' };
      case 'delivered': return { color: '#10B981', icon: 'checkmark-done', label: 'Delivered' };
      default: return { color: '#64748B', icon: 'help-circle', label: 'Unknown' };
    }
  };

  const renderOrder = ({ item }) => {
    const status = getStatusConfig(item.status);
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.orderCard}>
        <View style={styles.cardHeader}>
           <View style={[styles.statusTag, { backgroundColor: status.color + '15' }]}>
              <Ionicons name={status.icon} size={14} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
           </View>
           <Text style={styles.orderDate}>
              {item.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
           </Text>
        </View>

        <View style={styles.orderBody}>
           <Text style={styles.orderId}>Order #{item.id.substring(0,8).toUpperCase()}</Text>
           <View style={styles.productStack}>
              {item.items && item.items.slice(0, 3).map((prod, idx) => (
                 <View key={idx} style={[styles.productMini, { marginLeft: idx === 0 ? 0 : -15, zIndex: 10 - idx }]}>
                    <Image source={{ uri: prod.imageUrl }} style={styles.miniImg} />
                 </View>
              ))}
              {item.items?.length > 3 && (
                 <View style={styles.moreBadge}>
                    <Text style={styles.moreText}>+{item.items.length - 3}</Text>
                 </View>
              )}
              <View style={styles.orderMeta}>
                 <Text style={styles.itemCount}>{item.items?.length || 0} Innovations</Text>
                 <Text style={styles.orderTotal}>${item.total?.toLocaleString()}</Text>
              </View>
           </View>
        </View>

        <View style={styles.cardFooter}>
           <View style={styles.progressTrack}>
              <View style={[styles.progressPoint, { backgroundColor: '#10B981' }]} />
              <View style={[styles.progressLine, { backgroundColor: item.status === 'pending' ? '#E2E8F0' : '#10B981' }]} />
              <View style={[styles.progressPoint, { backgroundColor: item.status === 'pending' ? '#E2E8F0' : (item.status === 'shipped' ? '#3B82F6' : '#10B981') }]} />
              <View style={[styles.progressLine, { backgroundColor: item.status === 'delivered' ? '#10B981' : '#E2E8F0' }]} />
              <View style={[styles.progressPoint, { backgroundColor: item.status === 'delivered' ? '#10B981' : '#E2E8F0' }]} />
           </View>
           <TouchableOpacity style={styles.trackBtn}>
              <Text style={styles.trackText}>Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#6366F1" />
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
           <Text style={styles.headerTitle}>Order History</Text>
           <TouchableOpacity style={styles.searchBtn}>
              <Ionicons name="search-outline" size={24} color="#1E293B" />
           </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
             <View style={styles.emptyCircle}>
                <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
             </View>
             <Text style={styles.emptyTitle}>No orders yet</Text>
             <Text style={styles.emptySub}>Your purchase history will appear here once you've secured some innovations.</Text>
             <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/customer/marketplace')}>
                <Text style={styles.shopBtnText}>Explore Marketplace</Text>
             </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 15 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  searchBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },

  listContent: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 10 },
  orderCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, marginBottom: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '900', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  orderDate: { fontSize: 13, color: '#94A3B8', fontWeight: '700' },

  orderBody: { marginBottom: 25 },
  orderId: { fontSize: 14, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
  productStack: { flexDirection: 'row', alignItems: 'center' },
  productMini: { width: 48, height: 48, borderRadius: 16, borderWidth: 3, borderColor: '#FFF', backgroundColor: '#F1F5F9', overflow: 'hidden' },
  miniImg: { width: '100%', height: '100%' },
  moreBadge: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginLeft: -10, zIndex: 5, borderWidth: 2, borderColor: '#FFF' },
  moreText: { fontSize: 10, fontWeight: '900', color: '#6366F1' },
  orderMeta: { flex: 1, marginLeft: 15 },
  itemCount: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  orderTotal: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginTop: 2 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 20 },
  progressTrack: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressPoint: { width: 8, height: 8, borderRadius: 4 },
  progressLine: { height: 2, width: 25, marginHorizontal: 2 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  trackText: { fontSize: 12, fontWeight: '800', color: '#6366F1', marginRight: 4 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 10 },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  shopBtn: { backgroundColor: '#6366F1', paddingHorizontal: 30, paddingVertical: 18, borderRadius: 24, elevation: 4, shadowColor: '#6366F1', shadowOpacity: 0.3, shadowRadius: 10 },
  shopBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});
