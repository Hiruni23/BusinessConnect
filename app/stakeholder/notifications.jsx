import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export default function StakeholderNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const { theme: T, isDark } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(list);
      setLoading(false);
    }, (error) => {
      console.error("Stakeholder Notification Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const renderNotification = ({ item, index }) => {
    const isSuccess = item.type === "ACCEPTANCE" || item.type === "INTEREST_CONFIRMED";
    
    return (
      <Animated.View entering={FadeInDown.delay(100 + index * 100).springify()}>
        <TouchableOpacity
          style={[s.notifCard, !item.isRead && s.unreadCard]}
          onPress={() => markAsRead(item.id)}
          activeOpacity={0.7}
        >
        <View style={[s.iconCircle, { backgroundColor: isSuccess ? (isDark ? 'rgba(52,211,153,0.1)' : '#ECFDF5') : (isDark ? 'rgba(96,165,250,0.1)' : '#F1F5F9') }]}>
          <Ionicons 
            name={isSuccess ? "checkmark-circle" : "notifications-outline"} 
            size={24} 
            color={isSuccess ? (isDark ? '#34D399' : '#10B981') : (isDark ? '#60A5FA' : '#4F46E5')} 
          />
        </View>

        <View style={s.textContainer}>
          <Text style={s.notifTitle} numberOfLines={1}>{item.pitchTitle || "Oversight Update"}</Text>
          <Text style={s.notifMessage}>{item.message}</Text>
          <Text style={s.notifTime}>
            {item.createdAt?.seconds 
              ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() 
              : "Just now"}
          </Text>
        </View>

        {!item.isRead && <View style={s.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
          <Text style={s.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={T.accent} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyState}>
                <View style={s.emptyIconCircle}>
                   <Ionicons name="notifications-off-outline" size={40} color={T.subtext} />
                </View>
                <Text style={s.emptyTextTitle}>All Caught Up!</Text>
                <Text style={s.emptyTextSub}>No new notifications for your review.</Text>
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
      backgroundColor: "transparent",
    },
    headerTitle: { 
      fontSize: 20, 
      fontWeight: "900", 
      color: T.text,
      fontFamily: 'outfit-bold',
      letterSpacing: 0.5 
    },
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
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    listContent: { padding: 20 },
    notifCard: {
      flexDirection: "row",
      backgroundColor: T.glassBg,
      padding: 16,
      borderRadius: 24,
      marginBottom: 12,
      alignItems: "center",
      elevation: 4,
      shadowColor: T.accent,
      shadowOpacity: 0.05,
      shadowRadius: 15,
      borderWidth: 1,
      borderColor: T.glassBorder
    },
    unreadCard: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.05)' : "#F8FAFF",
      borderLeftWidth: 4,
      borderLeftColor: T.accent,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    textContainer: { flex: 1, marginLeft: 16 },
    notifTitle: { 
      fontSize: 16, 
      fontWeight: "800", 
      color: T.text,
      fontFamily: 'outfit-bold'
    },
    notifMessage: { 
      fontSize: 14, 
      color: T.subtext, 
      marginTop: 4,
      fontFamily: 'outfit-medium',
      lineHeight: 20
    },
    notifTime: { 
      fontSize: 12, 
      color: T.subtext, 
      marginTop: 10,
      fontFamily: 'outfit-medium'
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: T.accent,
      marginLeft: 10,
    },
    emptyState: { alignItems: "center", marginTop: 100 },
    emptyIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isDark ? 'rgba(148,163,184,0.1)' : '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20
    },
    emptyTextTitle: {
      fontSize: 20,
      fontFamily: 'outfit-bold',
      color: T.text,
      fontWeight: '800',
      letterSpacing: 0.5
    },
    emptyTextSub: {
      color: T.subtext,
      fontSize: 15,
      fontFamily: 'outfit-medium',
      marginTop: 8,
      textAlign: 'center'
    },
  });
}
