import { Ionicons } from "@expo/vector-icons"; // Matching your dashboard icons
import { httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { functions } from '../../firebaseConfig';

export default function AIChatModal({ visible, onClose, pitchData }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your BusinessConnect Assistant. How can I help with your startup today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Functions target:', {
      projectId: functions.app?.options?.projectId,
      authDomain: functions.app?.options?.authDomain
    });
  }, []);

  const sendMessage = async (customPrompt) => {
    const messageText = customPrompt || input;
    if (!messageText.trim()) return;
    
    const userMsg = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setInput('');

    try {
      // Ensure this matches the name 'askBusinessAI' you are deploying
      const askAI = httpsCallable(functions, 'askBusinessAI');
      
      const result = await askAI({ 
        prompt: messageText,
        pitchData: pitchData // Sending real pitch data from your Firestore
      });

      setMessages(prev => [...prev, { role: 'ai', text: result.data.text }]);
    } catch (err) {
      console.error("AI Error:", err);
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to the business network. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>BusinessConnect AI</Text>
            <Text style={styles.headerSub}>Expert Business Consultant</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <ScrollView style={styles.msgList} contentContainerStyle={{ paddingBottom: 20 }}>
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userB : styles.aiB]}>
              <Text style={[styles.msgText, m.role === 'user' ? styles.userText : styles.aiText]}>
                {m.text}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingArea}>
              <Text style={styles.loadingText}>Analyzing market data...</Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions (Helping your Entrepreneurs) */}
        {!loading && (
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionChip} onPress={() => sendMessage("Analyze my current pitch for investors.")}>
              <Text style={styles.actionText}>📈 Pitch Feedback</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionChip} onPress={() => sendMessage("Explain the escrow system.")}>
              <Text style={styles.actionText}>🛡️ Escrow Info</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TextInput 
            value={input} 
            onChangeText={setInput} 
            placeholder="Ask a business question..." 
            style={styles.input}
            multiline
          />
          <TouchableOpacity onPress={() => sendMessage()} style={styles.sendBtn} disabled={loading}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1, 
    borderColor: '#eee',
    elevation: 2 
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#4F46E5' },
  headerSub: { fontSize: 12, color: '#6B7280' },
  closeBtn: { padding: 5 },
  msgList: { flex: 1, padding: 15 },
  bubble: { padding: 14, borderRadius: 20, marginVertical: 6, maxWidth: '85%' },
  userB: { backgroundColor: '#4F46E5', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiB: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, elevation: 1 },
  userText: { color: '#fff' },
  aiText: { color: '#111827' },
  msgText: { fontSize: 14, lineHeight: 20 },
  loadingArea: { padding: 10, alignSelf: 'flex-start' },
  loadingText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 10, gap: 8 },
  actionChip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', alignItems: 'center', borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, maxHeight: 100 },
  sendBtn: { backgroundColor: '#4F46E5', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }
});