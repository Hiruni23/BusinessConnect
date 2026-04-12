import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateInvestmentReceipt } from '../../utils/pdfGenerator';

export default function InvestmentHistory() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // 🔍 QUERY: Get all transactions for THIS investor
    const q = query(
      collection(db, "transactions"),
      where("investorId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvestments(list);
      setLoading(false);
    }, (error) => {
      console.error("History Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.iconBg}>
        <Ionicons name="cash" size={24} color="#4F46E5" />
      </View>
      <View style={styles.info}>
        <Text style={styles.pitchTitle}>{item.pitchTitle || "Project Investment"}</Text>
        <Text style={styles.date}>
          {item.timestamp?.toDate().toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => generateInvestmentReceipt(item)}
      >
        <Ionicons name="download-outline" size={20} color="#4F46E5" />
      </TouchableOpacity>
      <Text style={styles.amount}>+${item.amount?.toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Portfolio</Text>
        <Text style={styles.headerSub}>Total Invested: ${investments.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={investments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No investments yet.</Text>
            </View>
          }
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#4F46E5', padding: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  historyCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 18, 
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  iconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15 },
  pitchTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  date: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  downloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  amount: { fontSize: 18, fontWeight: '800', color: '#10B981' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', marginTop: 10, fontSize: 16 }
});