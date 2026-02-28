import React from "react";
import { View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as Speech from "expo-speech";
import AppText from "./components/AppText";

const quickAlerts = [
  { label: "I need medical attention", color: "#FF5C5C" },
  { label: "I have a doubt", color: "#3F62E8" },
  { label: "Please repeat", color: "#FF9800" },
  { label: "Agree", color: "#26B857" },
  { label: "Disagree", color: "#FF5C5C" },
];

const EmergencyAlerts = () => {
  const handlePress = (message) => {
    Speech.stop();
    Speech.speak(message, { rate: 0.9, pitch: 1.0 });
    Alert.alert("Message Sent", message);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <AppText style={styles.header}>Emergency Alerts</AppText>
        <AppText style={styles.subHeader}>Tap a preset to send and speak it.</AppText>
      </View>

      <View style={styles.contentBlock}>
        {quickAlerts.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.button, { backgroundColor: item.color }]}
            onPress={() => handlePress(item.label)}
            activeOpacity={0.9}
          >
            <AppText style={styles.buttonText}>{item.label}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default EmergencyAlerts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  headerBlock: {
    backgroundColor: "#3F62E8",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 22,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  subHeader: {
    color: "#DDE5FF",
    fontSize: 14,
    marginTop: 4,
  },
  contentBlock: {
    padding: 14,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
