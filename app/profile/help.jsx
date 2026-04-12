import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  TextInput
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const isNewArchitecture = global?.nativeFabricUIManager != null;

if (!isNewArchitecture && Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    question: "How do I connect with an Investor?",
    answer: "Navigate to the 'Investor' tab from the home screen, browse profiles, and click 'Send Connection Request'."
  },
  {
    question: "Can I change my role later?",
    answer: "Roles are currently fixed to maintain platform integrity. Contact support if you need a manual change."
  },
  {
    question: "Is my business data secure?",
    answer: "Yes, all pitch decks and personal details are encrypted and stored securely using Firebase."
  },
  {
    question: "How do I post a new project?",
    answer: "Go to your Dashboard and click the '+' icon to fill in your project details and funding goals."
  }
];

export default function HelpSupport() {
  const [searchQuery, setSearchQuery] = useState('');

  // Optimized filtering using useMemo
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Help & Support", headerShadowVisible: false }} />

      {/* SEARCH SECTION */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Search help articles..."
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* CONTACT CARDS - Hide when searching to focus on results */}
        {!searchQuery && (
          <>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <View style={styles.contactRow}>
              <ContactMethod 
                icon="mail" 
                label="Email" 
                onPress={() => Linking.openURL('mailto:support@businessconnect.com')} 
              />
              <ContactMethod 
                icon="logo-whatsapp" 
                label="WhatsApp" 
                onPress={() => Linking.openURL('https://wa.me/yournumber')} 
              />
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Frequently Asked Questions</Text>
          </>
        )}

        {/* FAQ RESULTS */}
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((item, index) => (
            <AccordionItem key={index} question={item.question} answer={item.answer} />
          ))
        ) : (
          <View style={styles.noResult}>
            <Ionicons name="search-outline" size={50} color="#ccc" />
            <Text style={styles.noResultText}>No matching questions found.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const AccordionItem = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity 
      style={[styles.accordionContainer, expanded && styles.accordionActive]} 
      onPress={toggleExpand} 
      activeOpacity={0.8}
    >
      <View style={styles.questionRow}>
        <Text style={styles.questionText}>{question}</Text>
        <Ionicons name={expanded ? "remove" : "add"} size={20} color={expanded ? "#2563EB" : "#666"} />
      </View>
      {expanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ContactMethod = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.contactCard} onPress={onPress}>
    <Ionicons name={icon} size={24} color="#2563EB" />
    <Text style={styles.contactLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#111' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 15, textTransform: 'uppercase' },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between' },
  contactCard: {
    backgroundColor: '#F8FAFC',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactLabel: { marginTop: 6, fontWeight: '600', color: '#444', fontSize: 13 },
  accordionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 2 }
    })
  },
  accordionActive: { borderColor: '#2563EB' },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionText: { fontSize: 15, fontWeight: '600', color: '#111', flex: 1 },
  answerContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f9f9f9' },
  answerText: { fontSize: 14, color: '#666', lineHeight: 20 },
  noResult: { alignItems: 'center', marginTop: 50 },
  noResultText: { marginTop: 10, color: '#999', fontSize: 16 }
});