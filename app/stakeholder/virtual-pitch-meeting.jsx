import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from "react-native";
let WebView = null;
try {
  WebView = require("react-native-webview").WebView;
} catch (e) {
  console.warn("WebView native module not found.");
}
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

export default function VirtualPitchMeeting() {
  const { url, title } = useLocalSearchParams();
  const router = useRouter();
  const { theme: T, isDark } = useTheme();

  const meetingUrl = url || "https://meet.jit.si/businessconnect-demo-room";

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.statusBar} />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { borderBottomColor: T.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: T.surface, borderColor: T.border }]}>
            <Ionicons name="close" size={24} color={T.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: T.text }]}>{title || "Session Command"}</Text>
          <View style={{ width: 44 }} />
        </View>
        
        <View style={styles.webviewContainer}>
          {WebView ? (
            <WebView 
              source={{ uri: meetingUrl }} 
              style={styles.webview}
              startInLoadingState={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              renderError={() => (
                <View style={styles.errorContainer}>
                  <Ionicons name="construct-outline" size={50} color={T.accent} />
                  <Text style={[styles.errorTitle, { color: T.text }]}>Rebuild Required</Text>
                  <Text style={[styles.errorText, { color: T.subtext }]}>
                    Native module 'RNCWebView' missing. Please run:
                    {"\n"}<Text style={{ fontWeight: '800', color: T.accent }}>npx expo run:android</Text>
                  </Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="construct-outline" size={50} color={T.accent} />
              <Text style={[styles.errorTitle, { color: T.text }]}>Rebuild Required</Text>
              <Text style={[styles.errorText, { color: T.subtext }]}>
                Native module 'RNCWebView' missing. Please run:
                {"\n"}<Text style={{ fontWeight: '800', color: T.accent }}>npx expo run:android</Text>
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  webviewContainer: { flex: 1 },
  webview: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { fontSize: 20, fontWeight: '900', marginTop: 15 },
  errorText: { fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 },
});
