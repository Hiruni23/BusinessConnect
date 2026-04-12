import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { collection, query, where, getDocs, orderBy, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get("window").width;

export default function AdvancedAnalytics() {
  const [views, setViews] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pitchQuery = query(collection(db, "pitches"), where("entrepreneurId", "==", user.uid));
      const pitchSnap = await getDocs(pitchQuery);
      
      if (!pitchSnap.empty) {
        const myPitchId = pitchSnap.docs[0].id;

        // Fetch Count
        const countSnap = await getCountFromServer(query(collection(db, "pitchViews"), where("pitchId", "==", myPitchId)));
        setTotalCount(countSnap.data().count);

        // Fetch List
        const vQuery = query(collection(db, "pitchViews"), where("pitchId", "==", myPitchId), orderBy("viewedAt", "desc"));
        const vSnap = await getDocs(vQuery);
        const fetchedViews = vSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setViews(fetchedViews);

        // Process Chart Data
        const last7Days = {};
        for(let i=6; i>=0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const label = date.toLocaleDateString([], { weekday: 'short' });
          last7Days[label] = 0;
        }

        fetchedViews.forEach(view => {
          const date = view.viewedAt?.toDate();
          if (date) {
            const label = date.toLocaleDateString([], { weekday: 'short' });
            if (last7Days[label] !== undefined) last7Days[label] += 1;
          }
        });

        setChartData(Object.keys(last7Days).map(key => ({
          value: last7Days[key],
          label: key,
          frontColor: last7Days[key] > 0 ? '#4F46E5' : '#E2E8F0',
          gradientColor: '#818CF8',
          spacing: 15,
          labelTextStyle: {color: '#94A3B8', fontSize: 10},
        })));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const renderHeader = () => (
    <View style={styles.innerContainer}>
      <View style={styles.topHeader}>
        <Text style={styles.mainTitle}>Performance Insights</Text>
        <TouchableOpacity onPress={fetchData}><Ionicons name="refresh-circle" size={30} color="#4F46E5" /></TouchableOpacity>
      </View>

      {/* Main Stats Card */}
      <View style={styles.mainHeroCard}>
        <View>
          <Text style={styles.heroLabel}>Total Engagement</Text>
          <Text style={styles.heroValue}>{totalCount}</Text>
          <View style={styles.trendRow}>
            <Ionicons name="trending-up" size={16} color="#10B981" />
            <Text style={styles.trendText}>+12% this week</Text>
          </View>
        </View>
        <View style={styles.heroIconCircle}>
           <Ionicons name="eye" size={32} color="#fff" />
        </View>
      </View>

      {/* Sub Stats Row */}
      <View style={styles.subStatsRow}>
        <View style={styles.smallCard}>
           <Text style={styles.smallLabel}>Investor Reach</Text>
           <Text style={styles.smallValue}>{Math.round(totalCount * 0.4)}</Text>
        </View>
        <View style={styles.smallCard}>
           <Text style={styles.smallLabel}>Conversion</Text>
           <Text style={styles.smallValue}>8.2%</Text>
        </View>
      </View>

      {/* Modern Chart Card */}
      <View style={styles.chartWrapper}>
        <Text style={styles.chartTitle}>Investor Interaction Trend</Text>
        <BarChart
          data={chartData}
          barWidth={24}
          initialSpacing={10}
          noOfSections={3}
          barBorderRadius={6}
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          height={160}
          isAnimated
          renderTooltip={(item) => (
            <View style={styles.tooltip}><Text style={{color:'#fff'}}>{item.value}</Text></View>
          )}
        />
      </View>

      <Text style={styles.listHeader}>Recent View History</Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={{flex:1}} color="#4F46E5" />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={views}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.viewRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.investorName?.charAt(0)}</Text></View>
            <View style={{flex:1, marginLeft: 15}}>
              <Text style={styles.name}>{item.investorName}</Text>
              <Text style={styles.time}>{item.viewedAt?.toDate().toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
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
  mainTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  mainHeroCard: { backgroundColor: '#4F46E5', borderRadius: 24, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 10 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  heroValue: { color: '#fff', fontSize: 42, fontWeight: '800' },
  heroIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  trendText: { color: '#10B981', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  subStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  smallCard: { backgroundColor: '#fff', width: '48%', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  smallLabel: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  smallValue: { color: '#1E293B', fontSize: 20, fontWeight: '800', marginTop: 4 },
  chartWrapper: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginTop: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  listHeader: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 25, marginBottom: 15 },
  viewRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, padding: 15, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#4F46E5', fontWeight: '800', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  time: { fontSize: 12, color: '#94A3B8' },
  tooltip: { backgroundColor: '#1E293B', padding: 5, borderRadius: 5 }
});