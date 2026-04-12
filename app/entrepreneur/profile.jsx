import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function EntrepreneurProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ fullName: "", email: "", phone: "", businessBio: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setUserData(docSnap.data());
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), userData);
      Alert.alert("Success", "Entrepreneur profile updated!");
    } catch (e) { Alert.alert("Error", e.message); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Entrepreneur Blue */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#1E3A8A" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Entrepreneur Details</Text>
        <TouchableOpacity onPress={handleUpdate}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={userData.fullName} onChangeText={(t) => setUserData({...userData, fullName: t})} />
        
        <Text style={styles.label}>Business Bio</Text>
        <TextInput style={[styles.input, { height: 100 }]} multiline value={userData.businessBio} onChangeText={(t) => setUserData({...userData, businessBio: t})} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 20, backgroundColor: "#B4C6FF" }, // Blue theme
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1E3A8A" },
  saveText: { color: "#1E3A8A", fontWeight: "bold" },
  label: { marginTop: 20, fontWeight: "600", color: "#4B5563" },
  input: { backgroundColor: "#F3F4F6", padding: 15, borderRadius: 10, marginTop: 8 }
});