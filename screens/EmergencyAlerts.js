import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

const EmergencyAlerts = () => {

  const handlePress = (message) => {
    console.log("Preset pressed:", message);
    Alert.alert("Message Sent", message);
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handlePress("I have a doubt")}
      >
        <Text style={styles.buttonText}>I have a doubt</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handlePress("Please repeat")}
      >
        <Text style={styles.buttonText}>Please repeat</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handlePress("Agree")}
      >
        <Text style={styles.buttonText}>Agree</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handlePress("Disagree")}
      >
        <Text style={styles.buttonText}>Disagree</Text>
      </TouchableOpacity>

    </View>
  );
};

export default EmergencyAlerts;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 20,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
});