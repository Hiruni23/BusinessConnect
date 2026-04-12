import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { onboardingStyles as styles } from "../../styles/onboardingStyles";

export default function Screen1() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require("../../assets/onboarding/onboarding1.png")}
          style={styles.image}
        />

        <Text style={styles.title}>Track your work</Text>
        <Text style={styles.subtitle}>
          Keep track of your startup progress and achievements
        </Text>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.replace("/auth/welcome")}>
            <Text style={styles.skip}>SKIP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push("/onboarding/screen2")}
          >
            <Text style={styles.nextText}>NEXT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
