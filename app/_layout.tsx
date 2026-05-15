import { useFonts } from "expo-font";
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from "expo-constants";
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, type AppStateStatus, Platform, View } from "react-native";
import { auth, db } from "../firebaseConfig";
import outfitRegular from "../assets/fonts/Outfit-Regular.ttf";
import outfitBold from "../assets/fonts/Outfit-Bold.ttf";
import outfitMedium from "../assets/fonts/Outfit-Medium.ttf";
import { ThemeProvider } from "../context/ThemeContext";


const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

const isPushTokenSupported = !isExpoGo;

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [initialRouteLoaded, setInitialRouteLoaded] = useState(false);
  const activeUidRef = useRef<string | null>(null);
  const registeredPushTokenRef = useRef<{ uid: string | null; token: string | null }>({
    uid: null,
    token: null,
  });

  const [fontsLoaded] = useFonts({
    outfit: outfitRegular,
    "outfit-bold": outfitBold,
    "outfit-medium": outfitMedium,
  });

  useEffect(() => {
    const setPresence = async (uid: string, status: "online" | "offline") => {
      try {
        await setDoc(doc(db, "users", uid), {
          status,
          lastSeen: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.error("Presence update failed:", err);
      }
    };

    const registerPushToken = async (uid: string) => {
      if (!isPushTokenSupported) {
        return;
      }


      try {
        const Device = await import("expo-device");
        if (!Device.isDevice) {
          console.log("Push notifications are skipped on simulators and emulators.");
          return;
        }

        const Notifications = await import("expo-notifications");
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        const permissions = await Notifications.getPermissionsAsync();
        let finalStatus = permissions.status;

        if (finalStatus !== "granted") {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }

        if (finalStatus !== "granted") {
          console.log("Push notification permission was not granted.");
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        if (!projectId) {
          console.warn("Push token skipped: No EAS project ID found. Run `npx eas-cli init` in terminal.");
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
        const pushToken = tokenResponse.data;

        if (
          registeredPushTokenRef.current.uid === uid &&
          registeredPushTokenRef.current.token === pushToken
        ) {
          return;
        }

        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          return;
        }

        if (userSnap.data()?.pushToken !== pushToken) {
          await updateDoc(userRef, {
            pushToken,
            pushTokenPlatform: Platform.OS,
            pushTokenUpdatedAt: serverTimestamp(),
          });
        }

        registeredPushTokenRef.current = { uid, token: pushToken };
      } catch (err) {
        console.error("Push token registration failed:", err);
      }
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      activeUidRef.current = user?.uid ?? null;
      if (user) {
        setPresence(user.uid, "online");
        void registerPushToken(user.uid);
      }
    });

    const appStateSubscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      const uid = activeUidRef.current;
      if (!uid) return;

      if (nextState === "active") {
        setPresence(uid, "online");
        return;
      }

      if (nextState === "background" || nextState === "inactive") {
        setPresence(uid, "offline");
      }
    });

    return () => {
      appStateSubscription.remove();
      authUnsubscribe();

      const uid = activeUidRef.current;
      if (uid) {
        setPresence(uid, "offline");
      }
    };
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      const firstSegment = segments[0] as string | undefined; // auth | entrepreneur | onboarding | etc
      const inAuth = firstSegment === "auth";
      const inOnboarding = firstSegment === "onboarding";
      const inEntrepreneur = firstSegment === "entrepreneur";
      const inChat = firstSegment === "chat";
      const inProfile = firstSegment === "profile";
      const inSplash = segments.join("/") === "" || segments.join("/") === "index" || segments.join("/") === "splash";

      /* ===============================
         ✅ ONBOARDING — ALWAYS ALLOWED
      =============================== */
      if (inOnboarding) {
        setInitialRouteLoaded(true);
        return;
      }
      /* ===============================
         🚪 LOGGED OUT USER
      =============================== */
      if (!user) {
        // Allow splash and onboarding routes freely
        if (!inAuth && !inOnboarding && !inSplash) {
          router.replace("/auth/welcome");
        }
        setInitialRouteLoaded(true);
        return;
      }
      /* ===============================
         🔐 LOGGED IN USER
      =============================== */
      try {
        // Wait for ID token to ensure Firestore rules can verify authentication
        await user.getIdToken(true);
        
        const snap = await getDoc(doc(db, "users", user.uid));
        const userData = snap.data();

        const role = userData?.role; // "Entrepreneur" | "entrepreneur" | etc
        const normalizedRole = String(role || "").toLowerCase();
        /* 1️⃣ No role → force role selection ONLY during signup */
        if (!role) {
          const isAuthProcess = 
            segments.join("/") === "auth/signup" || 
            segments.join("/") === "auth/role-selection" ||
            segments.join("/") === "auth/login";
            
          if (!isAuthProcess) {
            // User is trying to log in (or open app) but their account setup was never completed.
            // Sign them out and force them back to welcome instead of showing role selection.
            auth.signOut();
            router.replace("/auth/welcome");
            setInitialRouteLoaded(true);
            return;
          }

          // Let signup/login screens handle their own routing to prevent race conditions
          if (segments.join("/") === "auth/signup" || segments.join("/") === "auth/login") {
            setInitialRouteLoaded(true);
            return;
          }

          if (segments.join("/") !== "auth/role-selection") {
            router.replace("/auth/role-selection");
          }
          setInitialRouteLoaded(true);
          return;
        }
        /* ===============================
           🧑‍💼 ENTREPRENEUR FLOW
        =============================== */
        if (normalizedRole === "entrepreneur") {
          // Allow entrepreneur and chat segments
          if (inEntrepreneur || inChat || inProfile) {
            setInitialRouteLoaded(true);
            return;
          }

          const inInvestorSelection = segments.join("/") === "auth/investor-selection";
          const inCategorySelection = segments.join("/") === "auth/category-selection";

          // Allow optional entrepreneur setup flow from dashboard:
          // Investor Selection -> Category Selection -> Create Pitch.
          if (inInvestorSelection || inCategorySelection) {
            setInitialRouteLoaded(true);
            return;
          }

          // Entrepreneurs should land directly on their dashboard after role selection.
          router.replace("/entrepreneur/dashboard" as any);
          setInitialRouteLoaded(true);
          return;
        }

        if (normalizedRole === "investor") {
          const inInvestor = firstSegment === "investor";
          if (inInvestor || inChat || inProfile) {
            setInitialRouteLoaded(true);
            return;
          }

          if (!inInvestor) {
            router.replace("/investor/dashboard" as any);
          }
          setInitialRouteLoaded(true);
          return;
        }
        if (normalizedRole === "customer") {
          const inCustomer = firstSegment === "customer";
          if (inCustomer || inChat || inProfile) {
            setInitialRouteLoaded(true);
            return;
          }

          if (!inCustomer) {
            router.replace("/customer/dashboard" as any);
          }
          setInitialRouteLoaded(true);
          return;
        }

        if (normalizedRole === "stakeholder") {
          const inStakeholder = firstSegment === "stakeholder";
          if (inStakeholder || inChat || inProfile) {
            setInitialRouteLoaded(true);
            return;
          }

          if (!inStakeholder) {
            router.replace("/stakeholder/dashboard" as any);
          }
          setInitialRouteLoaded(true);
          return;
        }
        if (normalizedRole === "admin") {
          const inAdmin = firstSegment === "admin";
          if (inAdmin || inChat || inProfile) {
            setInitialRouteLoaded(true);
            return;
          }

          if (!inAdmin) {
            router.replace("/admin/marketplace-admin" as any);
          }
          setInitialRouteLoaded(true);
          return;
        }

        /* ===============================
           👥 OTHER ROLES (FUTURE)
        =============================== */
        setInitialRouteLoaded(true);
      } catch (err) {
        console.error("RootLayout Firestore error:", err);
        setInitialRouteLoaded(true);
      }
    });

    return unsubscribe;
  }, [segments, fontsLoaded]);

  if (!fontsLoaded || !initialRouteLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F8FAFC",
        }}
      >
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <StripeProvider publishableKey="pk_test_51TOKSuCDZMl8sA2goQ07y28hYoNTrjiJi8lK2UnIbLQ3DrG1Em4UiAStRncTPqqBVeZnSaM5aNUc3wcKIwkW6Xh600byPZXxqV">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />

          {/* Onboarding */}
          <Stack.Screen name="onboarding/screen1" />
          <Stack.Screen name="onboarding/screen2" />
          <Stack.Screen name="onboarding/screen3" />

          {/* Auth */}
          <Stack.Screen name="auth/welcome" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="auth/role-selection" />
          <Stack.Screen name="auth/investor-selection" />
          <Stack.Screen name="auth/category-selection" />

          {/* Entrepreneur */}
          <Stack.Screen name="entrepreneur/dashboard" />
          <Stack.Screen name="entrepreneur/create-pitch" />

          {/* Customer */}
          <Stack.Screen name="customer" />

          {/* Investor */}
          <Stack.Screen name="investor/inbox" options={{ headerShown: false }} />

          {/* Chat */}
          <Stack.Screen
            name="chat/[id]"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
        </Stack>
      </StripeProvider>
    </ThemeProvider>
  );
}


