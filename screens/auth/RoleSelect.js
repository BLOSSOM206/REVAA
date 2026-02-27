import React from "react";
import {View, Text, TouchableOpacity, StyleSheet} from "react-native";

export default function RoleSelect({navigation}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Choose how you want to continue</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("ProfessorLogin")}
      >
        <Text style={styles.primaryText}>Professor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("StudentLogin")}
      >
        <Text style={styles.secondaryText}>Student</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: "#0f766e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#0f766e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryText: {
    color: "#0f766e",
    fontWeight: "700",
  },
});
