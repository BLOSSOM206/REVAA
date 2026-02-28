import React, { useEffect,useState } from "react";
import { useRef } from "react";
import { View,TouchableOpacity,Text,StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import AppText from "../components/AppText";

export default function CameraScreen({navigation})
{
    const cameraRef=useRef(null)
    const [permission, requestPermission] = useCameraPermissions();

   if (!permission) {
  return <AppText>Requesting Camera Permission...</AppText>;
}

if (!permission.granted) {
  return (
    <View>
      <AppText>No access to camera</AppText>
      <TouchableOpacity onPress={requestPermission}>
        <AppText>Grant Permission</AppText>
      </TouchableOpacity>
    </View>
  );
}
const handleCapture=async()=>{
  if(!cameraRef.current)
  {
    return
  }
  if(cameraRef.current)
  {
    const photo = await cameraRef.current.takePictureAsync()
    console.log("Photo Object: ",photo)
   navigation.navigate("AssignmentSubmission", {
  imageUri: photo.uri,
});
  }

}
return (
  <View style={styles.container}>
    <CameraView
      style={styles.camera}
      ref={cameraRef}
    />

    <View style={styles.captureContainer}>
      <TouchableOpacity
        style={styles.captureButton}
        onPress={handleCapture}
      >
        <View style={styles.innerCircle} />
      </TouchableOpacity>
    </View>
  </View>
);
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  captureContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e75143",
  },
});