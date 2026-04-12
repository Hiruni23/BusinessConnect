import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";

import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import SideMenu from "../components/SideMenu";

export default function StakeholderDashboard() {
  const router = useRouter();
  const user = auth.currentUser;

  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch user data
    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };
    fetchUserData();

    // Listen to pitches stakeholder involved in
    const qProjects = query(
      collection(db, "pitches"),
      where("status", "in", ["accepted", "funded", "active"])
    );

    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setProjects(list);
    });

    // Notifications listener
    const qNotifs = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("isRead", "==", false)
    );

    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      setHasUnread(!snapshot.empty);
    });

    return () => {
      unsubProjects();
      unsubNotifs();
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth/login");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={26} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Business Connect</Text>

        <TouchableOpacity onPress={() => router.push("/stakeholder/notifications")}>
          <View>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
            {hasUnread && <View style={styles.badgeDot} />}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* WELCOME */}
        <View style={styles.welcomeRow}>
          <Text style={styles.welcomeText}>Stakeholder Dashboard</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="people" size={14} color="#7C3AED" />
            <Text style={styles.roleText}>STAKEHOLDER</Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatCard title="Active Projects" value={projects.length} icon="briefcase-outline" />
          <StatCard title="Meetings" value="0" icon="calendar-outline" />
          <StatCard title="Reports" value="0" icon="document-text-outline" />
          <StatCard title="Messages" value="0" icon="chatbubble-outline" />
        </View>

        {/* PROJECT LIST */}
        <Text style={styles.sectionTitle}>Startup Projects</Text>

        {projects.length === 0 ? (
          <Text style={styles.emptyText}>No active projects yet</Text>
        ) : (
          projects.map((item) => (
            <View key={item.id} style={styles.projectCard}>
              <Text style={styles.projectTitle}>{item.title}</Text>
              <Text style={styles.projectSub}>
                {item.category} · ${item.fundingGoal}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <NavItem icon="home" active />
        <NavItem icon="calendar-outline" />
        <NavItem icon="chatbubble-outline" />
        <NavItem icon="person-outline" />
      </View>

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        userData={userData}
        onLogout={handleLogout}
        router={router}
      />
    </View>
  );
}

/* SMALL COMPONENTS */

const StatCard = ({ title, value, icon }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={20} color="#7C3AED" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{title}</Text>
  </View>
);

const NavItem = ({ icon, active }) => (
  <View style={styles.navItem}>
    <Ionicons
      name={icon}
      size={24}
      color={active ? "#7C3AED" : "#94A3B8"}
    />
  </View>
);

/* STYLES */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#5B21B6",
  },

  badgeDot: {
    position: "absolute",
    right: -2,
    top: -2,
    backgroundColor: "red",
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  welcomeRow: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcomeText: {
    fontSize: 18,
    fontWeight: "700",
  },

  roleBadge: {
    flexDirection: "row",
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },

  roleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5B21B6",
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },

  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    margin: 16,
  },

  projectCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },

  projectTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  projectSub: {
    fontSize: 13,
    color: "#6B7280",
  },

  emptyText: {
    marginHorizontal: 16,
    color: "#6B7280",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },

  navItem: {
    alignItems: "center",
  },
});