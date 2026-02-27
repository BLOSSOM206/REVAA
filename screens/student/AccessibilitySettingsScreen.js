import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import {doc, getDoc, serverTimestamp, setDoc} from "firebase/firestore";
import {auth, db} from "../../services/firebaseConfig";
import {
  ACCESSIBILITY_OPTIONS,
  ACCESSIBILITY_MODE,
  getAccessibilityModeLabel,
  normalizeAccessibilityMode,
} from "../../utils/accessibilityMode";

export default function AccessibilitySettingsScreen({navigation}) {
  const [selectedMode, setSelectedMode] = useState(ACCESSIBILITY_MODE.DYSLEXIA);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserMode = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};
        const resolved = normalizeAccessibilityMode(
          userData.accessibilityMode || userData.accessibilityType,
        );
        setSelectedMode(resolved);
      } catch (error) {
        console.log("Failed to load accessibility settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserMode();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "Please login again.");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(
        userRef,
        {
          accessibilityType: selectedMode,
          accessibilityMode: selectedMode,
          updatedAt: serverTimestamp(),
        },
        {merge: true},
      );
      Alert.alert("Saved", `Mode set to ${getAccessibilityModeLabel(selectedMode)}.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Save failed", error.message || "Unable to update mode.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accessibility Settings</Text>
      <Text style={styles.subtitle}>
        Choose the interface that best matches your learning and communication style.
      </Text>

      {ACCESSIBILITY_OPTIONS.map((option) => {
        const selected = option.value === selectedMode;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.optionCard, selected && styles.optionCardSelected]}
            onPress={() => setSelectedMode(option.value)}
          >
            <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
              {option.title}
            </Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>{saving ? "Saving..." : "Save Accessibility Mode"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    color: "#475569",
    lineHeight: 20,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: "#0f766e",
    backgroundColor: "#ecfeff",
  },
  optionTitle: {
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
  },
  optionTitleSelected: {
    color: "#0f766e",
  },
  optionSubtitle: {
    color: "#4b5563",
    fontSize: 12,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: "#0f766e",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: "white",
    fontWeight: "700",
  },
});
