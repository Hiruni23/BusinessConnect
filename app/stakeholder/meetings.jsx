import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Calendar from 'expo-calendar';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export default function StakeholderMeetings() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "meetings"),
      where("stakeholderId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort manually to avoid index requirement
      const sorted = list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMeetings(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);


  const handleStatusUpdate = async (id, status) => {
    try {
      await updateDoc(doc(db, "meetings", id), { status });
    } catch (e) {
        console.error(e);
    }
  };

  const addToCalendar = async (item) => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      let calendarId = calendars.find(c => c.title === 'BusinessConnect')?.id;

      if (!calendarId) {
        // Create a new calendar if it doesn't exist (Android needs more details)
        const defaultCalendarSource = Platform.OS === 'ios'
          ? await Calendar.getDefaultCalendarSourceAsync()
          : { name: 'BusinessConnect', type: 'LOCAL' };
        
        calendarId = await Calendar.createCalendarAsync({
          title: 'BusinessConnect',
          color: T.accent,
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: defaultCalendarSource.id,
          source: defaultCalendarSource,
          name: 'businessconnect',
          ownerAccount: 'personal',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
      }

      const startDate = item.scheduledAt.toDate();
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

      await Calendar.createEventAsync(calendarId, {
        title: `BC Session: ${item.title}`,
        startDate,
        endDate,
        location: item.meetingLink || "TBD",
        notes: `Meeting with ${item.entrepreneurName}. Link: ${item.meetingLink || "None"}`,
      });

      Alert.alert("Success", "Event added to your calendar!");
    } else {
      Alert.alert("Permission Denied", "We need calendar access to add meetings.");
    }
  };


  const renderMeeting = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(100 + index * 100).springify()} style={s.meetingCard}>
      <View style={s.meetingInfo}>
        <View style={s.avatar}>
           <Text style={s.avatarText}>{item.entrepreneurName?.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={s.meetingTitle}>{item.title}</Text>
            <Text style={s.entrepreneurName}>Founder: {item.entrepreneurName}</Text>
            <View style={s.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={T.subtext} />
                <Text style={s.meetingDate}>{item.dateString}</Text>
            </View>
        </View>
        <View style={[s.statusBadge, { backgroundColor: item.status === 'completed' ? (isDark ? 'rgba(52,211,153,0.1)' : '#ECFDF5') : (isDark ? 'rgba(59, 130, 246, 0.1)' : '#EEF2FF') }]}>
            <Text style={[s.statusText, { color: item.status === 'completed' ? (isDark ? '#34D399' : '#10B981') : T.accent }]}>
                {item.status?.toUpperCase()}
            </Text>
        </View>
      </View>
      <View style={s.cardActions}>
        <TouchableOpacity 
            style={[s.smallBtn, { backgroundColor: T.glassBg, borderWidth: 1, borderColor: T.glassBorder }]}
            onPress={() => addToCalendar(item)}
        >
            <Ionicons name="calendar-outline" size={14} color={T.subtext} />
        </TouchableOpacity>

        {item.meetingLink ? (
            <TouchableOpacity 
                style={[s.smallBtn, { backgroundColor: T.accent, flexDirection: 'row', gap: 6 }]}
                onPress={() => {
                    Linking.canOpenURL(item.meetingLink).then(supported => {
                        if (supported) {
                            Linking.openURL(item.meetingLink);
                        } else {
                            Alert.alert("Invalid Link", "This meeting link is not valid.");
                        }
                    });
                }}
            >
                <Ionicons name="videocam" size={14} color="#fff" />
                <Text style={s.smallBtnText}>Join Session</Text>
            </TouchableOpacity>
        ) : null}

        {item.status === 'scheduled' && (
            <TouchableOpacity 
                style={[s.smallBtn, { backgroundColor: T.accentB }]}
                onPress={() => handleStatusUpdate(item.id, 'completed')}
            >
                <Text style={s.smallBtnText}>Complete</Text>
            </TouchableOpacity>
        )}
        <TouchableOpacity 
            style={[s.smallBtn, { backgroundColor: T.surface2 }]}
            onPress={() => {
                Alert.alert("Confirm", "Delete this session?", [
                    { text: "Cancel" },
                    { text: "Delete", onPress: () => deleteDoc(doc(db, "meetings", item.id)), style: 'destructive' }
                ])
            }}
        >
            <Text style={[s.smallBtnText, { color: '#EF4444' }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const s = makeStyles(T, isDark);

  return (
    <View style={s.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
      <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
                <Ionicons name="arrow-back" size={24} color={T.text} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Meeting Sessions</Text>
            <TouchableOpacity onPress={() => router.push("/stakeholder/schedule-meeting")} style={s.headerBtn}>
                <Ionicons name="add" size={24} color={T.accent} />
            </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color={T.accent} />
        ) : (
          <FlatList
            data={meetings}
            keyExtractor={(item) => item.id}
            renderItem={renderMeeting}
            contentContainerStyle={s.listPadding}
            ListEmptyComponent={
                <View style={s.emptyState}>
                    <Ionicons name="calendar-outline" size={60} color={T.subtext} />
                    <Text style={s.emptyTitle}>No Sessions Scheduled</Text>
                    <Text style={s.emptySub}>Start meeting startups by scheduling a session.</Text>
                </View>
            }
          />
        )}

      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    headerTitle: { fontSize: 20, fontFamily: 'outfit-bold', fontWeight: '900', color: T.text, letterSpacing: 0.5 },
    headerBtn: { 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: T.glassBg, 
      justifyContent: 'center', 
      alignItems: 'center',
      elevation: 4,
      shadowColor: T.accent,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    listPadding: { padding: 20 },
    meetingCard: { 
      backgroundColor: T.glassBg, 
      borderRadius: 28, 
      padding: 20, 
      marginBottom: 15,
      elevation: 4,
      shadowColor: T.accent,
      shadowOpacity: 0.05,
      shadowRadius: 15,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    meetingInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 22, fontFamily: 'outfit-bold', color: T.accent, fontWeight: '800' },
    meetingTitle: { fontSize: 16, fontFamily: 'outfit-bold', color: T.text, fontWeight: '800' },
    entrepreneurName: { fontSize: 13, fontFamily: 'outfit-medium', color: T.subtext, marginTop: 2 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    meetingDate: { fontSize: 12, fontFamily: 'outfit-bold', color: T.subtext },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontFamily: 'outfit-bold', fontWeight: '800' },
    cardActions: { flexDirection: 'row', gap: 10, marginTop: 20, borderTopWidth: 1, borderTopColor: T.border, paddingTop: 15 },
    smallBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
    smallBtnText: { color: '#fff', fontSize: 12, fontFamily: 'outfit-bold', fontWeight: '800' },
    
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontFamily: 'outfit-bold', color: T.text, fontWeight: '800', marginTop: 20 },
    emptySub: { fontSize: 14, fontFamily: 'outfit-medium', color: T.subtext, marginTop: 8, textAlign: 'center' }
  });
}
