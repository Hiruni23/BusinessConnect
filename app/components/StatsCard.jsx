import { StyleSheet, Text, View } from "react-native";

export default function StatsCard({ title, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    width: "48%",
    marginBottom: 12,
    elevation: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
  },
  title: {
    fontSize: 13,
    color: "#6B7280",
  },
});