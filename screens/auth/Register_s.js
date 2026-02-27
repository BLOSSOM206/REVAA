import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { Picker } from "@react-native-picker/picker";


export default function Register({ navigation, route }) {

  const role = route?.params?.role || "student"; // fallback safety

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accessibilityType, setAccessibilityType] = useState("");

  const handleRegister = async () => {
    if (!name.trim()) return Alert.alert("Enter name");
    if (!email.trim()) return Alert.alert("Enter email");
    if (!password) return Alert.alert("Enter password");
    if (password.length < 6) return Alert.alert("Password must be at least 6 characters");
    if (!accessibilityType.trim()) return Alert.alert("Enter accessibility type");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role, // 🔥 dynamic role from RoleSelection
        accessibilityType,
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(user);

      Alert.alert("Success", "Verification email sent. Please check your inbox.");

      navigation.navigate("Login");

    } catch (error) {
      console.log(error);
      Alert.alert("Registration Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create {role} Account</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Accessibility Type</Text>
        <View style={styles.pickerContainer}>
            <Picker
                selectedValue={accessibilityType}
                onValueChange={(itemValue)=>{
                    setAccessibilityType(itemValue)
                }}>
                <Picker.Item label="Select accessibility type" value="" />
                <Picker.Item label="Deaf" value="Deaf" />
                <Picker.Item label="Mute" value="Mute" />
                <Picker.Item label="Dyslexic" value="Dyslexic" />
                </Picker>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
        <Text style={styles.primaryButtonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginHighlight}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 30,
  },

  inputContainer: {
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 15,
  },

  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },

  loginText: {
    fontSize: 14,
    color: "#64748B",
  },

  loginHighlight: {
    color: "#2563EB",
    fontWeight: "600",
  },
  pickerContainer: {
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E2E8F0",
  marginTop: 4,
},
});