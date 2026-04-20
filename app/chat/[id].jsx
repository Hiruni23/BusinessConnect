import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from 'expo-linking'; // Added for calling and WhatsApp
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { auth, db, storage } from "../../firebaseConfig";

const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

let notificationsModulePromise = null;

const getNotificationsModule = async () => {
  if (isExpoGo) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications").then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      return Notifications;
    });
  }

  return notificationsModulePromise;
};

export default function ChatScreen() {
  const { id, title, receiverName } = useLocalSearchParams(); // id = chatId
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState(null);
  const [otherUserMobile, setOtherUserMobile] = useState(null); // State for phone number
  const [otherUserToken, setOtherUserToken] = useState(null);
  const [otherUserStatus, setOtherUserStatus] = useState("offline");
  const [lastNotifiedId, setLastNotifiedId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!id || !user) return;

    const chatRef = doc(db, "chats", id);

    // 1. Fetch Chat Metadata & identified participant info
    const unsubscribeChat = onSnapshot(
      chatRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setChatData(data);

          // CLEAR UNREAD STATUS for current user
          try {
            await updateDoc(chatRef, {
              unreadBy: arrayRemove(user.uid),
            });
          } catch (err) {
            console.error("Failed to clear unread status:", err);
          }

          // 2. Fetch the other user's mobile number for calling/WhatsApp
          const otherId = data.participants.find((p) => p !== user.uid);
          if (otherId) {
            const userDoc = await getDoc(doc(db, "users", otherId));
            if (userDoc.exists()) {
              setOtherUserMobile(userDoc.data().phoneNumber); // Ensure your field is named 'phoneNumber'
              setOtherUserToken(userDoc.data().pushToken || null);
            }
          }
        }
      },
      (error) => {
        console.error("Chat metadata listener failed:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeChat();
    };
  }, [id, user]);

  useEffect(() => {
    if (!chatData || !user) return;

    const otherId = chatData.participants?.find((p) => p !== user.uid);
    if (!otherId) return;

    const unsubStatus = onSnapshot(
      doc(db, "users", otherId),
      (docSnap) => {
        if (docSnap.exists()) {
          setOtherUserStatus(docSnap.data().status || "offline");
        } else {
          setOtherUserStatus("offline");
        }
      },
      (error) => {
        console.error("User status listener failed:", error);
        setOtherUserStatus("offline");
      }
    );

    return () => unsubStatus();
  }, [chatData, user]);

  const triggerLocalNotification = async (senderName, messageText) => {
    const Notifications = await getNotificationsModule();

    if (!Notifications) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Message from ${senderName}`,
        body: messageText,
        data: { chatId: id },
        sound: "default",
      },
      trigger: null,
    });
  };

  useEffect(() => {
    if (!id || !user) return;

    const q = query(
      collection(db, "chats", id, "messages"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMessages(msgList);
        setLoading(false);

        // Show a local notification only for new incoming messages.
        if (msgList.length > 0) {
          const latestMsg = msgList[0];

          if (latestMsg.senderId !== user.uid && latestMsg.id !== lastNotifiedId) {
            triggerLocalNotification(latestMsg.senderName, latestMsg.text).catch((err) => {
              console.error("Local notification failed:", err);
            });
            setLastNotifiedId(latestMsg.id);
          }
        }
      },
      (error) => {
        console.error("Messages listener failed:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, lastNotifiedId, user]);

  const sendPushNotification = async (targetToken, msgText) => {
    const message = {
      to: targetToken,
      sound: "default",
      title: `New Message from ${user.displayName || "BusinessConnect"}`,
      body: msgText,
      data: { chatId: id },
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  };

  const isValidExpoPushToken = (token) => {
    if (!token || typeof token !== "string") return false;
    return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
  };

  const sendMessage = async () => {
    if (inputText.trim() === "" || !chatData) return;

    const currentText = inputText; 
    setInputText(""); 

    const receiverId = chatData.participants.find((p) => p !== user.uid);

    const messageData = {
      text: currentText,
      senderId: user.uid,
      senderName: user.displayName || "User",
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "chats", id, "messages"), messageData);
      if (receiverId && receiverId !== user.uid && isValidExpoPushToken(otherUserToken)) {
        sendPushNotification(otherUserToken, currentText).catch((err) => {
          console.error("Push notification send failed:", err);
        });
      }

      await updateDoc(doc(db, "chats", id), {
        lastMessage: currentText,
        updatedAt: serverTimestamp(),
        unreadBy: [receiverId], 
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets?.[0];
        if (file?.uri && file?.name) {
          await uploadFile(file.uri, file.name);
        }
      }
    } catch (error) {
      console.error("Document picker failed:", error);
      Alert.alert("Error", "Unable to pick document.");
    }
  };

  const uploadFile = async (uri, fileName) => {
    if (!chatData || !id || !user) {
      Alert.alert("Error", "Chat is not ready yet.");
      return;
    }

    setIsUploading(true);

    try {
      const fileRef = ref(storage, `chats/${id}/files/${Date.now()}_${fileName}`);
      const response = await fetch(uri);
      const blob = await response.blob();

      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);

      await addDoc(collection(db, "chats", id, "messages"), {
        text: `Document: ${fileName}`,
        fileUrl: downloadURL,
        fileName,
        type: "file",
        senderId: user.uid,
        senderName: user.displayName || "User",
        createdAt: serverTimestamp(),
      });

      const receiverId = chatData.participants.find((p) => p !== user.uid);
      await updateDoc(doc(db, "chats", id), {
        lastMessage: `Document: ${fileName}`,
        updatedAt: serverTimestamp(),
        unreadBy: receiverId ? [receiverId] : [],
      });

      if (receiverId && receiverId !== user.uid && isValidExpoPushToken(otherUserToken)) {
        sendPushNotification(otherUserToken, `Sent a document: ${fileName}`).catch((err) => {
          console.error("Push notification send failed:", err);
        });
      }
    } catch (error) {
      console.error("File upload failed:", error);
      Alert.alert("Error", "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  /* ================= COMMUNICATION HANDLERS ================= */
  const handlePhoneCall = () => {
    if (otherUserMobile) {
      Linking.openURL(`tel:${otherUserMobile}`);
    } else {
      Alert.alert("Error", "Mobile number not available for this user.");
    }
  };

  const handleWhatsApp = () => {
    if (otherUserMobile) {
      // Clean the number (remove spaces, +, etc if necessary, but tel: usually handles it)
      Linking.openURL(`whatsapp://send?phone=${otherUserMobile}`);
    } else {
      Alert.alert("Error", "WhatsApp number not available for this user.");
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.senderId === user.uid;

    if (item.type === "file") {
      return (
        <View style={[styles.msgWrap, isMine ? styles.myWrap : styles.theirWrap]}>
          <TouchableOpacity
            onPress={() => Linking.openURL(item.fileUrl)}
            style={styles.fileBubble}
          >
            <View style={styles.fileIconContainer}>
              <Ionicons name="document-text" size={24} color="#047857" />
            </View>
            <View style={styles.fileTextContainer}>
              <Text style={styles.fileName} numberOfLines={1}>
                {item.fileName || "Document"}
              </Text>
              <Text style={styles.fileSize}>Tap to view document</Text>
            </View>
            <Ionicons name="download-outline" size={20} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.timeText}>
            {item.createdAt?.seconds
              ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "..."}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageWrapper, isMine ? styles.myWrapper : styles.theirWrapper]}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {item.createdAt?.seconds
            ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "..."}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#064E3B" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.headerTitle}>{receiverName || "Chat"}</Text>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    otherUserStatus === "online" ? "#22C55E" : "#94A3B8",
                },
              ]}
            />
          </View>
          <Text style={styles.headerSub} numberOfLines={1}>
            {otherUserStatus === "online" ? "Active Now" : "Offline"}
          </Text>
        </View>

        {/* COMMUNICATION ICONS */}
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handlePhoneCall} style={styles.iconBtnHeader}>
            <Ionicons name="call-outline" size={22} color="#064E3B" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleWhatsApp} style={styles.iconBtnHeader}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#047857" style={{ flex: 1 }} />
      ) : (
        <>
          {messages.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>Start a conversation with {receiverName}</Text>
              <Text style={styles.emptySub}>Share your pitch decks or ask questions!</Text>
            </View>
          )}

          {messages.length > 0 && (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              inverted 
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}

      {/* INPUT AREA */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickDocument} disabled={isUploading} style={styles.attachBtn}>
            {isUploading ? (
              <ActivityIndicator size="small" color="#047857" />
            ) : (
              <Ionicons name="attach" size={24} color="#64748B" />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#DCFCE7",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#064E3B" },
  headerSub: { fontSize: 11, color: "#047857", opacity: 0.7 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconBtnHeader: { padding: 5 },
  listContent: { padding: 20 },
  msgWrap: { marginBottom: 15, maxWidth: "80%" },
  myWrap: { alignSelf: "flex-end" },
  theirWrap: { alignSelf: "flex-start" },
  messageWrapper: { marginBottom: 15, maxWidth: "80%" },
  myWrapper: { alignSelf: "flex-end" },
  theirWrapper: { alignSelf: "flex-start" },
  bubble: { padding: 12, borderRadius: 20 },
  myBubble: { backgroundColor: "#047857", borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 2, elevation: 1 },
  messageText: { fontSize: 15 },
  myText: { color: "#fff" },
  theirText: { color: "#1E293B" },
  fileBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: 250,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  fileTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  fileSize: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  timeText: { fontSize: 10, color: "#94A3B8", marginTop: 4, alignSelf: "flex-end" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  attachBtn: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#047857",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});