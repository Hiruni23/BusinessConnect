import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function InvestorInbox() {
  const [recentChats, setRecentChats] = useState([]);
  const [connections, setConnections] = useState([]);
  const user = auth.currentUser;
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const qChats = query(
      collection(db, "chats"),
      where("investorId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(qChats, (snapshot) => {
      setRecentChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qConn = query(
      collection(db, "connections"),
      where("toUserId", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsubConn = onSnapshot(qConn, (snapshot) => {
      setConnections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubConn();
    };
  }, [user]);

  const handleAcceptConnection = async (connId, entrepreneurId) => {
    try {
      await updateDoc(doc(db, "connections", connId), { status: "accepted" });
      
      await addDoc(collection(db, "chats"), {
        entrepreneurId: entrepreneurId,
        investorId: user.uid,
        updatedAt: serverTimestamp(),
        unreadBy: [],
        lastMessage: "Connection accepted! You can now chat.",
        investorEmail: user.email || "Investor"
      });
    } catch (err) {
      console.error("Error accepting connection:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Messages</Text>
      
      {connections.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", marginBottom: 10, color: "#64748B", textTransform: 'uppercase' }}>Connection Requests</Text>
          {connections.map((conn) => (
            <View key={conn.id} style={[styles.chatItem, { borderColor: '#10B981', borderWidth: 1 }]}>
              <View style={styles.iconBg}>
                <Ionicons name="person-add" size={20} color="#047857" />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.title}>Entrepreneur</Text>
                <Text style={styles.msg} numberOfLines={1}>Wants to connect</Text>
              </View>
              <TouchableOpacity 
                style={{ backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                onPress={() => handleAcceptConnection(conn.id, conn.fromUserId)}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={recentChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chatItem} 
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <View style={styles.iconBg}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#047857" />
              {item.unreadBy?.includes(user.uid) && <View style={styles.dot} />}
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.title}>{item.pitchTitle || "Inquiry"}</Text>
              <Text style={styles.msg} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  header: { fontSize: 24, fontWeight: '900', marginBottom: 20, marginTop: 40, color: '#064E3B' },
  chatItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 10, alignItems: 'center', elevation: 2 },
  iconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  dot: { position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#fff' },
  title: { fontSize: 16, fontWeight: '800' },
  msg: { color: '#64748B', marginTop: 2 }
});