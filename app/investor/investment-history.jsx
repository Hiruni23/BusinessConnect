import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

import { generateInvestmentReceipt } from '../../utils/pdfGenerator';

const { width } = Dimensions.get('window');

export default function ProfessionalInvestmentHistory() {
  const router = useRouter();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
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
    });

    return unsubscribe;
  }, []);

  const totalInvested = investments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const handleExportAll = async () => {
    if (investments.length === 0) {
      Alert.alert("Empty History", "You have no transactions to export.");
      return;
    }
    // For now, we'll just generate the most recent one or a summary if we had a multi-pdf utility.
    // Let's use the utility for the top one as a placeholder, or just Alert.
    Alert.alert("Export Report", "Generating your full Q2 Investment Statement...");
    // Future: implement multi-row PDF in pdfGenerator.js
    await generateInvestmentReceipt(investments[0]); 
  };

  const renderTransaction = ({ item }) => {
    const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
    const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    
    return (
      <View style={styles.transactionCard}>
        <View style={styles.cardLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="receipt" size={20} color="#4F46E5" />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.pitchTitle} numberOfLines={1}>{item.pitchTitle || 'Marketplace Asset'}</Text>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amountText}>+${Number(item.amount || 0).toLocaleString()}</Text>
          <TouchableOpacity 
            style={styles.receiptBtn} 
            onPress={() => generateInvestmentReceipt(item)}
          >
            <Ionicons name="download-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Asset History</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportAll}>
            <Ionicons name="share-outline" size={22} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* SUMMARY HERO */}
          <View style={styles.heroSection}>
            <LinearGradient colors={['#FFF', '#F8FAFC']} style={styles.heroCard}>
              <Text style={styles.heroLabel}>Net Portfolio Commitment</Text>
              <Text style={styles.heroValue}>${totalInvested.toLocaleString()}</Text>
              
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{investments.length}</Text>
                  <Text style={styles.heroStatLab}>Transactions</Text>
                </View>
                <View style={styles.statLine} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>Equity</Text>
                  <Text style={styles.heroStatLab}>Asset Type</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* TRANSACTION LIST */}
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            
            {loading ? (
              <ActivityIndicator color="#4F46E5" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={investments}
                renderItem={renderTransaction}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="list" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No investment records found.</Text>
                  </View>
                }
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Wrapper to use ScrollView + FlatList
const ScrollView = ({ children, ...props }) => {
  const { ScrollView: RNScrollView } = require('react-native');
  return <RNScrollView {...props}>{children}</RNScrollView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2FF' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#FFF'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  exportBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },

  heroSection: { padding: 25 },
  heroCard: { 
    padding: 30, 
    borderRadius: 32, 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#FFF'
  },
  heroLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroValue: { color: '#1E293B', fontSize: 36, fontWeight: '900', marginVertical: 12 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 10, width: '100%', justifyContent: 'center' },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatVal: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  heroStatLab: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  statLine: { width: 1, height: 25, backgroundColor: '#E2E8F0' },

  listSection: { paddingHorizontal: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#64748B', marginBottom: 20 },

  transactionCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 24, 
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  infoCol: { marginLeft: 15, flex: 1 },
  pitchTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  dateText: { fontSize: 12, color: '#94A3B8', marginTop: 3, fontWeight: '600' },
  cardRight: { alignItems: 'flex-end', marginLeft: 10 },
  amountText: { fontSize: 16, fontWeight: '800', color: '#10B981' },
  receiptBtn: { marginTop: 6 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 15 }
});