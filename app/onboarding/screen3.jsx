import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { onboardingStyles as styles } from "../../styles/onboardingStyles";

export default function Screen3() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require("../../assets/onboarding/onboarding3.png")}
          style={styles.image}
        />

        <Text style={styles.title}>Get notified</Text>
        <Text style={styles.subtitle}>
          Never miss opportunities and important updates
        </Text>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.replace("/auth/welcome")}
        >
          <Text style={styles.startText}>START</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

