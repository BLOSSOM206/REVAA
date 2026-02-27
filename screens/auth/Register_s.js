import React, {useState} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {doc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth, db} from "../../services/firebaseConfig";
import {
  ACCESSIBILITY_OPTIONS,
  ACCESSIBILITY_MODE,
} from "../../utils/accessibilityMode";

export default function RegisterS({navigation}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accessibilityType, setAccessibilityType] = useState(
    ACCESSIBILITY_MODE.DYSLEXIA,
  );

  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Enter email");
      return;
    }
    if (!password) {
      Alert.alert("Error", "Enter password");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Error", "Enter name");
      return;
    }
    if (!accessibilityType) {
      Alert.alert("Error", "Select an accessibility mode");
      return;
    }

    try {
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const user = userCredentials.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: email.trim(),
        role: "student",
        accessibilityType,
        accessibilityMode: accessibilityType,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Student account created");
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Register</Text>
      <TextInput
        placeholder="Full Name"
        style={styles.input}
        onChangeText={setName}
        value={name}
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />
      <Text style={styles.modeTitle}>Select Accessibility Mode</Text>
      <View style={styles.modeWrap}>
        {ACCESSIBILITY_OPTIONS.map((option) => {
          const selected = option.value === accessibilityType;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.modeCard, selected && styles.modeCardSelected]}
              onPress={() => setAccessibilityType(option.value)}
            >
              <Text style={[styles.modeName, selected && styles.modeNameSelected]}>
                {option.title}
              </Text>
              <Text style={styles.modeDesc}>{option.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("StudentLogin")}>
        <Text style={styles.link}>Already registered? Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("ProfessorRegister")}>
        <Text style={styles.link}>Continue as Professor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#0f766e",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#0f766e",
  },
  modeTitle: {
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  modeWrap: {
    marginBottom: 12,
  },
  modeCard: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  modeCardSelected: {
    borderColor: "#0f766e",
    backgroundColor: "#ecfeff",
  },
  modeName: {
    fontWeight: "700",
    color: "#111827",
  },
  modeNameSelected: {
    color: "#0f766e",
  },
  modeDesc: {
    color: "#4b5563",
    marginTop: 2,
    fontSize: 12,
  },
});
