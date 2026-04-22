import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Dimensions,
  StatusBar
} from 'react-native';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get("window").width;

export default function StakeholderAnalytics() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const [sectorData, setSectorData] = useState([]);
  const [fundingData, setFundingData] = useState([]);
  const [totalGoal, setTotalGoal] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "pitches"),
      where("status", "in", ["accepted", "funded", "active"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(list);
      processAnalytics(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const processAnalytics = (list) => {
    // 1. Sector Distribution
    const sectors = {};
    let total = 0;
    list.forEach(p => {
      const cat = p.category || 'Other';
      sectors[cat] = (sectors[cat] || 0) + 1;
      total += Number(p.fundingGoal || 0);
    });
    setTotalGoal(total);

    const pieColors = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
    const pieData = Object.keys(sectors).map((cat, index) => ({
      value: sectors[cat],
      color: pieColors[index % pieColors.length],
      text: cat,
      label: cat
    }));
    setSectorData(pieData);

    // 2. Funding by status
    const statuses = { 'active': 0, 'accepted': 0, 'funded': 0 };
    list.forEach(p => {
        if (statuses[p.status] !== undefined) {
            statuses[p.status] += Number(p.fundingGoal || 0);
        }
    });

    const barData = [
        { value: statuses['accepted'], label: 'Acc.', frontColor: '#EEF2FF', spacing: 15 },
        { value: statuses['active'], label: 'Act.', frontColor: '#4F46E5', spacing: 15 },
        { value: statuses['funded'], label: 'Fun.', frontColor: '#10B981', spacing: 15 }
    ];
    setFundingData(barData);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Market Insights</Text>
           <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
           
           {/* HERO SUMMARY */}
           <View style={styles.heroSummaryCard}>
              <View>
                 <Text style={styles.heroSubText}>Total Assets Overseen</Text>
                 <Text style={styles.heroValue}>${(totalGoal / 1000000).toFixed(1)}M</Text>
              </View>
              <View style={styles.heroIconCircle}>
                 <Ionicons name="bar-chart" size={30} color="#fff" />
              </View>
           </View>

           {/* STATS ROW */}
           <View style={styles.statsRow}>
              <View style={styles.smallStatCard}>
                 <Text style={styles.smallStatLabel}>Portfolios</Text>
                 <Text style={styles.smallStatValue}>{projects.length}</Text>
              </View>
              <View style={styles.smallStatCard}>
                 <Text style={styles.smallStatLabel}>Avg. Goal</Text>
                 <Text style={styles.smallStatValue}>${projects.length ? Math.round(totalGoal/projects.length/1000) : 0}k</Text>
              </View>
           </View>

           {/* SECTOR PIE CHART */}
           <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Sector Distribution</Text>
              <View style={styles.chartRow}>
                 <PieChart
                    data={sectorData}
                    donut
                    radius={80}
                    innerRadius={50}
                    centerLabelComponent={() => (
                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 20, fontWeight: 'bold', color: '#1E293B'}}>{projects.length}</Text>
                            <Text style={{fontSize: 10, color: '#64748B'}}>Sectors</Text>
                        </View>
                    )}
                 />
                 <View style={styles.legendContainer}>
                    {sectorData.map((d, i) => (
                        <View key={i} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                            <Text style={styles.legendText} numberOfLines={1}>{d.label}</Text>
                        </View>
                    ))}
                 </View>
              </View>
           </View>

           {/* FUNDING BAR CHART */}
           <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Capital by Lifecycle</Text>
              <View style={{ marginTop: 20, alignItems: 'center' }}>
                 <BarChart
                    data={fundingData}
                    barWidth={45}
                    noOfSections={3}
                    barBorderRadius={8}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    yAxisLabelPrefix="$"
                    yAxisLabelContainerStyle={{ width: 45 }}
                    yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
                 />
              </View>
              <View style={styles.lifecycleFooter}>
                 <View style={styles.footerItem}><View style={[styles.dot, {backgroundColor: '#EEF2FF'}]} /><Text style={styles.footerText}>Accepted</Text></View>
                 <View style={styles.footerItem}><View style={[styles.dot, {backgroundColor: '#4F46E5'}]} /><Text style={styles.footerText}>Active</Text></View>
                 <View style={styles.footerItem}><View style={[styles.dot, {backgroundColor: '#10B981'}]} /><Text style={styles.footerText}>Funded</Text></View>
              </View>
           </View>

           {/* ACTIVITY LOG */}
           <Text style={styles.sectionHeader}>Oversight Log</Text>
           {projects.slice(0, 5).map(p => (
              <View key={p.id} style={styles.logRow}>
                 <View style={[styles.logIcon, { backgroundColor: p.status === 'funded' ? '#ECFDF5' : '#EEF2FF' }]}>
                    <Ionicons name="time-outline" size={18} color={p.status === 'funded' ? '#10B981' : '#4F46E5'} />
                 </View>
                 <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.logTitle}>{p.title}</Text>
                    <Text style={styles.logSub}>Status updated to {p.status} • Oversight confirmed</Text>
                 </View>
              </View>
           ))}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  headerTitle: { fontSize: 20, fontFamily: 'outfit-bold', fontWeight: '900', color: '#1E293B' },
  headerBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  scrollPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  heroSummaryCard: { 
    backgroundColor: '#4F46E5', 
    borderRadius: 32, 
    padding: 25, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 10,
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 }
  },
  heroSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'outfit-medium', fontWeight: '600' },
  heroValue: { color: '#fff', fontSize: 36, fontFamily: 'outfit-bold', fontWeight: '900', marginTop: 4 },
  heroIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  smallStatCard: { 
    backgroundColor: '#fff', 
    width: '48%', 
    padding: 18, 
    borderRadius: 24, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  smallStatLabel: { color: '#64748B', fontSize: 13, fontFamily: 'outfit-medium' },
  smallStatValue: { color: '#1E293B', fontSize: 22, fontFamily: 'outfit-bold', fontWeight: '800', marginTop: 4 },
  
  chartCard: { 
    backgroundColor: '#fff', 
    borderRadius: 32, 
    padding: 24, 
    marginTop: 20, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  chartTitle: { fontSize: 16, fontFamily: 'outfit-bold', fontWeight: '800', color: '#1E293B', marginBottom: 15 },
  chartRow: { flexDirection: 'row', alignItems: 'center' },
  legendContainer: { marginLeft: 20, flex: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, fontFamily: 'outfit-medium', color: '#64748B' },
  
  lifecycleFooter: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 15 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  footerText: { color: '#94A3B8', fontSize: 11, fontFamily: 'outfit-bold' },
  
  sectionHeader: { fontSize: 18, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800', marginTop: 30, marginBottom: 15 },
  logRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 24, 
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10
  },
  logIcon: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  logTitle: { fontSize: 15, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800' },
  logSub: { color: '#94A3B8', fontSize: 12, fontFamily: 'outfit-medium', marginTop: 2 }
});
