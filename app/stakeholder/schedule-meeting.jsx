import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

export default function ScheduleMeeting() {
  const router = useRouter();
  const user = auth.currentUser;

  // Form State
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState(null);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  
  // DateTime Picker State
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fetchEntrepreneurs = async () => {
      const q = query(collection(db, "users"), where("role", "in", ["entrepreneur", "Entrepreneur"]));
      const snap = await getDocs(q);
      setEntrepreneurs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchEntrepreneurs();
  }, []);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(false);
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const formatDate = (d) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSchedule = async () => {
    if (!meetingTitle || !selectedEntrepreneur) {
      Alert.alert("Required", "Please set a goal and select a founder.");
      return;
    }

    try {
      const dateString = `${formatDate(date)} • ${formatTime(date)}`;
      
      await addDoc(collection(db, "meetings"), {
        stakeholderId: user.uid,
        stakeholderName: user.displayName || "Stakeholder",
        entrepreneurId: selectedEntrepreneur.id,
        entrepreneurName: selectedEntrepreneur.fullName || "Founder",
        title: meetingTitle,
        meetingLink: meetingLink || "",
        scheduledAt: date,
        dateString: dateString,
        status: "scheduled",
        createdAt: serverTimestamp(),
      });

      // Notify Entrepreneur
      await addDoc(collection(db, "notifications"), {
        userId: selectedEntrepreneur.id,
        title: "New Session Scheduled",
        message: `Meeting scheduled: ${meetingTitle} on ${dateString}`,
        type: "MEETING_SCHEDULED",
        isRead: false,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Meeting added to roadmap.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not schedule session.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#FDFDFD', '#F8FAFC']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Session</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>1. Executive Goal</Text>
          <View style={styles.inputCard}>
            <TextInput 
                style={styles.textInput}
                placeholder="Ex: Technical Audit, Fiscal Review..."
                placeholderTextColor="#94A3B8"
                value={meetingTitle}
                onChangeText={setMeetingTitle}
            />
          </View>

          <Text style={styles.sectionTitle}>2. Select Foundation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.founderScroll}>
            {entrepreneurs.map(e => (
                <TouchableOpacity 
                    key={e.id} 
                    style={[styles.founderCard, selectedEntrepreneur?.id === e.id && styles.activeFounder]}
                    onPress={() => setSelectedEntrepreneur(e)}
                >
                    <View style={[styles.avatar, selectedEntrepreneur?.id === e.id && { backgroundColor: '#fff' }]}>
                        <Text style={[styles.avatarText, selectedEntrepreneur?.id === e.id && { color: '#4F46E5' }]}>
                            {e.fullName?.charAt(0) || "F"}
                        </Text>
                    </View>
                    <Text style={[styles.founderName, selectedEntrepreneur?.id === e.id && { color: '#fff' }]} numberOfLines={1}>
                        {e.fullName || "Founder"}
                    </Text>
                    <Text style={[styles.founderSub, selectedEntrepreneur?.id === e.id && { color: 'rgba(255,255,255,0.7)' }]}>
                        {e.role || "Entrepreneur"}
                    </Text>
                </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>3. Temporal Window</Text>
          <View style={styles.timeContainer}>
             <TouchableOpacity style={styles.dateTimeField} onPress={() => showMode('date')}>
                <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
                <View style={styles.dateTimeText}>
                    <Text style={styles.dtLabel}>DATE</Text>
                    <Text style={styles.dtValue}>{formatDate(date)}</Text>
                </View>
             </TouchableOpacity>

             <TouchableOpacity style={styles.dateTimeField} onPress={() => showMode('time')}>
                <Ionicons name="time-outline" size={20} color="#4F46E5" />
                <View style={styles.dateTimeText}>
                    <Text style={styles.dtLabel}>TIME</Text>
                    <Text style={styles.dtValue}>{formatTime(date)}</Text>
                </View>
             </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>4. Virtual Connection</Text>
          <View style={styles.inputCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="link-outline" size={20} color="#6366F1" />
              <TextInput 
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Zoom or Google Meet link..."
                  placeholderTextColor="#94A3B8"
                  value={meetingLink}
                  onChangeText={setMeetingLink}
                  autoCapitalize="none"
              />
            </View>
          </View>
          <Text style={styles.hintText}>Leave empty if meeting in-person or to be decided.</Text>

          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={mode}
              is24Hour={true}
              display="default"
              onChange={onChange}
            />
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSchedule}>
            <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.btnGradient}>
                <Text style={styles.submitText}>CONFIRM SESSION</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', letterSpacing: 0.5 },
  scrollBody: { padding: 25 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },
  inputCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 25 },
  textInput: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  
  founderScroll: { marginBottom: 25, marginHorizontal: -25, paddingHorizontal: 25 },
  founderCard: { width: 120, height: 140, borderRadius: 24, backgroundColor: '#fff', padding: 15, marginRight: 15, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  activeFounder: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 20, fontWeight: '900', color: '#4F46E5' },
  founderName: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  founderSub: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: '600' },

  timeContainer: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  dateTimeField: { flex: 1, height: 75, backgroundColor: '#fff', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateTimeText: { flex: 1 },
  dtLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  dtValue: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginTop: 4 },

  submitBtn: { height: 65, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 15 },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  hintText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: -15, marginBottom: 25, paddingHorizontal: 5 }
});
