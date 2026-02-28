import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  
} from "react-native";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "../components/AppText";
import React,{useEffect, useState} from "react";
import { Image } from "react-native";
import * as DocumentPicker from "expo-document-picker"
import { ref,uploadBytes,getDownloadURL } from "firebase/storage";
import {storage} from "../../services/firebaseConfig"
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { auth } from "../../services/firebaseConfig";


export default function AssignmentSubmission({navigation,route})
{
    const [selectedFile, setSelectedFile] = useState(null)
    const [title,setTitle]=useState("")
    const [description,setDescription]=useState("")
    const [recording, setRecording] = useState(null);
const [isRecording, setIsRecording] = useState(false);const [isSubmitting, setIsSubmitting] = useState(false);
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

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    setRecording(recording);
    setIsRecording(true);

  } catch (err) {
    console.log("Recording error:", err);
  }
};const stopRecording = async () => {
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    setSelectedFile({
      uri: uri,
      type: "audio",
    });

    setRecording(null);
    setIsRecording(false);

  } catch (err) {
    console.log("Stop error:", err);
  }
};
const playAudio = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: selectedFile.uri }
    );

    setSound(sound);
    await sound.playAsync();

  } catch (err) {
    console.log("Playback error:", err);
  }
};
const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
    });

    if (!result.canceled) {
      setSelectedFile({
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        type: "file",
      });

      console.log("Picked file:", result.assets[0].name);
    }

  } catch (error) {
    console.log("Document pick error:", error);
  }
};
    const handleCameraPress=async()=>{
        const {status}=await Camera.requestCameraPermissionsAsync()
        console.log(navigation)
        if(status!=="granted")
        {
            alert("Camera Permission Required")
            return;
        }
        console.log("Permission Granted")
        
        navigation.navigate("CameraScreen")
        
    }
   useEffect(() => {
  if (route.params?.imageUri) {
    setSelectedFile({
      uri: route.params.imageUri,
      type: "image",
    });
  }
}, [route.params]);
const uploadFileToStorage = async () => {
  if (!selectedFile) {
    alert("No file selected");
    return;
  }

  try {
    console.log("Uploading file...");

    // 1️⃣ Convert local URI to blob
    const response = await fetch(selectedFile.uri);
    const blob = await response.blob();

    // 2️⃣ Create unique storage path
    const fileName = `${Date.now()}_${selectedFile.name || "file"}`;
    const storageRef = ref(storage, `submissions/${fileName}`);

    // 3️⃣ Upload
    await uploadBytes(storageRef, blob);

    // 4️⃣ Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    console.log("File uploaded successfully:", downloadURL);

    return downloadURL;

  } catch (error) {
    console.log("Upload error:", error);
  }
};
    return (
      <SafeAreaView style={styles.container}>

  {/* Upload / Retake */}
  <TouchableOpacity
    style={styles.primaryButton}
    onPress={handleCameraPress}
  >
    <AppText style={styles.primaryButtonText}>
      {selectedFile ? "🔄 Retake Photo" : "📷 Add Photo"}
    </AppText>
  </TouchableOpacity>
  <TouchableOpacity
  style={styles.primaryButton}
  onPress={isRecording ? stopRecording : startRecording}
>
  <AppText style={styles.primaryButtonText}>
    {isRecording ? "⏹ Stop Recording" : "🎙 Record Audio"}
  </AppText>
</TouchableOpacity>
<TouchableOpacity
  style={styles.primaryButton}
  onPress={pickDocument}
>
  <AppText style={styles.primaryButtonText}>
    📁 Upload File
  </AppText>
</TouchableOpacity>

  {/* Preview */}
  {selectedFile && (
    <View style={styles.previewCard}>
      {selectedFile.type === "image" && (
  <Image
    source={{ uri: selectedFile.uri }}
    style={styles.previewImage}
    resizeMode="cover"
  />
)}

{selectedFile.type === "audio" && (
  <View style={{ padding: 20, alignItems: "center" }}>
    <AppText style={{ marginBottom: 10 }}>
      🎧 Audio Recording Ready
    </AppText>

    <TouchableOpacity
      style={styles.primaryButton}
      onPress={playAudio}
    >
      <AppText style={styles.primaryButtonText}>
        ▶ Play Audio
      </AppText>
    </TouchableOpacity>
  </View>
)}
      <View style={styles.fileRow}>
        <AppText style={styles.fileLabel}>Selected File</AppText>

        <TouchableOpacity onPress={() => setSelectedFile(null)}>
          <AppText style={styles.removeText}>❌ Remove</AppText>
        </TouchableOpacity>
      </View>
    </View>
  )}

  {/* Title */}
  <TextInput
    placeholder="File Name"
    value={title}
    onChangeText={setTitle}
    style={styles.input}
  />

 

  {/* Submit */}
<TouchableOpacity
  style={[
    styles.submitButton,
    (!selectedFile || isSubmitting || submitted) && { opacity: 0.5 }
  ]}
  disabled={!selectedFile || isSubmitting || submitted}
 onPress={async () => {
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
      studentId: user.uid,   // 🔥 IMPORTANT FOR RULES
      fileURL: downloadURL,
      fileName: title || selectedFile.name || "Untitled",
      createdAt: new Date(),
    });

    setSubmitted(true);
    alert("Submission Successful ✅");

  } catch (error) {
    console.log("Submission error:", error);
  } finally {
    setIsSubmitting(false);
  }
}}
>
  <AppText style={styles.submitText}>
    {submitted
      ? "Submitted ✅"
      : isSubmitting
      ? "Submitting..."
      : "Submit Assignment"}
  </AppText>
</TouchableOpacity>

</SafeAreaView>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F4F6FA",
  },

  primaryButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  previewCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    elevation: 3,
  },

  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
  },

  fileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  fileLabel: {
    fontWeight: "bold",
    fontSize: 14,
  },

  removeText: {
    color: "red",
    fontWeight: "bold",
  },

  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 14,
  },

  submitButton: {
    backgroundColor: "#16A34A",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  submitText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});