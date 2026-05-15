import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
let WebView = null;
try {
  WebView = require("react-native-webview").WebView;
} catch (e) {
  console.warn("WebView native module not found.");
}
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function SafeWebView({ url, style }) {
  const [hasError, setHasError] = useState(false);
  const { theme: T } = useTheme();

  const handleOpenBrowser = () => {
    Linking.openURL(url);
  };

  if (hasError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: T.bg }]}>
        <Ionicons name="alert-circle-outline" size={60} color={T.accent} />
        <Text style={[styles.errorTitle, { color: T.text }]}>Native Module Missing</Text>
        <Text style={[styles.errorSub, { color: T.subtext }]}>
          The WebView component requires a native rebuild. Please run 'npx expo run:android' or use your browser.
        </Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: T.accent }]} onPress={handleOpenBrowser}>
          <Text style={styles.btnText}>Open in Browser</Text>
          <Ionicons name="open-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  if (!WebView) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: T.bg }]}>
        <Ionicons name="alert-circle-outline" size={60} color={T.accent} />
        <Text style={[styles.errorTitle, { color: T.text }]}>Native Module Missing</Text>
        <Text style={[styles.errorSub, { color: T.subtext }]}>
          The WebView component requires a native rebuild. Please run 'npx expo run:android' or use your browser.
        </Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: T.accent }]} onPress={handleOpenBrowser}>
          <Text style={styles.btnText}>Open in Browser</Text>
          <Ionicons name="open-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: url }}
      style={style}
      onError={() => setHasError(true)}
      onHttpError={() => setHasError(true)}
      // This is the critical part: catch the module missing error
      renderError={() => {
        setHasError(true);
        return <View />;
      }}
      startInLoadingState={true}
      allowsInlineMediaPlayback={true}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 20,
  },
  errorSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
