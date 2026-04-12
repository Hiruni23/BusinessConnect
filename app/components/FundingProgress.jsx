import { StyleSheet, Text, View } from "react-native";

export default function FundingProgress({ raised, goal }) {
  const percentage = Math.round((raised / goal) * 100);

  return (
    <View>
      <Text>{raised} / {goal}</Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
      <Text>{percentage}% Funded</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    marginVertical: 6,
  },
  fill: {
    height: 8,
    backgroundColor: "#4F46E5",
    borderRadius: 10,
  },
});