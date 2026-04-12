import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';

export default function PrivacyPolicy() {
  return (
    <View style={styles.container}>
      {/* Updates the navigation header title */}
      <Stack.Screen options={{ title: "Privacy Policy", headerTitleStyle: { fontWeight: '700' } }} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: February 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Data Collection</Text>
          <Text style={styles.body}>
            BusinessConnect collects information you provide directly to us, 
            including your name, email address, profile photo, and professional 
            role (Entrepreneur, Investor, etc.) when you create an account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Data</Text>
          <Text style={styles.body}>
            We use your data to facilitate connections between users, personalize 
            your profile experience, and improve platform functionality. Your 
            email is used for authentication and project-related notifications.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Storage & Security</Text>
          <Text style={styles.body}>
            Your data is stored securely using Firebase. While we implement 
            industry-standard security measures, please note that no method of 
            transmission over the internet is 100% secure.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Academic Project Disclaimer</Text>
          <Text style={styles.body}>
            As a final-year software engineering project, this data is used for 
            demonstration purposes only. We do not sell your personal 
            information to third parties.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB', // Matching your primary BusinessConnect blue
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
});