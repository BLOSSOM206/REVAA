import { Text, TouchableOpacity, StyleSheet } from "react-native";

export default function DashBoardCard({ title, onPress, backgroundColor = "#3F62E8" }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.card, { backgroundColor }]}
    >
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 52,
    marginBottom: 14,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
