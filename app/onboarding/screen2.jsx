import { View, Text, TouchableOpacity, Image, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { onboardingStyles as styles } from "../../styles/onboardingStyles";

export default function Screen2() {
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
            source={require("../../assets/onboarding/onboarding2.png")}
            style={styles.image}
          />

          <Text style={styles.title}>Stay organized</Text>
          <Text style={styles.subtitle}>
            Collaborate with investors and mentors efficiently
          </Text>

          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => router.replace("/auth/welcome")}>
              <Text style={styles.skip}>SKIP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => router.push("/onboarding/screen3")}
            >
              <Text style={styles.nextText}>NEXT</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
}
