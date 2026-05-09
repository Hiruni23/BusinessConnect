import { Ionicons } from "@expo/vector-icons"; // Matching your dashboard icons
import { httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { functions } from '../../firebaseConfig';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        {/* Header */}
        <BlurView intensity={90} tint="light" style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={20} color="#032A96" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Strategy Partner</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSub}>Deep Intelligence Active</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={26} color="#032A96" />
          </TouchableOpacity>
        </BlurView>

        {/* Chat Area */}
        <ScrollView style={styles.msgList} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}>
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubbleWrapper, m.role === 'user' ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
              {m.role === 'ai' && (
                <View style={styles.aiAvatarSmall}>
                  <Ionicons name="flash" size={14} color="#FFFFFF" />
                </View>
              )}
              <View style={[styles.bubble, m.role === 'user' ? styles.userB : styles.aiB]}>
                <Text style={[styles.msgText, m.role === 'user' ? styles.userText : styles.aiText]}>
                  {m.text}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingArea}>
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { opacity: 0.4 }]} />
                <View style={[styles.typingDot, { opacity: 0.7 }]} />
                <View style={[styles.typingDot, { opacity: 1 }]} />
              </View>
              <Text style={styles.loadingText}>Synthesizing market insights...</Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    backgroundColor: '#FFFFFF', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1, 
    borderColor: '#EBF2FF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  aiAvatarHeader: { 
    width: 42, 
    height: 42, 
    borderRadius: 14, 
    backgroundColor: '#EBF2FF', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#032A96', letterSpacing: -0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6, borderWidth: 2, borderColor: '#FFFFFF' },
  headerSub: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  
  msgList: { flex: 1, paddingHorizontal: 20, backgroundColor: '#F0F7FF' },
  bubbleWrapper: { marginBottom: 16, position: 'relative' },
  aiAvatarSmall: { 
    width: 28, 
    height: 28, 
    borderRadius: 10, 
    backgroundColor: '#032A96', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'absolute',
    left: -10,
    top: -10,
    zIndex: 2,
    elevation: 4,
    shadowColor: '#032A96',
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  bubble: { padding: 18, borderRadius: 24, maxWidth: '85%' },
  userB: { backgroundColor: '#032A96', borderBottomRightRadius: 4, elevation: 4, shadowColor: '#032A96', shadowOpacity: 0.2, shadowRadius: 8 },
  aiB: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#EBF2FF' },
  userText: { color: '#FFFFFF', fontWeight: '500', fontSize: 15, lineHeight: 22 },
  aiText: { color: '#0F172A', fontWeight: '500', fontSize: 15, lineHeight: 22 },
  msgText: { fontSize: 15, lineHeight: 22 },
  
  loadingArea: { padding: 15, alignSelf: 'flex-start', alignItems: 'center', flexDirection: 'row' },
  typingIndicator: { flexDirection: 'row', gap: 5, marginRight: 12 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#032A96' },
  loadingText: { fontSize: 12, color: '#64748B', fontWeight: '700', fontStyle: 'italic' },
  
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, paddingTop: 10, gap: 10, backgroundColor: '#F0F7FF' },
  actionChip: { backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#D1E3FF', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  actionText: { fontSize: 13, fontWeight: '800', color: '#032A96' },
  
  inputArea: { flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 16, marginBottom: 10, backgroundColor: '#FFFFFF', alignItems: 'center', borderTopWidth: 1, borderColor: '#EBF2FF' },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14, marginRight: 12, maxHeight: 120, fontSize: 16, color: '#0F172A', borderWidth: 1, borderColor: '#D1E3FF' },
  sendBtn: { backgroundColor: '#032A96', width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#032A96', shadowOpacity: 0.3, shadowRadius: 10 }
});