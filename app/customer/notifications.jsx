import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function NotificationSettings() {
  const router = useRouter();
  const { theme: T, isDark } = useTheme();
  const styles = makeStyles(T, isDark);
  
  const [channels, setChannels] = useState({
    pushOrders: true,
    pushPromos: false,
    pushSystem: true,
    emailOrders: true,
    emailPromos: true,
    emailWeekly: false
  });

  const toggleSwitch = (key) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* PUSH NOTIFICATIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Order Updates</Text>
                  <Text style={styles.rowSub}>Tracking and delivery alerts</Text>
                </View>
                <Switch 
                  value={channels.pushOrders} 
                  onValueChange={() => toggleSwitch('pushOrders')}
                  trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: isDark ? '#3B82F6' : '#2563EB' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Promotions & Offers</Text>
                  <Text style={styles.rowSub}>Discounts and flash sales</Text>
                </View>
                <Switch 
                  value={channels.pushPromos} 
                  onValueChange={() => toggleSwitch('pushPromos')}
                  trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: isDark ? '#3B82F6' : '#2563EB' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>System Messages</Text>
                  <Text style={styles.rowSub}>Security and account alerts</Text>
                </View>
                <Switch 
                  value={channels.pushSystem} 
                  onValueChange={() => toggleSwitch('pushSystem')}
                  trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: isDark ? '#3B82F6' : '#2563EB' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </View>

          {/* EMAIL NOTIFICATIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email Notifications</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Transaction Receipts</Text>
                  <Text style={styles.rowSub}>Sent for every purchase</Text>
                </View>
                <Switch 
                  value={channels.emailOrders} 
                  onValueChange={() => toggleSwitch('emailOrders')}
                  trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: isDark ? '#3B82F6' : '#2563EB' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Marketing Emails</Text>
                  <Text style={styles.rowSub}>Product updates and news</Text>
                </View>
                <Switch 
                  value={channels.emailPromos} 
                  onValueChange={() => toggleSwitch('emailPromos')}
                  trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: isDark ? '#3B82F6' : '#2563EB' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Weekly Digest</Text>
                  <Text style={styles.rowSub}>Summary of platform activity</Text>
                </View>
                <Switch 
                  value={channels.emailWeekly} 
                  onValueChange={() => toggleSwitch('emailWeekly')}
                  trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: isDark ? '#3B82F6' : '#2563EB' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(T, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: T.text },
    
    scrollContent: { padding: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: T.subtext, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 8 },
    card: { backgroundColor: T.surface, borderRadius: 32, padding: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1, borderColor: isDark ? T.border : 'transparent' },
    
    switchRow: { flexDirection: 'row', alignItems: 'center', padding: 18 },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: 16, fontWeight: '700', color: T.text },
    rowSub: { fontSize: 12, color: T.subtext, marginTop: 2, fontWeight: '600' },
    divider: { height: 1, backgroundColor: T.border, marginHorizontal: 15 }
  });
}
