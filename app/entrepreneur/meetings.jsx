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
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Calendar from 'expo-calendar';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

export default function EntrepreneurMeetings() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "meetings"),
      where("entrepreneurId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort manually
      const sorted = list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMeetings(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addToCalendar = async (item) => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      let calendarId = calendars.find(c => c.title === 'BusinessConnect')?.id;

      if (!calendarId) {
        const defaultCalendarSource = Platform.OS === 'ios'
          ? await Calendar.getDefaultCalendarSourceAsync()
          : { name: 'BusinessConnect', type: 'LOCAL' };
        
        calendarId = await Calendar.createCalendarAsync({
          title: 'BusinessConnect',
          color: '#4F46E5',
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: defaultCalendarSource.id,
          source: defaultCalendarSource,
          name: 'businessconnect',
          ownerAccount: 'personal',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
      }

      const startDate = item.scheduledAt.toDate();
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      await Calendar.createEventAsync(calendarId, {
        title: `BC Session: ${item.title}`,
        startDate,
        endDate,
        location: item.meetingLink || "TBD",
        notes: `Meeting with ${item.stakeholderName}. Link: ${item.meetingLink || "None"}`,
      });

      Alert.alert("Success", "Event added to your calendar!");
    } else {
      Alert.alert("Permission Denied", "We need calendar access to add meetings.");
    }
  };

  const handleJoin = (link) => {
    if (!link) return;
    Linking.canOpenURL(link).then(supported => {
      if (supported) {
        Linking.openURL(link);
      } else {
        Alert.alert("Invalid Link", "This meeting link is not valid.");
      }
    });
  };

  const renderMeeting = ({ item }) => (
    <View style={styles.meetingCard}>
      <View style={styles.meetingInfo}>
        <View style={styles.avatar}>
           <Ionicons name="person-outline" size={24} color="#4F46E5" />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.meetingTitle}>{item.title}</Text>
            <Text style={styles.stakeholderName}>Host: {item.stakeholderName}</Text>
            <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={styles.meetingDate}>{item.dateString}</Text>
            </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#ECFDF5' : '#EEF2FF' }]}>
            <Text style={[styles.statusText, { color: item.status === 'completed' ? '#10B981' : '#4F46E5' }]}>
                {item.status?.toUpperCase()}
            </Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
            style={[styles.smallBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]}
            onPress={() => addToCalendar(item)}
        >
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
        </TouchableOpacity>

        {item.meetingLink ? (
            <TouchableOpacity 
                style={[styles.smallBtn, { backgroundColor: '#6366F1', flexDirection: 'row', gap: 6 }]}
                onPress={() => handleJoin(item.meetingLink)}
            >
                <Ionicons name="videocam" size={14} color="#fff" />
                <Text style={styles.smallBtnText}>Join Session</Text>
            </TouchableOpacity>
        ) : (
            <View style={[styles.smallBtn, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.smallBtnText, { color: '#94A3B8' }]}>No Link Provided</Text>
            </View>
        )}
        
        <View style={{ flex: 1 }} />
        
        <View style={styles.infoBadge}>
            <Ionicons name="shield-checkmark-outline" size={12} color="#10B981" />
            <Text style={styles.infoBadgeText}>Verified Session</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Meeting Sessions</Text>
            <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color="#4F46E5" />
        ) : (
          <FlatList
            data={meetings}
            keyExtractor={(item) => item.id}
            renderItem={renderMeeting}
            contentContainerStyle={styles.listPadding}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={60} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>No Sessions Found</Text>
                    <Text style={styles.emptySub}>Your meetings with stakeholders will appear here.</Text>
                </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  listPadding: { padding: 20 },
  meetingCard: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, marginBottom: 15, elevation: 3 },
  meetingInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  meetingTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  stakeholderName: { fontSize: 13, color: '#64748B', marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  meetingDate: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  infoBadgeText: { fontSize: 10, fontWeight: '800', color: '#10B981' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
});
