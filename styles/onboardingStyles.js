import { StyleSheet } from "react-native";

export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2F43D6",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 24,
    alignItems: "center",
    elevation: 6,
  },
  image: {
    width: 220,
    height: 220,
    resizeMode: "contain",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  dots: {
    flexDirection: "row",
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#000000",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  skip: {
    fontSize: 14,
    color: "#6B7280",
  },
  nextButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  nextText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  startButton: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    borderRadius: 24,
    width: "100%",
    alignItems: "center",
  },
  startText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
