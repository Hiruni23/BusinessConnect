import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function FundingInsights() {
  const [investors, setInvestors] = useState([]);
  const [pendingInvestments, setPendingInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) {
      setInvestors([]);
      setPendingInvestments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

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
    }, (error) => {
      console.error('Funding insights transactions listener failed:', error);
      setLoading(false);
    });

    const qPending = query(
      collection(db, "investments"),
      where("entrepreneurId", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('Funding insights pending investments listener failed:', error);
    });

    return () => {
      unsubscribe();
      unsubPending();
    };
  }, [user]);

  const handleApprove = async (invId) => {
    try {
      await updateDoc(doc(db, "investments", invId), { status: "escrow" });
    } catch(err) { console.error(err); }
  };

  const handleDecline = async (invId) => {
    try {
      await updateDoc(doc(db, "investments", invId), { status: "rejected" });
    } catch(err) { console.error(err); }
  };

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
          ListHeaderComponent={
            pendingInvestments.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 10 }}>Pending Offers</Text>
                {pendingInvestments.map(inv => (
                  <View key={inv.id} style={[styles.investorCard, { borderColor: '#F59E0B', borderWidth: 1 }]}>
                    <View style={[styles.avatar, { backgroundColor: '#F59E0B' }]}>
                      <Ionicons name="time" size={24} color="#fff" />
                    </View>
                    <View style={styles.details}>
                      <Text style={styles.investorName}>Investor ID: {inv.investorId.slice(0,6)}...</Text>
                      <Text style={styles.amount}>Offered: ${inv.amount?.toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        style={[styles.thankYouBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => handleApprove(inv.id)}
                      >
                        <Text style={[styles.btnText, { marginTop: 0 }]}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.thankYouBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => handleDecline(inv.id)}
                      >
                        <Text style={[styles.btnText, { marginTop: 0 }]}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B', marginTop: 10, marginBottom: 5 }}>Completed Investments</Text>
              </View>
            ) : null
          }
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