import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Calendar } from "react-native-calendars";
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  where,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function FiscalCalendar() {
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState({ meetings: [], milestones: [] });
  const [markedDates, setMarkedDates] = useState({});

  const convertToDateKey = (dateStr) => {
    try {
        if (!dateStr) return null;
        // Simple regex to check if it's already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        
        // If it's a JS date string or custom string, attempt parsing
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        
        return new Date().toISOString().split('T')[0];
    } catch { return null; }
  };

  useEffect(() => {
    if (!user) return;

    // Listen to Meetings
    const qMeetings = query(collection(db, "meetings"), where("stakeholderId", "==", user.uid));
    const unsubMeetings = onSnapshot(qMeetings, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, type: 'meeting', ...doc.data() }));
      setEvents(prev => ({ ...prev, meetings: list }));
    });

    // Listen to Milestones across all projects
    // For now, we fetch all milestones that are "ongoing" or "completed"
    const qMilestones = query(collection(db, "milestones"));
    const unsubMilestones = onSnapshot(qMilestones, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, type: 'milestone', ...doc.data() }));
      setEvents(prev => ({ ...prev, milestones: list }));
    });

    return () => {
      unsubMeetings();
      unsubMilestones();
    };
  }, [user]);

  // Transform events into markedDates for the calendar
  useEffect(() => {
    const marks = {};

    // 1. Mark Meetings (Blue)
    events.meetings.forEach(m => {
        // Assuming dateString is "Oct 24, 2:00 PM" or similar. 
        // In a real app we'd use ISO dates. Let's try to parse or use a fallback.
        const dateKey = m.dateString ? convertToDateKey(m.dateString) : null;
        if (dateKey) {
            marks[dateKey] = { 
                ...(marks[dateKey] || {}), 
                dots: [...(marks[dateKey]?.dots || []), { key: `meeting-${m.id}`, color: '#4F46E5', selectedDotColor: '#fff' }]
            };
        }
    });

    // 2. Mark Milestones (Green/Orange)
    events.milestones.forEach(ms => {
        const dateKey = ms.updatedAt?.toDate ? ms.updatedAt.toDate().toISOString().split('T')[0] : null;
        if (dateKey) {
            const dotColor = ms.status === 'completed' ? '#F59E0B' : (ms.status === 'approved' ? '#10B981' : '#64748B');
            marks[dateKey] = { 
                ...(marks[dateKey] || {}), 
                dots: [...(marks[dateKey]?.dots || []), { key: `ms-${ms.id}`, color: dotColor, selectedDotColor: '#fff' }]
            };
        }
    });

    // Ensure selected date is highlighted
    if (marks[selectedDate]) {
        marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#4F46E5' };
    } else {
        marks[selectedDate] = { selected: true, selectedColor: '#4F46E5' };
    }

    setMarkedDates(marks);
    setLoading(false);
  }, [events, selectedDate]);

  // Helper to find events for the selected day
  const dailyAgenda = useMemo(() => {
    const dayMeetings = events.meetings.filter(m => convertToDateKey(m.dateString) === selectedDate);
    const dayMilestones = events.milestones.filter(ms => {
        const key = ms.updatedAt?.toDate ? ms.updatedAt.toDate().toISOString().split('T')[0] : null;
        return key === selectedDate;
    });
    return [...dayMeetings, ...dayMilestones];
  }, [events, selectedDate]);


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fiscal Roadmap</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={day => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            markingType={'multi-dot'}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#4F46E5',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#4F46E5',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#4F46E5',
              selectedDotColor: '#ffffff',
              arrowColor: '#4F46E5',
              monthTextColor: '#1E293B',
              indicatorColor: '#4F46E5',
              textDayFontFamily: 'outfit-medium',
              textMonthFontFamily: 'outfit-bold',
              textDayHeaderFontFamily: 'outfit-bold',
              textDayFontSize: 14,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 12
            }}
          />
        </View>

        <View style={styles.agendaHeader}>
            <Text style={styles.agendaTitle}>Agenda: {selectedDate}</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{dailyAgenda.length} Items</Text>
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.agendaList} showsVerticalScrollIndicator={false}>
          {dailyAgenda.length === 0 ? (
              <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No events scheduled for this day</Text>
              </View>
          ) : (
            dailyAgenda.map((item, idx) => (
                <TouchableOpacity 
                    key={item.id + idx} 
                    style={styles.eventCard}
                    onPress={() => item.pitchId && router.push({ pathname: "/stakeholder/pitch-details", params: { id: item.pitchId } })}
                >
                    <View style={[styles.eventBar, { backgroundColor: item.type === 'meeting' ? '#4F46E5' : '#10B981' }]} />
                    <View style={styles.eventInfo}>
                        <Text style={styles.eventTime}>{item.dateString || 'Governance Timeline'}</Text>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text style={styles.eventSub}>{item.entrepreneurName || 'System Milestone'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 20, fontFamily: 'outfit-bold', fontWeight: '900', color: '#1E293B' },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  calendarCard: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', elevation: 4, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  agendaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  agendaTitle: { fontSize: 16, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800' },
  badge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#4F46E5', fontSize: 11, fontFamily: 'outfit-bold', fontWeight: '900' },
  agendaList: { paddingHorizontal: 20, paddingBottom: 40 },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 10, elevation: 2 },
  eventBar: { width: 4, height: '100%', borderRadius: 2 },
  eventInfo: { flex: 1, marginLeft: 15 },
  eventTime: { fontSize: 11, fontFamily: 'outfit-bold', color: '#94A3B8', textTransform: 'uppercase' },
  eventTitle: { fontSize: 15, fontFamily: 'outfit-bold', color: '#1E293B', fontWeight: '800', marginTop: 2 },
  eventSub: { fontSize: 13, fontFamily: 'outfit-medium', color: '#64748B', marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { marginTop: 10, fontFamily: 'outfit-medium', color: '#64748B' }
});
