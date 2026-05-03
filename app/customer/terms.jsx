import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfService() {
  const router = useRouter();

  const sections = [
    { title: "1. Acceptance of Terms", content: "By accessing and using BusinessConnect, you agree to be bound by these Terms of Service and all applicable laws and regulations." },
    { title: "2. User Accounts", content: "To use certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials." },
    { title: "3. Platform Usage", content: "BusinessConnect provides a marketplace for products and services. We do not guarantee the quality or legality of items listed by third-party entrepreneurs." },
    { title: "4. Payments & Refunds", content: "All payments are processed through secure third-party gateways. Refund policies are determined by the individual service provider unless otherwise stated." },
    { title: "5. Intellectual Property", content: "All content, features, and functionality on the platform are the exclusive property of BusinessConnect and its licensors." },
    { title: "6. Limitation of Liability", content: "BusinessConnect shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service." },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.lastUpdated}>Last Updated: April 2026</Text>
          <Text style={styles.intro}>Please read these terms carefully before using our platform. Your use of the service constitutes acceptance of these terms.</Text>
          
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>If you have questions about these Terms, please contact our support team.</Text>
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
