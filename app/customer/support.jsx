import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SupportCenter() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    { 
      q: "How do I track my order?", 
      a: "Go to the 'Orders' tab in your dashboard. Select the order you want to track and you will see the real-time status updates from the service provider.", 
      icon: "location-outline" 
    },
    { 
      q: "What is the return policy?", 
      a: "Returns and refunds are subject to the individual service provider's policy. However, BusinessConnect provides escrow protection for 48 hours after delivery.", 
      icon: "refresh-outline" 
    },
    { 
      q: "Secure payment methods", 
      a: "We support Stripe, credit/debit cards, and bank transfers. All transactions are encrypted and secured using industry-standard protocols.", 
      icon: "card-outline" 
    },
    { 
      q: "Contacting a service provider", 
      a: "You can message any provider directly from the 'Service Details' page by tapping the 'Chat' icon next to their profile.", 
      icon: "chatbubble-outline" 
    },
  ];

  const toggleFaq = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* SEARCH BOX */}
          <View style={styles.searchSection}>
            <Text style={styles.searchTitle}>How can we help you?</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput style={styles.searchInput} placeholder="Search help articles..." />
            </View>
          </View>

          {/* QUICK CONTACT (Live Chat Only) */}
          <View style={styles.contactSection}>
            <TouchableOpacity style={styles.liveChatCard}>
              <LinearGradient 
                colors={['#6366F1', '#4F46E5']} 
                start={{x:0, y:0}} 
                end={{x:1, y:1}} 
                style={styles.chatGradient}
              >
                <View style={styles.chatInfo}>
                  <Text style={styles.chatTitle}>Live Chat Support</Text>
                  <Text style={styles.chatSub}>Average response time: 2 mins</Text>
                </View>
                <View style={styles.chatIconBox}>
                  <Ionicons name="chatbubbles" size={28} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* POPULAR FAQS (WITH ANSWERS) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Questions</Text>
            <View style={styles.faqList}>
              {faqs.map((item, index) => (
                <View key={index} style={styles.faqWrapper}>
                  <TouchableOpacity 
                    style={[styles.faqHeader, expandedFaq === index && styles.faqHeaderActive]} 
                    onPress={() => toggleFaq(index)}
                  >
                    <View style={styles.faqIconBox}>
                      <Ionicons name={item.icon} size={18} color={expandedFaq === index ? "#6366F1" : "#64748B"} />
                    </View>
                    <Text style={[styles.faqQuestion, expandedFaq === index && styles.faqQuestionActive]}>{item.q}</Text>
                    <Ionicons 
                      name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#CBD5E1" 
                    />
                  </TouchableOpacity>
                  {expandedFaq === index && (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswer}>{item.a}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* DOCUMENTATION LINKS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documentation</Text>
             <TouchableOpacity style={styles.docRow} onPress={() => router.push('/customer/terms')}>
                <View style={[styles.docIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#6366F1" />
                </View>
                <Text style={styles.docText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
             </TouchableOpacity>
             <TouchableOpacity style={styles.docRow} onPress={() => router.push('/customer/privacy')}>
                <View style={[styles.docIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="shield-outline" size={20} color="#10B981" />
                </View>
                <Text style={styles.docText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
             </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  
  scrollContent: { padding: 24, paddingBottom: 50 },
  searchSection: { marginBottom: 30 },
  searchTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1E293B' },

  contactSection: { marginBottom: 35 },
  liveChatCard: { borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.3, shadowRadius: 15 },
  chatGradient: { flexDirection: 'row', alignItems: 'center', padding: 24, justifyContent: 'space-between' },
  chatTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  chatSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, fontWeight: '600' },
  chatIconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  section: { marginBottom: 35 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginLeft: 8 },
  
  faqList: { gap: 12 },
  faqWrapper: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  faqHeaderActive: { backgroundColor: '#F8FAFC' },
  faqIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: '700', color: '#334155' },
  faqQuestionActive: { color: '#6366F1' },
  faqAnswerBox: { paddingHorizontal: 18, paddingBottom: 20, paddingTop: 10 },
  faqAnswer: { fontSize: 14, color: '#64748B', lineHeight: 22 },

  docRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderRadius: 24, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  docIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  docText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#334155' }
});
