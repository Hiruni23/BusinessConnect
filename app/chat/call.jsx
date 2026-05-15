import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function CallScreen() {
  const { roomId } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const openMeeting = async () => {
      if (!roomId) return;
      
      const meetingUrl = `https://meet.jit.si/businessconnect-${roomId}`;
      
      try {
        await WebBrowser.openBrowserAsync(meetingUrl, {
          toolbarColor: "#DCFCE7",
          controlsColor: "#064E3B",
          showTitle: true,
        });
      } catch (error) {
        console.error("Failed to open browser:", error);
      } finally {
        // Return to chat after call or when browser is closed
        router.back();
      }
    };

    openMeeting();
  }, [roomId]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#047857" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

