import { View, Text, TouchableOpacity, Image, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { onboardingStyles as styles } from "../../styles/onboardingStyles";

export default function Screen3() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#0F172A", "#1E3A8A", "#020617"]}
        style={styles.gradient}
      >
        <BlurView intensity={30} tint="dark" style={styles.card}>
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
            <Text style={styles.startText}>GET STARTED</Text>
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    </View>
  );
}

