import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, TextInput, StyleSheet, Image } from "react-native";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection } from "firebase/firestore";
import AppText from "../components/AppText";
import { storage, db, auth } from "../../services/firebaseConfig";

export default function AssignmentSubmission({ navigation, route }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sound, setSound] = useState(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert("Microphone permission required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: createdRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(createdRecording);
      setIsRecording(true);
    } catch (err) {
      console.log("Recording error:", err);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setSelectedFile({ uri, type: "audio" });
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.log("Stop error:", err);
    }
  };

  const playAudio = async () => {
    if (!selectedFile?.uri) return;
    try {
      const { sound: audioSound } = await Audio.Sound.createAsync({ uri: selectedFile.uri });
      setSound(audioSound);
      await audioSound.playAsync();
    } catch (err) {
      console.log("Playback error:", err);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (result.canceled) return;

      setSelectedFile({
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        type: "file",
      });
    } catch (error) {
      console.log("Document pick error:", error);
    }
  };

  const handleCameraPress = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission required");
      return;
    }
    navigation.navigate("CameraScreen");
  };

  useEffect(() => {
    if (route.params?.imageUri) {
      setSelectedFile({
        uri: route.params.imageUri,
        type: "image",
      });
    }
  }, [route.params]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const uploadFileToStorage = async () => {
    if (!selectedFile) return null;
    try {
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      const fileName = `${Date.now()}_${selectedFile.name || "file"}`;
      const storageRef = ref(storage, `submissions/${fileName}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.log("Upload error:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const downloadURL = await uploadFileToStorage();
      if (!downloadURL) {
        alert("Upload failed");
        return;
      }

      const user = auth.currentUser;
      await addDoc(collection(db, "assignmentSubmissions"), {
        assignmentId: route.params.assignmentId,
        courseCode: route.params.courseCode,
        studentId: user?.uid,
        fileURL: downloadURL,
        fileName: title || selectedFile?.name || "Untitled",
        createdAt: new Date(),
      });

      setSubmitted(true);
      alert("Submission successful");
    } catch (error) {
      console.log("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBlock}>
        <AppText style={styles.header}>Assignment Submission</AppText>
        <AppText style={styles.subHeader}>Add photo, audio, or document and submit.</AppText>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#3F62E8" }]} onPress={handleCameraPress}>
          <AppText style={styles.actionButtonText}>{selectedFile ? "Retake Photo" : "Add Photo"}</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#26B857" }]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <AppText style={styles.actionButtonText}>{isRecording ? "Stop Recording" : "Record Audio"}</AppText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#FF9800" }]} onPress={pickDocument}>
          <AppText style={styles.actionButtonText}>Upload File</AppText>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.previewCard}>
            {selectedFile.type === "image" && (
              <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} resizeMode="cover" />
            )}

            {selectedFile.type === "audio" && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#3F62E8", marginBottom: 8 }]} onPress={playAudio}>
                <AppText style={styles.actionButtonText}>Play Audio</AppText>
              </TouchableOpacity>
            )}

            <View style={styles.fileRow}>
              <AppText style={styles.fileLabel}>Selected file ready</AppText>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <AppText style={styles.removeText}>Remove</AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TextInput
          placeholder="File Name"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedFile || isSubmitting || submitted) && { opacity: 0.6 },
          ]}
          disabled={!selectedFile || isSubmitting || submitted}
          onPress={handleSubmit}
        >
          <AppText style={styles.submitText}>
            {submitted ? "Submitted" : isSubmitting ? "Submitting..." : "Submit Assignment"}
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  headerBlock: {
    backgroundColor: "#3F62E8",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
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
  content: {
    padding: 14,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    marginBottom: 10,
  },
  fileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fileLabel: {
    fontSize: 14,
    color: "#374151",
  },
  removeText: {
    fontSize: 14,
    color: "#FF5C5C",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#26B857",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
