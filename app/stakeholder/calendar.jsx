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
import Animated, { FadeInDown } from "react-native-reanimated";
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
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function FiscalCalendar() {
  const router = useRouter();
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();

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
                dots: [...(marks[dateKey]?.dots || []), { key: `meeting-${m.id}`, color: T.accent, selectedDotColor: '#fff' }]
            };
        }
    });

    // 2. Mark Milestones (Green/Orange)
    events.milestones.forEach(ms => {
        const dateKey = ms.updatedAt?.toDate ? ms.updatedAt.toDate().toISOString().split('T')[0] : null;
        if (dateKey) {
            const dotColor = ms.status === 'completed' ? (isDark ? '#FBBF24' : '#F59E0B') : (ms.status === 'approved' ? (isDark ? '#34D399' : '#10B981') : T.subtext);
            marks[dateKey] = { 
                ...(marks[dateKey] || {}), 
                dots: [...(marks[dateKey]?.dots || []), { key: `ms-${ms.id}`, color: dotColor, selectedDotColor: '#fff' }]
            };
        }
    });

    // Ensure selected date is highlighted
    if (marks[selectedDate]) {
        marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: T.accent };
    } else {
        marks[selectedDate] = { selected: true, selectedColor: T.accent };
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


  const s = makeStyles(T, isDark);

  return (
    <View style={s.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
      <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Fiscal Roadmap</Text>
          <View style={{ width: 44 }} />
        </View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.calendarCard}>
          <Calendar
            onDayPress={day => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            markingType={'multi-dot'}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: T.subtext,
              selectedDayBackgroundColor: T.accent,
              selectedDayTextColor: '#ffffff',
              todayTextColor: T.accent,
              dayTextColor: T.text,
              textDisabledColor: T.border,
              dotColor: T.accent,
              selectedDotColor: '#ffffff',
              arrowColor: T.accent,
              monthTextColor: T.text,
              indicatorColor: T.accent,
              textDayFontFamily: 'outfit-medium',
              textMonthFontFamily: 'outfit-bold',
              textDayHeaderFontFamily: 'outfit-bold',
              textDayFontSize: 14,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 12
            }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={s.agendaHeader}>
            <Text style={s.agendaTitle}>Agenda: {selectedDate}</Text>
            <View style={s.badge}>
                <Text style={s.badgeText}>{dailyAgenda.length} Items</Text>
            </View>
        </Animated.View>

        <ScrollView contentContainerStyle={s.agendaList} showsVerticalScrollIndicator={false}>
          {dailyAgenda.length === 0 ? (
              <View style={s.emptyState}>
                  <Ionicons name="calendar-outline" size={40} color={T.subtext} />
                  <Text style={s.emptyText}>No events scheduled for this day</Text>
              </View>
          ) : (
            dailyAgenda.map((item, idx) => (
                <Animated.View entering={FadeInDown.delay(300 + idx * 100).springify()} key={item.id + idx}>
                  <TouchableOpacity 
                      style={s.eventCard}
                      onPress={() => item.pitchId && router.push({ pathname: "/stakeholder/pitch-details", params: { id: item.pitchId } })}
                  >
                      <View style={[s.eventBar, { backgroundColor: item.type === 'meeting' ? T.accent : (isDark ? '#34D399' : '#10B981') }]} />
                      <View style={s.eventInfo}>
                          <Text style={s.eventTime}>{item.dateString || 'Governance Timeline'}</Text>
                          <Text style={s.eventTitle}>{item.title}</Text>
                          <Text style={s.eventSub}>{item.entrepreneurName || 'System Milestone'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={T.subtext} />
                  </TouchableOpacity>
                </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    headerTitle: { fontSize: 20, fontFamily: 'outfit-bold', fontWeight: '900', color: T.text, letterSpacing: 0.5 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: T.glassBg, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: T.accent, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: T.glassBorder },
    calendarCard: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', elevation: 6, backgroundColor: T.glassBg, shadowColor: T.accent, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1, borderColor: T.glassBorder },
    agendaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
    agendaTitle: { fontSize: 16, fontFamily: 'outfit-bold', color: T.text, fontWeight: '800', letterSpacing: 0.5 },
    badge: { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: T.accent, fontSize: 11, fontFamily: 'outfit-bold', fontWeight: '900' },
    agendaList: { paddingHorizontal: 20, paddingBottom: 40 },
    eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.glassBg, borderRadius: 20, padding: 15, marginBottom: 10, elevation: 4, shadowColor: T.accent, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: T.glassBorder },
    eventBar: { width: 4, height: '100%', borderRadius: 2 },
    eventInfo: { flex: 1, marginLeft: 15 },
    eventTime: { fontSize: 11, fontFamily: 'outfit-bold', color: T.subtext, textTransform: 'uppercase' },
    eventTitle: { fontSize: 15, fontFamily: 'outfit-bold', color: T.text, fontWeight: '800', marginTop: 2 },
    eventSub: { fontSize: 13, fontFamily: 'outfit-medium', color: T.subtext, marginTop: 2 },
    emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
    emptyText: { marginTop: 10, fontFamily: 'outfit-medium', color: T.subtext }
  });
}
