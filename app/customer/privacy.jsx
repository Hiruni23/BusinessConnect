import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicy() {
  const router = useRouter();

  const sections = [
    { title: "1. Information We Collect", content: "We collect information you provide directly to us, such as when you create an account, update your profile, or make a purchase. This includes your name, email, phone number, and payment information." },
    { title: "2. How We Use Your Data", content: "We use your data to provide, maintain, and improve our services, process transactions, and send you technical notices, updates, and security alerts." },
    { title: "3. Data Sharing", content: "We do not share your personal information with third parties except as described in this policy, such as with service providers who perform services on our behalf." },
    { title: "4. Your Rights", content: "You have the right to access, update, or delete your personal information at any time through your profile settings." },
    { title: "5. Data Security", content: "We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure." },
    { title: "6. Cookies & Tracking", content: "We use cookies and similar technologies to enhance your experience and analyze platform traffic." },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.lastUpdated}>Last Updated: April 2026</Text>
          <Text style={styles.intro}>Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.</Text>
          
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>We may update this policy from time to time. Continued use of the platform signifies acceptance of any changes.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  
  scrollContent: { padding: 24 },
  lastUpdated: { fontSize: 13, color: '#94A3B8', fontWeight: '700', marginBottom: 10 },
  intro: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 30 },
  
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  sectionContent: { fontSize: 15, color: '#475569', lineHeight: 24 },

  footer: { marginTop: 20, padding: 20, backgroundColor: '#F8FAFC', borderRadius: 20 },
  footerText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 }
});
