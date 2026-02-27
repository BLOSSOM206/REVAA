import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function RoleSelection({ navigation }) {
  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>Welcome to Reva</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Register", { role: "student" })}
      >
        <Text style={styles.buttonText}>I am a Student</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate("Register", { role: "professor" })}
      >
        <Text style={styles.buttonText}>I am a Professor</Text>
      </TouchableOpacity>

    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 50,
  },

  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 20,
  },

  secondaryButton: {
    backgroundColor: "#0F172A",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});