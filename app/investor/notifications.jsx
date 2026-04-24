import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
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

export default function InvestorNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

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

    // Fetch notifications where the current investor is the recipient
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
      console.error("Notification Listener Error:", error);
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

  const renderNotification = ({ item }) => {
    const isInterest = item.type === "INTEREST_CONFIRMED";
    
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.unreadCard]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={[styles.iconCircle, { backgroundColor: isInterest ? "#ECFDF5" : "#EEF2FF" }]}>
          <Ionicons 
            name={isInterest ? "checkmark-circle" : "notifications"} 
            size={24} 
            color={isInterest ? "#10B981" : "#4F46E5"} 
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.notifTitle}>{item.pitchTitle || "Update"}</Text>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
    backgroundColor: "#FFF",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  backBtn: { padding: 5 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 20 },
  notifCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  unreadCard: {
    backgroundColor: "#F0F7FF",
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { flex: 1, marginLeft: 15 },
  notifTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  notifMessage: { fontSize: 14, color: "#64748B", marginTop: 2 },
  notifTime: { fontSize: 12, color: "#94A3B8", marginTop: 8 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4F46E5",
  },
  emptyState: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 10, color: "#94A3B8", fontSize: 16 },
});