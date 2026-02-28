import React, { useRef } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import AppText from "../components/AppText";

export default function CameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <AppText style={styles.permissionText}>Requesting camera permission...</AppText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <AppText style={styles.permissionText}>No camera access yet.</AppText>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <AppText style={styles.permissionButtonText}>Grant Permission</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    navigation.navigate("AssignmentSubmission", { imageUri: photo.uri });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerOverlay}>
        <AppText style={styles.headerText}>Capture Assignment Photo</AppText>
      </View>

      <CameraView style={styles.camera} ref={cameraRef} />

      <View style={styles.captureContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture} activeOpacity={0.9}>
          <View style={styles.innerCircle} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  headerOverlay: {
    position: "absolute",
    top: 30,
    left: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: "rgba(63, 98, 232, 0.92)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  camera: {
    flex: 1,
  },
  captureContainer: {
    position: "absolute",
    bottom: 44,
    width: "100%",
    alignItems: "center",
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  innerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FF5C5C",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  permissionText: {
    color: "#111827",
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#3F62E8",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
