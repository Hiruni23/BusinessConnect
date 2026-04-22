import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  
  // Local state for toggles
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);

  const toggleSwitch = (setter) => setter(previousState => !previousState);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your BusinessConnect account? This action is permanent.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => console.log("Delete account logic here") }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Settings", headerTitleStyle: { fontWeight: '700' } }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* NOTIFICATIONS SECTION */}
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.section}>
          <SettingRow 
            icon="notifications-outline" 
            title="Push Notifications" 
            value={isPushEnabled} 
            onToggle={() => toggleSwitch(setIsPushEnabled)} 
          />
          <SettingRow 
            icon="mail-outline" 
            title="Email Updates" 
            subtext="Includes Weekly Market Pulse & Milestone Alerts"
            value={isEmailEnabled} 
            onToggle={() => toggleSwitch(setIsEmailEnabled)} 
          />
        </View>

        {/* ACCOUNT & SECURITY */}
        <Text style={styles.sectionHeader}>Account & Security</Text>
        <View style={styles.section}>
          <SettingLink 
            icon="lock-closed-outline" 
            title="Change Password" 
            onPress={() => console.log("Navigate to Change Password")} 
          />
          <SettingLink 
            icon="shield-checkmark-outline" 
            title="Two-Factor Auth" 
            onPress={() => console.log("Navigate to 2FA")} 
          />
        </View>

        {/* PREFERENCES */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.section}>
          <SettingRow 
            icon="moon-outline" 
            title="Dark Mode" 
            value={isDarkMode} 
            onToggle={() => toggleSwitch(setIsDarkMode)} 
          />
          <SettingLink 
            icon="globe-outline" 
            title="Language" 
            value="English"
            onPress={() => console.log("Language setting")} 
          />
        </View>

        {/* DANGER ZONE */}
        <Text style={[styles.sectionHeader, { color: '#ef4444' }]}>Danger Zone</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Reusable component for toggle rows
const SettingRow = ({ icon, title, subtext, value, onToggle }) => (
  <View style={styles.row}>
    <View style={styles.leftContainer}>
      <View style={styles.iconBg}>
        <Ionicons name={icon} size={20} color="#4F46E5" />
      </View>
      <View>
        <Text style={styles.rowText}>{title}</Text>
        {subtext && <Text style={styles.subtext}>{subtext}</Text>}
      </View>
    </View>
    <Switch
      trackColor={{ false: "#E2E8F0", true: "#C7D2FE" }}
      thumbColor={value ? "#4F46E5" : "#F8FAFC"}
      onValueChange={onToggle}
      value={value}
    />
  </View>
);

// Reusable component for clickable link rows
const SettingLink = ({ icon, title, onPress, value }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.leftContainer}>
      <Ionicons name={icon} size={22} color="#2563EB" style={styles.icon} />
      <Text style={styles.rowText}>{title}</Text>
    </View>
    <View style={styles.rightContainer}>
      {value && <Text style={styles.valueText}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  leftContainer: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 12 },
  rowText: { fontSize: 16, color: '#111' },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 14, color: '#888', marginRight: 8 },
  deleteBtn: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  deleteBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 16 },
});