import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";

export default function CreateCourseScreen({ navigation }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "Please login again.");
      return;
    }

    if (!name.trim() || !courseCode.trim()) {
      Alert.alert("Validation Error", "Course name and code are required.");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "courses"), {
        name: name.trim(),
        courseCode: courseCode.trim().toUpperCase(),
        description: description.trim(),
        professors: [auth.currentUser.uid],
        createdBy: auth.currentUser.uid,
        visibility: "open",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Course created successfully.");
      navigation.goBack();

    } catch (error) {
      console.log("CREATE COURSE ERROR:", error);
      Alert.alert("Error", error.message || "Failed to create course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Course</Text>

      <TextInput
        placeholder="Course Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Course Code (e.g. CS201)"
        value={courseCode}
        onChangeText={setCourseCode}
        style={styles.input}
        autoCapitalize="characters"
      />

      <TextInput
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />

      <Button
        title={loading ? "Creating..." : "Create Course"}
        onPress={handleCreateCourse}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
});
