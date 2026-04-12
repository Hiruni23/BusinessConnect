import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function CallScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    // 1. Generate a unique room name based on your Chat ID
    // We remove special characters so the URL is valid
    const roomName = `BusinessConnect_${id.replace(/[^a-zA-Z0-9]/g, "")}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}`;

    // 2. Open the call in the browser or Jitsi App
    // This works perfectly in Expo Go!
    const startCall = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Short delay for UX
      Linking.openURL(jitsiUrl);
      router.back(); // Return to chat after launching the call
    };

    startCall();
  }, [id]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#047857" />
      <Text style={styles.text}>Starting Secure Video Call...</Text>
      <Text style={styles.subText}>Connecting to BusinessConnect Servers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4' },
  text: { marginTop: 20, fontSize: 18, fontWeight: '800', color: '#064E3B' },
  subText: { marginTop: 8, fontSize: 14, color: '#059669' }
});