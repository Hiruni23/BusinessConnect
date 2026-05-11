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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get("window").width;

export default function StakeholderAnalytics() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();
  const s = makeStyles(T, isDark);

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

    const pieColors = isDark 
        ? ['#60A5FA', '#34D399', '#FBBF24', '#F472B6', '#A78BFA'] 
        : ['#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
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
        { value: statuses['accepted'], label: 'Acc.', frontColor: isDark ? '#1E3A8A' : '#DBEAFE', spacing: 15 },
        { value: statuses['active'], label: 'Act.', frontColor: isDark ? '#60A5FA' : '#2563EB', spacing: 15 },
        { value: statuses['funded'], label: 'Fun.', frontColor: isDark ? '#34D399' : '#10B981', spacing: 15 }
    ];
    setFundingData(barData);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
      <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
           <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
              <Ionicons name="arrow-back" size={24} color={T.text} />
           </TouchableOpacity>
           <Text style={s.headerTitle}>Market Insights</Text>
           <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollPadding}>
           
           {/* HERO SUMMARY */}
           <Animated.View entering={FadeInDown.delay(100).springify()} style={s.heroSummaryCard}>
              <View>
                 <Text style={s.heroSubText}>Total Assets Overseen</Text>
                 <Text style={s.heroValue}>${(totalGoal / 1000000).toFixed(1)}M</Text>
              </View>
              <View style={s.heroIconCircle}>
                 <Ionicons name="bar-chart" size={30} color="#fff" />
              </View>
           </Animated.View>

           {/* STATS ROW */}
           <View style={s.statsRow}>
              <Animated.View entering={FadeInDown.delay(200).springify()} style={s.smallStatCard}>
                 <Text style={s.smallStatLabel}>Portfolios</Text>
                 <Text style={s.smallStatValue}>{projects.length}</Text>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(300).springify()} style={s.smallStatCard}>
                 <Text style={s.smallStatLabel}>Avg. Goal</Text>
                 <Text style={s.smallStatValue}>${projects.length ? Math.round(totalGoal/projects.length/1000) : 0}k</Text>
              </Animated.View>
           </View>

           {/* SECTOR PIE CHART */}
           <Animated.View entering={FadeInDown.delay(400).springify()} style={s.chartCard}>
              <Text style={s.chartTitle}>Sector Distribution</Text>
              <View style={s.chartRow}>
                 <PieChart
                    data={sectorData}
                    donut
                    radius={80}
                    innerRadius={50}
                    centerLabelComponent={() => (
                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 20, fontWeight: 'bold', color: T.text}}>{projects.length}</Text>
                            <Text style={{fontSize: 10, color: T.subtext}}>Sectors</Text>
                        </View>
                    )}
                 />
                 <View style={s.legendContainer}>
                    {sectorData.map((d, i) => (
                        <View key={i} style={s.legendItem}>
                            <View style={[s.legendDot, { backgroundColor: d.color }]} />
                            <Text style={s.legendText} numberOfLines={1}>{d.label}</Text>
                        </View>
                    ))}
                 </View>
              </View>
           </Animated.View>

           {/* FUNDING BAR CHART */}
           <Animated.View entering={FadeInDown.delay(500).springify()} style={s.chartCard}>
              <Text style={s.chartTitle}>Capital by Lifecycle</Text>>
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
                    yAxisTextStyle={{ color: T.subtext, fontSize: 10 }}
                 />
              </View>
              <View style={s.lifecycleFooter}>
                 <View style={s.footerItem}><View style={[s.dot, {backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE'}]} /><Text style={s.footerText}>Accepted</Text></View>
                 <View style={s.footerItem}><View style={[s.dot, {backgroundColor: isDark ? '#60A5FA' : '#2563EB'}]} /><Text style={s.footerText}>Active</Text></View>
                 <View style={s.footerItem}><View style={[s.dot, {backgroundColor: isDark ? '#34D399' : '#10B981'}]} /><Text style={s.footerText}>Funded</Text></View>
              </View>
           </Animated.View>

           {/* ACTIVITY LOG */}
           <Animated.View entering={FadeInDown.delay(600).springify()}>
               <Text style={s.sectionHeader}>Oversight Log</Text>
           </Animated.View>
           {projects.slice(0, 5).map((p, index) => (
              <Animated.View entering={FadeInDown.delay(700 + index * 100).springify()} key={p.id} style={s.logRow}>
                 <View style={[s.logIcon, { backgroundColor: p.status === 'funded' ? (isDark ? 'rgba(52,211,153,0.1)' : '#ECFDF5') : (isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF') }]}>
                    <Ionicons name="time-outline" size={18} color={p.status === 'funded' ? (isDark ? '#34D399' : '#10B981') : (isDark ? '#60A5FA' : '#2563EB')} />
                 </View>
                 <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.logTitle}>{p.title}</Text>
                    <Text style={s.logSub}>Status updated to {p.status} • Oversight confirmed</Text>
                 </View>
              </Animated.View>
           ))}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 20, 
      paddingVertical: 15 
    },
    headerTitle: { fontSize: 20, fontFamily: 'outfit-bold', fontWeight: '900', color: T.text },
    headerBtn: { 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: T.surface, 
      justifyContent: 'center', 
      alignItems: 'center', 
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 5,
      borderWidth: 1,
      borderColor: T.border
    },
    scrollPadding: { paddingHorizontal: 20, paddingBottom: 40 },
    heroSummaryCard: { 
      backgroundColor: isDark ? '#1E3A8A' : '#2563EB', 
      borderRadius: 32, 
      padding: 25, 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginTop: 10,
      elevation: 8,
      shadowColor: isDark ? '#0F172A' : '#2563EB',
      shadowOpacity: 0.3,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 10 },
      borderWidth: 1,
      borderColor: isDark ? '#2563EB' : 'transparent'
    },
    heroSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'outfit-medium', fontWeight: '600' },
    heroValue: { color: '#fff', fontSize: 36, fontFamily: 'outfit-bold', fontWeight: '900', marginTop: 4 },
    heroIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    smallStatCard: { 
      backgroundColor: T.glassBg, 
      width: '48%', 
      padding: 18, 
      borderRadius: 24, 
      elevation: 4, 
      shadowColor: T.accent, 
      shadowOpacity: 0.05, 
      shadowRadius: 15,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    smallStatLabel: { color: T.subtext, fontSize: 13, fontFamily: 'outfit-medium', letterSpacing: 0.5 },
    smallStatValue: { color: T.text, fontSize: 22, fontFamily: 'outfit-bold', fontWeight: '800', marginTop: 4 },
    
    chartCard: { 
      backgroundColor: T.glassBg, 
      borderRadius: 32, 
      padding: 24, 
      marginTop: 20, 
      elevation: 4, 
      shadowColor: T.accent, 
      shadowOpacity: 0.05, 
      shadowRadius: 15,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    chartTitle: { fontSize: 16, fontFamily: 'outfit-bold', fontWeight: '800', color: T.text, marginBottom: 15, letterSpacing: 0.5 },
    chartRow: { flexDirection: 'row', alignItems: 'center' },
    legendContainer: { marginLeft: 20, flex: 1 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    legendText: { fontSize: 12, fontFamily: 'outfit-medium', color: T.subtext },
    
    lifecycleFooter: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 15 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    footerText: { color: T.subtext, fontSize: 11, fontFamily: 'outfit-bold' },
    
    sectionHeader: { fontSize: 18, fontFamily: 'outfit-bold', color: T.text, fontWeight: '800', marginTop: 30, marginBottom: 15, letterSpacing: 0.5 },
    logRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: T.glassBg, 
      padding: 16, 
      borderRadius: 24, 
      marginBottom: 10,
      elevation: 4,
      shadowColor: T.accent,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    logIcon: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    logTitle: { fontSize: 15, fontFamily: 'outfit-bold', color: T.text, fontWeight: '800' },
    logSub: { color: T.subtext, fontSize: 12, fontFamily: 'outfit-medium', marginTop: 2 }
  });
}
