import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function FundingInsights() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Query only this entrepreneur's transactions so Firestore rules can authorize it.
    const q = query(
      collection(db, "transactions"),
      where("entrepreneurId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
      setInvestors(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const sendThankYou = (investorEmail, pitchTitle) => {
    const subject = `Thank you for investing in ${pitchTitle}!`;
    const body = `Hi! I'm the founder of ${pitchTitle}. I just saw your investment and wanted to personally reach out and say thank you for believing in our vision...`;
    Linking.openURL(`mailto:${investorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const renderItem = ({ item }) => (
    <View style={styles.investorCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.investorEmail?.charAt(0).toUpperCase()}</Text>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.investorName}>{item.investorEmail}</Text>
        <Text style={styles.pitchName}>Project: {item.pitchTitle}</Text>
        <Text style={styles.amount}>Invested: ${item.amount?.toLocaleString()}</Text>
      </View>

      <TouchableOpacity 
        style={styles.thankYouBtn}
        onPress={() => sendThankYou(item.investorEmail, item.pitchTitle)}
      >
        <Ionicons name="mail" size={20} color="#fff" />
        <Text style={styles.btnText}>Thank You</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Investor Insights</Text>
        <Text style={styles.subTitle}>Manage your stakeholders and relationships</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={investors}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No investments recorded yet.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 25, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  subTitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  investorCard: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 15, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  details: { flex: 1, marginLeft: 15 },
  investorName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  pitchName: { fontSize: 12, color: '#64748B', marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '800', color: '#10B981', marginTop: 4 },
  thankYouBtn: { backgroundColor: '#4F46E5', padding: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});