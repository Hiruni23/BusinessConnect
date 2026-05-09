import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get("window").width;

export default function AdvancedAnalytics() {
  const [views, setViews] = useState([]);
  
  const [lineDataViews, setLineDataViews] = useState([]);
  const [lineDataPDFs, setLineDataPDFs] = useState([]);
  
  const [totalViews, setTotalViews] = useState(0);
  const [pdfOpens, setPdfOpens] = useState(0);
  const [bookmarks, setBookmarks] = useState(0);
  
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

        // Fetch List
        const vQuery = query(
          collection(db, "pitchViews"), 
          where("pitchId", "==", myPitchId), 
          where("entrepreneurId", "==", user.uid),
          orderBy("viewedAt", "desc")
        );
        const vSnap = await getDocs(vQuery);
        const fetchedViews = vSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setViews(fetchedViews);

        let vCount = 0;
        let pCount = 0;
        let bCount = 0;

        // Process Chart Data
        const last7DaysV = {};
        const last7DaysP = {};
        for(let i=6; i>=0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const label = date.toLocaleDateString([], { weekday: 'short' });
          last7DaysV[label] = 0;
          last7DaysP[label] = 0;
        }

        fetchedViews.forEach(v => {
          const type = v.type || 'view';
          if(type === 'view') vCount++;
          if(type === 'pdf_view') pCount++;
          if(type === 'bookmark') bCount++;

          const date = v.viewedAt?.toDate();
          if (date) {
            const label = date.toLocaleDateString([], { weekday: 'short' });
            if (last7DaysV[label] !== undefined) {
              if (type === 'view') {
                 last7DaysV[label] += 1;
              } else if (type === 'pdf_view') {
                 last7DaysP[label] += 1;
              }
            }
          }
        });

        setTotalViews(vCount);
        setPdfOpens(pCount);
        setBookmarks(bCount);

        setLineDataViews(Object.keys(last7DaysV).map(key => ({
          value: last7DaysV[key],
          label: key,
          labelTextStyle: {color: '#94A3B8', fontSize: 10},
        })));
        
        setLineDataPDFs(Object.keys(last7DaysP).map(key => ({
          value: last7DaysP[key]
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
          <Text style={styles.heroValue}>{totalViews}</Text>
          <View style={styles.trendRow}>
             <Ionicons name="eye" size={16} color="#A5B4FC" />
             <Text style={styles.trendText}>Overall Page Views</Text>
          </View>
        </View>
        <View style={styles.heroIconCircle}>
           <Ionicons name="cellular" size={30} color="#fff" />
        </View>
      </View>

      {/* Sub Stats Row */}
      <View style={styles.subStatsRow}>
        <View style={styles.smallCard}>
           <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
             <Text style={styles.smallLabel}>Deck Opens</Text>
             <Ionicons name="document-text" size={16} color="#10B981" />
           </View>
           <Text style={styles.smallValue}>{pdfOpens}</Text>
        </View>
        <View style={styles.smallCard}>
           <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
             <Text style={styles.smallLabel}>Bookmarks</Text>
             <Ionicons name="bookmark" size={16} color="#F59E0B" />
           </View>
           <Text style={styles.smallValue}>{bookmarks}</Text>
        </View>
      </View>

      {/* Modern Chart Card */}
      <View style={styles.chartWrapper}>
        <Text style={styles.chartTitle}>Engagement Trends</Text>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#4F46E5'}]}/><Text style={styles.legendText}>Views</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#3B82F6'}]}/><Text style={styles.legendText}>PDFs</Text></View>
        </View>
        
        <LineChart
          data={lineDataViews}
          data2={lineDataPDFs}
          color1="#4F46E5"
          color2="#3B82F6"
          thickness1={3}
          thickness2={3}
          curved
          isAnimated
          hideRules
          yAxisThickness={0}
          xAxisThickness={0}
          height={160}
          width={screenWidth - 100}
          initialSpacing={10}
          spacing={ (screenWidth - 100) / 7 }
          dataPointsColor1="#4F46E5"
          dataPointsColor2="#3B82F6"
        />
      </View>

      <Text style={styles.listHeader}>Recent Activity</Text>
    </View>
  );

  const getIconForType = (type) => {
    switch(type) {
       case 'pdf_view': return "document-text";
       case 'bookmark': return "bookmark";
       default: return "eye";
    }
  };

  const getColorForType = (type) => {
    switch(type) {
       case 'pdf_view': return "#10B981";
       case 'bookmark': return "#F59E0B";
       default: return "#4F46E5";
    }
  };

  if (loading) return <ActivityIndicator style={{flex:1}} color="#4F46E5" />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={views}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const typeColor = getColorForType(item.type);
          return (
            <View style={styles.viewRow}>
              <View style={[styles.avatar, {backgroundColor: typeColor + '20'}]}>
                <Ionicons name={getIconForType(item.type)} size={20} color={typeColor} />
              </View>
              <View style={{flex:1, marginLeft: 15}}>
                <Text style={styles.name}>{item.investorName}</Text>
                <Text style={styles.time}>
                  {item.type === 'pdf_view' ? 'Opened Pitch Deck' : item.type === 'bookmark' ? 'Bookmarked Pitch' : 'Viewed Pitch'} • {item.viewedAt?.toDate().toLocaleDateString()}
                </Text>
              </View>
            </View>
          );
        }}
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
  trendText: { color: '#A5B4FC', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
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