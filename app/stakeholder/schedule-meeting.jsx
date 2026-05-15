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
import Animated, { FadeInDown } from "react-native-reanimated";
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
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function ScheduleMeeting() {
  const router = useRouter();
  const user = auth.currentUser;
  const { theme: T, isDark } = useTheme();

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

  const s = makeStyles(T, isDark);

  return (
    <View style={s.container}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
      <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ['#FDFDFD', '#F8FAFC']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Schedule Session</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={s.scrollBody} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={s.sectionTitle}>1. Executive Goal</Text>
            <View style={s.inputCard}>
              <TextInput 
                style={s.textInput}
                placeholder="Ex: Technical Audit, Fiscal Review..."
                placeholderTextColor={T.subtext}
              value={meetingTitle}
              onChangeText={setMeetingTitle}
            />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={s.sectionTitle}>2. Select Foundation</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.founderScroll}>
              {entrepreneurs.map((e, index) => (
                  <Animated.View entering={FadeInDown.delay(300 + index * 50).springify()} key={e.id}>
                    <TouchableOpacity 
                        style={[s.founderCard, selectedEntrepreneur?.id === e.id && s.activeFounder]}
                        onPress={() => setSelectedEntrepreneur(e)}
                    >
                    <View style={[s.avatar, selectedEntrepreneur?.id === e.id && { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#fff' }]}>
                        <Text style={[s.avatarText, selectedEntrepreneur?.id === e.id && { color: isDark ? '#fff' : T.accent }]}>
                            {e.fullName?.charAt(0) || "F"}
                        </Text>
                    </View>
                    <Text style={[s.founderName, selectedEntrepreneur?.id === e.id && { color: '#fff' }]} numberOfLines={1}>
                        {e.fullName || "Founder"}
                    </Text>
                    <Text style={[s.founderSub, selectedEntrepreneur?.id === e.id && { color: 'rgba(255,255,255,0.7)' }]}>
                        {e.role || "Entrepreneur"}
                    </Text>
                    </TouchableOpacity>
                  </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={s.sectionTitle}>3. Temporal Window</Text>
            <View style={s.timeContainer}>
               <TouchableOpacity style={s.dateTimeField} onPress={() => showMode('date')}>
                  <Ionicons name="calendar-outline" size={20} color={T.accent} />
                <View style={s.dateTimeText}>
                    <Text style={s.dtLabel}>DATE</Text>
                    <Text style={s.dtValue}>{formatDate(date)}</Text>
                </View>
               </TouchableOpacity>

               <TouchableOpacity style={s.dateTimeField} onPress={() => showMode('time')}>
                  <Ionicons name="time-outline" size={20} color={T.accent} />
                  <View style={s.dateTimeText}>
                    <Text style={s.dtLabel}>TIME</Text>
                    <Text style={s.dtValue}>{formatTime(date)}</Text>
                  </View>
               </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.sectionTitle}>4. Virtual Connection</Text>
              <TouchableOpacity onPress={() => {
                const room = `businessconnect-pitch-${Math.random().toString(36).substring(7)}`;
                setMeetingLink(`https://meet.jit.si/${room}`);
              }}>
                <Text style={[s.sectionTitle, { color: T.accent, marginTop: 0 }]}>GENERATE BC LINK</Text>
              </TouchableOpacity>
            </View>
            <View style={s.inputCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="link-outline" size={20} color={T.accent} />
                <TextInput 
                  style={[s.textInput, { flex: 1 }]}
                  placeholder="Zoom or Google Meet link..."
                  placeholderTextColor={T.subtext}
                  value={meetingLink}
                  onChangeText={setMeetingLink}
                  autoCapitalize="none"
              />
              </View>
            </View>
            <Text style={s.hintText}>Leave empty if meeting in-person or use the generator for a secure BC Pitch room.</Text>
          </Animated.View>

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

          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <TouchableOpacity style={s.submitBtn} onPress={handleSchedule}>
              <LinearGradient colors={isDark ? ['#3B82F6', '#1E3A8A'] : ['#2563EB', '#1E40AF']} style={s.btnGradient}>
                  <Text style={s.submitText}>CONFIRM SESSION</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: T.glassBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.glassBorder },
    headerTitle: { fontSize: 18, fontWeight: '900', color: T.text, letterSpacing: 0.5 },
    scrollBody: { padding: 25 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: T.subtext, letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },
    inputCard: { backgroundColor: T.glassBg, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: T.glassBorder, marginBottom: 25 },
    textInput: { fontSize: 16, fontWeight: '700', color: T.text },
    
    founderScroll: { marginBottom: 25, marginHorizontal: -25, paddingHorizontal: 25 },
    founderCard: { width: 120, height: 140, borderRadius: 24, backgroundColor: T.glassBg, padding: 15, marginRight: 15, borderWidth: 1, borderColor: T.glassBorder, alignItems: 'center', justifyContent: 'center' },
    activeFounder: { backgroundColor: T.accent, borderColor: T.accent },
    avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 20, fontWeight: '900', color: T.accent },
    founderName: { fontSize: 13, fontWeight: '800', color: T.text },
    founderSub: { fontSize: 10, color: T.subtext, marginTop: 4, fontWeight: '600' },

    timeContainer: { flexDirection: 'row', gap: 12, marginBottom: 40 },
    dateTimeField: { flex: 1, height: 75, backgroundColor: T.glassBg, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: T.glassBorder, flexDirection: 'row', alignItems: 'center', gap: 12 },
    dateTimeText: { flex: 1 },
    dtLabel: { fontSize: 8, fontWeight: '900', color: T.subtext, letterSpacing: 1 },
    dtValue: { fontSize: 14, fontWeight: '800', color: T.text, marginTop: 4 },

    submitBtn: { height: 65, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: T.accent, shadowOpacity: 0.3, shadowRadius: 15 },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    submitText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
    hintText: { fontSize: 11, color: T.subtext, fontStyle: 'italic', marginTop: -15, marginBottom: 25, paddingHorizontal: 5 }
  });
}
