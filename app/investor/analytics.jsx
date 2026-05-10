import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get("window").width;

export default function InvestorAnalytics() {
  const router = useRouter();
  const [investments, setInvestments] = useState([]);
  
  const [lineDataAmounts, setLineDataAmounts] = useState([]);
  
  const [totalInvested, setTotalInvested] = useState(0);
  const [escrow, setEscrow] = useState(0);
  const [released, setReleased] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const invQuery = query(
        collection(db, "investments"), 
        where("investorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const invSnap = await getDocs(invQuery);
      const fetchedInvestments = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvestments(fetchedInvestments);

      let totalAmount = 0;
      let escrowCount = 0;
      let releasedCount = 0;

      const last7DaysAmounts = {};
      for(let i=6; i>=0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const label = date.toLocaleDateString([], { weekday: 'short' });
        last7DaysAmounts[label] = 0;
      }

      fetchedInvestments.forEach(inv => {
        totalAmount += Number(inv.amount || 0);
        if (inv.status === 'escrow') escrowCount++;
        if (inv.status === 'released') releasedCount++;

        let date = inv.createdAt;
        if (date?.toDate) date = date.toDate();
        else date = new Date(date);

        if (date && !isNaN(date.getTime())) {
          const label = date.toLocaleDateString([], { weekday: 'short' });
          if (last7DaysAmounts[label] !== undefined) {
            last7DaysAmounts[label] += Number(inv.amount || 0);
          }
        }
      });

      setTotalInvested(totalAmount);
      setEscrow(escrowCount);
      setReleased(releasedCount);

      setLineDataAmounts(Object.keys(last7DaysAmounts).map(key => ({
        value: last7DaysAmounts[key],
        label: key,
        labelTextStyle: {color: '#94A3B8', fontSize: 10},
      })));
      
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const renderHeader = () => (
    <View style={styles.innerContainer}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.mainTitle}>Portfolio Analytics</Text>
        <TouchableOpacity onPress={fetchData}><Ionicons name="refresh-circle" size={30} color="#10B981" /></TouchableOpacity>
      </View>

      {/* Main Stats Card */}
      <View style={styles.mainHeroCard}>
        <View>
          <Text style={styles.heroLabel}>Total Committed</Text>
          <Text style={styles.heroValue}>${totalInvested.toLocaleString()}</Text>
          <View style={styles.trendRow}>
             <Ionicons name="briefcase" size={16} color="#A7F3D0" />
             <Text style={styles.trendText}>Across {investments.length} Ventures</Text>
          </View>
        </View>
        <View style={styles.heroIconCircle}>
           <Ionicons name="pie-chart" size={30} color="#fff" />
        </View>
      </View>

      {/* Sub Stats Row */}
      <View style={styles.subStatsRow}>
        <View style={styles.smallCard}>
           <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
             <Text style={styles.smallLabel}>In Escrow</Text>
             <Ionicons name="lock-closed" size={16} color="#F59E0B" />
           </View>
           <Text style={styles.smallValue}>{escrow}</Text>
        </View>
        <View style={styles.smallCard}>
           <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
             <Text style={styles.smallLabel}>Released</Text>
             <Ionicons name="checkmark-circle" size={16} color="#10B981" />
           </View>
           <Text style={styles.smallValue}>{released}</Text>
        </View>
      </View>

      {/* Modern Chart Card */}
      <View style={styles.chartWrapper}>
        <Text style={styles.chartTitle}>Investment Growth</Text>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#10B981'}]}/><Text style={styles.legendText}>Amount ($)</Text></View>
        </View>
        
        <LineChart
          data={lineDataAmounts}
          color1="#10B981"
          thickness1={3}
          curved
          isAnimated
          hideRules
          yAxisThickness={0}
          xAxisThickness={0}
          height={160}
          width={screenWidth - 100}
          initialSpacing={10}
          spacing={ (screenWidth - 100) / 7 }
          dataPointsColor1="#10B981"
        />
      </View>

      <Text style={styles.listHeader}>Recent Investments</Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={{flex:1, justifyContent: 'center'}} color="#10B981" />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={investments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.viewRow}>
            <View style={[styles.avatar, {backgroundColor: '#10B98120'}]}>
              <Ionicons name="cash" size={20} color="#10B981" />
            </View>
            <View style={{flex:1, marginLeft: 15}}>
              <Text style={styles.name}>Amount: ${Number(item.amount).toLocaleString()}</Text>
              <Text style={styles.time}>
                Status: {item.status?.toUpperCase()} • {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{paddingBottom: 40}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  innerContainer: { padding: 20 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  mainHeroCard: { backgroundColor: '#10B981', borderRadius: 24, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 10 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  heroValue: { color: '#fff', fontSize: 36, fontWeight: '800' },
  heroIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  trendText: { color: '#A7F3D0', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  subStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  smallCard: { backgroundColor: '#fff', width: '48%', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  smallLabel: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  smallValue: { color: '#1E293B', fontSize: 26, fontWeight: '800', marginTop: 8 },
  chartWrapper: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginTop: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, overflow: 'hidden' },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 5 },
  legendContainer: { flexDirection: 'row', marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  legendText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  listHeader: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 25, marginBottom: 15 },
  viewRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, padding: 15, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  avatar: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  time: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
});
