import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route) => pathname === route;

  return (
    <View style={styles.container}>
      {/* HOME */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/entrepreneur/dashboard")}
      >
        <Ionicons
          name="home"
          size={24}
          color={isActive("/entrepreneur/dashboard") ? "#4F46E5" : "#94A3B8"}
        />
      </TouchableOpacity>

      {/* PITCHES */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/entrepreneur/pitches")}
      >
        <Ionicons
          name="briefcase-outline"
          size={24}
          color={isActive("/entrepreneur/pitches") ? "#4F46E5" : "#94A3B8"}
        />
      </TouchableOpacity>

      {/* FAB - CREATE PITCH */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/entrepreneur/create-pitch")}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* MESSAGES */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/entrepreneur/notifications")}
      >
        <Ionicons
          name="chatbubble-outline"
          size={24}
          color={isActive("/entrepreneur/notifications") ? "#4F46E5" : "#94A3B8"}
        />
      </TouchableOpacity>

      {/* PROFILE */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/profile")}
      >
        <Ionicons
          name="person-outline"
          size={24}
          color={isActive("/profile") ? "#4F46E5" : "#94A3B8"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 8,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  fab: {
    width: 65,
    height: 65,
    borderRadius: 32,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 35,
    elevation: 6,
  },
});