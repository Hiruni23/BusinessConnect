import React from 'react';
import { ScrollView, StyleSheet, Text, View, Platform, StatusBar } from 'react-native';
import { Stack } from 'expo-router';

export default function TermsAndConditions() {
  return (
    <View style={styles.container}>
      {/* Sets the header title for the navigation bar */}
      <Stack.Screen options={{ title: "Terms & Conditions", headerTitleStyle: { fontWeight: '700' } }} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.lastUpdated}>Last Updated: February 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Platform Purpose</Text>
          <Text style={styles.body}>
            BusinessConnect is a unified platform designed to bridge the gap between 
            entrepreneurs, investors, and stakeholders. By using this app, you agree 
            to participate in a professional manner.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. User Conduct</Text>
          <Text style={styles.body}>
            As a software engineering project, users should verify all details before 
            entering into any simulated business agreements. Misuse of the 
            platform for spam or fraudulent activity is prohibited.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Intellectual Property</Text>
          <Text style={styles.body}>
            The branding and content associated with BusinessConnect are part of an 
            academic project. All rights are reserved by the developer.
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
    color: '#2563EB',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
});