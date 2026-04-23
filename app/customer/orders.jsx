import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function MyPortfolio() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transactions"),
      where("investorId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestments(list);
      setLoading(false);
    }, (error) => {
      console.error("Portfolio Fetch Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const totalStaked = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const renderInvestment = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <LinearGradient colors={['#6366F1', '#A855F7']} style={styles.gradientCircle}>
            <Ionicons name="cube" size={24} color="#FFF" />
          </LinearGradient>
        </View>
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>{item.pitchTitle}</Text>
          <Text style={styles.date}>{item.timestamp?.toDate().toLocaleDateString()}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>${item.amount.toLocaleString()}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active Stake</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background Blobs */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Portfolio</Text>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="stats-chart" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* SUMMARY CARD */}
        <View style={styles.summaryContainer}>
          <LinearGradient 
            colors={['#1E293B', '#0F172A']} 
            style={styles.summaryCard}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          >
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Total Supported Value</Text>
                <Text style={styles.totalValue}>${totalStaked.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
                <Text style={styles.badgeText}>+4.2%</Text>
              </View>
            </View>
            <View style={styles.summaryFooter}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Assets</Text>
                <Text style={styles.footerValue}>{investments.length}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Pre-orders</Text>
                <Text style={styles.footerValue}>{investments.length}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* IMPACT INSIGHTS */}
        <View style={styles.impactSection}>
          <Text style={styles.sectionTitle}>Impact Insights</Text>
          <View style={styles.impactGrid}>
            <View style={styles.impactBadge}>
              <View style={[styles.impactIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="leaf" size={20} color="#10B981" />
              </View>
              <Text style={styles.impactValue}>3.2t</Text>
              <Text style={styles.impactLabel}>CO2 Saved</Text>
            </View>
            <View style={styles.impactBadge}>
              <View style={[styles.impactIconCircle, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="flash" size={20} color="#6366F1" />
              </View>
              <Text style={styles.impactValue}>12.5kW</Text>
              <Text style={styles.impactLabel}>Clean Energy</Text>
            </View>
            <View style={styles.impactBadge}>
              <View style={[styles.impactIconCircle, { backgroundColor: '#Fef9c3' }]}>
                <Ionicons name="bulb" size={20} color="#ca8a04" />
              </View>
              <Text style={styles.impactValue}>5</Text>
              <Text style={styles.impactLabel}>Innovations</Text>
            </View>
          </View>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Asset History</Text>
          {loading ? (
            <ActivityIndicator color="#6366F1" size="large" style={{ marginTop: 40 }} />
          ) : investments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={80} color="#E2E8F0" />
              <Text style={styles.emptyText}>You haven't supported any innovations yet.</Text>
              <TouchableOpacity style={styles.exploreBtn}>
                <Text style={styles.exploreBtnText}>Explore Marketplace</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={investments}
              renderItem={renderInvestment}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  bgCircle1: { position: 'absolute', top: -50, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99, 102, 241, 0.05)' },
  bgCircle2: { position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(168, 85, 247, 0.05)' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 15 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },

  summaryContainer: { paddingHorizontal: 24, marginVertical: 20 },
  summaryCard: { borderRadius: 32, padding: 24, elevation: 12, shadowColor: '#6366F1', shadowOpacity: 0.3, shadowRadius: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  totalValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginTop: 4 },
  summaryBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { color: '#10B981', fontSize: 12, fontWeight: '800', marginLeft: 4 },
  
  summaryFooter: { flexDirection: 'row', marginTop: 25, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  footerItem: { flex: 1 },
  footerLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  footerValue: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 2 },
  divider: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20 },

  impactSection: { paddingHorizontal: 24, marginVertical: 20 },
  impactGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  impactBadge: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 24, 
    alignItems: 'center', 
    marginHorizontal: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  impactIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  impactValue: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  impactLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', marginTop: 2 },

  listSection: { flex: 1, paddingHorizontal: 24, marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
  listContent: { paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { marginRight: 15 },
  gradientCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  details: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  date: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  amountContainer: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: '900', color: '#4F46E5' },
  statusBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  statusText: { color: '#64748B', fontSize: 10, fontWeight: '800' },

  emptyState: { alignItems: 'center', padding: 50, marginTop: 50 },
  emptyText: { color: '#94A3B8', fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 20 },
  exploreBtn: { backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 15, borderRadius: 18, marginTop: 30 },
  exploreBtnText: { color: '#FFF', fontWeight: '800' }
});
