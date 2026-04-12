import { Text, TouchableOpacity, View } from "react-native";
import FundingProgress from "./FundingProgress";

export default function PitchCard({ pitch, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{ backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <Text style={{ fontWeight: "700", fontSize: 16 }}>
          {pitch.title}
        </Text>

        <FundingProgress
          raised={pitch.fundingRaised}
          goal={pitch.fundingGoal}
        />

        <Text>Status: {pitch.status}</Text>
        <Text>Views: {pitch.views}</Text>
      </View>
    </TouchableOpacity>
  );
}