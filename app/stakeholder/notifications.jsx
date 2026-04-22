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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function StakeholderNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
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
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const renderNotification = ({ item }) => {
    const isSuccess = item.type === "ACCEPTANCE" || item.type === "INTEREST_CONFIRMED";
    
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.unreadCard]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: isSuccess ? "#ECFDF5" : "#F1F5F9" }]}>
          <Ionicons 
            name={isSuccess ? "checkmark-circle" : "notifications-outline"} 
            size={24} 
            color={isSuccess ? "#10B981" : "#4F46E5"} 
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.notifTitle} numberOfLines={1}>{item.pitchTitle || "Oversight Update"}</Text>
          <Text style={styles.notifMessage}>{item.message}</Text>
          <Text style={styles.notifTime}>
            {item.createdAt?.seconds 
              ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() 
              : "Just now"}
          </Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                   <Ionicons name="notifications-off-outline" size={40} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTextTitle}>All Caught Up!</Text>
                <Text style={styles.emptyTextSub}>No new notifications for your review.</Text>
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
    color: "#1E293B",
    fontFamily: 'outfit-bold',
    letterSpacing: -0.5 
  },
  headerBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 20 },
  notifCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  unreadCard: {
    backgroundColor: "#F8FAFF",
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
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
    color: "#1E293B",
    fontFamily: 'outfit-bold'
  },
  notifMessage: { 
    fontSize: 14, 
    color: "#64748B", 
    marginTop: 4,
    fontFamily: 'outfit-medium',
    lineHeight: 20
  },
  notifTime: { 
    fontSize: 12, 
    color: "#94A3B8", 
    marginTop: 10,
    fontFamily: 'outfit-medium'
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4F46E5",
    marginLeft: 10,
  },
  emptyState: { alignItems: "center", marginTop: 100 },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  emptyTextTitle: {
    fontSize: 20,
    fontFamily: 'outfit-bold',
    color: '#1E293B',
    fontWeight: '800'
  },
  emptyTextSub: {
    color: "#94A3B8",
    fontSize: 15,
    fontFamily: 'outfit-medium',
    marginTop: 8,
    textAlign: 'center'
  },
});
