import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Splash from "./splash";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const user = auth.currentUser;

      // 🔹 If no user → go to onboarding
      if (!user) {
        router.replace("/onboarding/screen1");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
          router.replace("/onboarding/screen1");
          return;
        }

        const role = userDoc.data()?.role;
        const normalizedRole = String(role || "").toLowerCase();
        const investorType = userDoc.data()?.investorType || userDoc.data()?.targetInvestorCategory;
        const category = userDoc.data()?.businessCategory;

        // 🔹 If role not selected yet
        if (!role) {
          router.replace("/auth/role-selection");
          return;
        }

        // 🔹 Navigate based on role
        switch (normalizedRole) {
          case "entrepreneur":
            if (!investorType) {
              router.replace("/auth/investor-selection");
              return;
            }
            if (!category) {
              router.replace("/auth/category-selection");
              return;
            }
            router.replace("/entrepreneur/dashboard");
            break;

          case "investor":
            router.replace("/investor/dashboard");
            break;

          default:
            router.replace("/onboarding/screen1");
        }
      } catch (error) {
        console.error("Navigation error:", error);
        router.replace("/onboarding/screen1");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Splash />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});