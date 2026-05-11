import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export default function TabsLayout() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const normalizedRole = String(userData?.role || '').trim().toLowerCase();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          setUserData(snap.data());
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1E40AF",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          borderTopColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      {/* Dashboard Tab */}
      <Tabs.Screen
        name="entrepreneur/dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
          href: normalizedRole === "entrepreneur" ? "/entrepreneur/dashboard" : null,
        }}
      />

      {/* My Pitches Tab */}
      <Tabs.Screen
        name="entrepreneur/my-pitches"
        options={{
          title: "My Pitches",
          tabBarIcon: ({ color }) => (
            <Ionicons name="document" size={24} color={color} />
          ),
          href: normalizedRole === "entrepreneur" ? "/entrepreneur/my-pitches" : null,
        }}
      />

      {/* Analytics Tab 👈 NEW */}
      <Tabs.Screen
        name="entrepreneur/analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart" size={24} color={color} />
          ),
          href: normalizedRole === "entrepreneur" ? "/entrepreneur/analytics" : null,
        }}
      />

      {/* Notifications Tab */}
      <Tabs.Screen
        name="entrepreneur/notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications" size={24} color={color} />
          ),
          href: normalizedRole === "entrepreneur" ? "/entrepreneur/notifications" : null,
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="entrepreneur/profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
          href: normalizedRole === "entrepreneur" ? "/entrepreneur/profile" : null,
        }}
      />
    </Tabs>
  );
}
