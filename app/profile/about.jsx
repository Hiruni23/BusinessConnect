import React from 'react';
import { ScrollView, StyleSheet, Text, View, Image, Linking, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutUs() {
  const openLink = (url) => Linking.openURL(url);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "About Us", headerTitleStyle: { fontWeight: '700' } }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* BRAND SECTION */}
        <View style={styles.brandSection}>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="briefcase" size={50} color="#fff" />
          </View>
          <Text style={styles.brandName}>BusinessConnect</Text>
          <Text style={styles.version}>Version 1.0.0 (Beta)</Text>
        </View>

        {/* MISSION SECTION */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.description}>
            BusinessConnect is a unified ecosystem designed to empower the next generation of 
            entrepreneurs. We bridge the gap between innovative ideas and the capital 
            needed to bring them to life, creating a seamless environment for 
            stakeholders to collaborate and grow.
          </Text>
        </View>

        {/* FEATURES GRID */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Ionicons name="people-circle" size={32} color="#2563EB" />
            <Text style={styles.gridTitle}>Networking</Text>
            <Text style={styles.gridText}>Connect with verified investors.</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="trending-up" size={32} color="#2563EB" />
            <Text style={styles.gridTitle}>Growth</Text>
            <Text style={styles.gridText}>Scale your startup with resources.</Text>
          </View>
        </View>

        {/* DEVELOPER SECTION */}
        <View style={styles.devSection}>
          <Text style={styles.sectionTitle}>Developed By</Text>
          <View style={styles.devCard}>
            <View style={styles.devInfo}>
              <Text style={styles.devName}>Software Engineering Team</Text>
              <Text style={styles.devRole}>Final Year Project • 2026</Text>
            </View>
          </View>
          
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={() => openLink('https://github.com')}>
              <Ionicons name="logo-github" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={() => openLink('https://linkedin.com')}>
              <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>© 2026 BusinessConnect. All rights reserved.</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  brandSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandName: { fontSize: 28, fontWeight: '800', color: '#111' },
  version: { fontSize: 14, color: '#888', marginTop: 4 },
  contentCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 24, color: '#444', textAlign: 'justify' },
  grid: { flexDirection: 'row', paddingHorizontal: 12 },
  gridItem: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 4,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  gridTitle: { fontWeight: '700', marginTop: 8, color: '#111' },
  gridText: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 4 },
  devSection: { padding: 20 },
  devCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  devInfo: { flex: 1 },
  devName: { fontSize: 16, fontWeight: '700', color: '#111' },
  devRole: { fontSize: 13, color: '#666' },
  socialRow: { flexDirection: 'row', marginTop: 16, justifyContent: 'center' },
  socialBtn: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 50,
    marginHorizontal: 10,
    elevation: 2,
  },
  footerText: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 20 },
});