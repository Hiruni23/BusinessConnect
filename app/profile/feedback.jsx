import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Ensure this path is correct

export default function FeedbackScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [type, setType] = useState('bug'); // bug, feature, or general
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter your feedback message.");
      return;
    }

    setLoading(true);
    try {
      // Saving to a 'feedback' collection in Firestore
      await addDoc(collection(db, "feedback"), {
        userId: user?.uid || "anonymous",
        userEmail: user?.email || "anonymous",
        type: type,
        message: message,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Success", 
        "Thank you for your feedback! Our team will review it.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      Alert.alert("Error", "Could not submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Give Feedback" }} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>What's on your mind?</Text>
        
        {/* TYPE SELECTION */}
        <View style={styles.typeRow}>
          <TypeButton 
            label="Bug" 
            icon="bug-outline" 
            active={type === 'bug'} 
            onPress={() => setType('bug')} 
          />
          <TypeButton 
            label="Feature" 
            icon="bulb-outline" 
            active={type === 'feature'} 
            onPress={() => setType('feature')} 
          />
          <TypeButton 
            label="Other" 
            icon="chatbubble-outline" 
            active={type === 'general'} 
            onPress={() => setType('general')} 
          />
        </View>

        {/* MESSAGE INPUT */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Tell us more..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.disabledBtn]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>Submit Feedback</Text>
              <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const TypeButton = ({ label, icon, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.typeBtn, active && styles.activeTypeBtn]} 
    onPress={onPress}
  >
    <Ionicons name={icon} size={20} color={active ? "#fff" : "#2563EB"} />
    <Text style={[styles.typeLabel, active && styles.activeTypeLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  label: { fontSize: 18, fontWeight: '700', marginBottom: 20, color: '#111' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  typeBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  activeTypeBtn: { backgroundColor: '#2563EB' },
  typeLabel: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#2563EB' },
  activeTypeLabel: { color: '#fff' },
  inputContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
    minHeight: 150,
  },
  textInput: { fontSize: 16, color: '#111', height: '100%' },
  submitBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 30,
    elevation: 3,
  },
  disabledBtn: { opacity: 0.7 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});