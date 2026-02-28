import { View, FlatList, StyleSheet } from "react-native";
import { useAccessibility } from "../../context/AccessibilityContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { Video } from "expo-av";
import { WebView } from "react-native-webview";
import AppText from "../components/AppText";

export default function ContentScreen() {
  const { userId, accessibilityType } = useAccessibility();
  const [enrolledProfessorIds, setEnrolledProfessorIds] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const convertToEmbed = (url) => {
    if (!url) return "";
    const videoId = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : "";
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  useEffect(() => {
    const auth = getAuth();
    if (!auth.currentUser || !userId) return;

    const q = query(collection(db, "enrollments"), where("studentId", "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const professorIds = snapshot.docs.map((doc) => doc.data().professorId);
      setEnrolledProfessorIds(professorIds);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (enrolledProfessorIds.length === 0) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "content"), where("uploadedBy", "in", enrolledProfessorIds));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setContentList(contents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [enrolledProfessorIds]);

  if (loading) {
    return (
      <View style={styles.center}>
        <AppText>Loading...</AppText>
      </View>
    );
  }

  if (!loading && contentList.length === 0) {
    return (
      <View style={styles.center}>
        <AppText>No content yet.</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <AppText style={styles.header}>My Content</AppText>
        <View style={styles.modePill}>
          <AppText style={styles.modeText}>Mode: {accessibilityType || "Default"}</AppText>
        </View>
      </View>

      <FlatList
        data={contentList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <AppText style={styles.courseName}>{item.courseName || "Course Name"}</AppText>
            <AppText style={styles.profName}>{item.professorName || "Professor Name"}</AppText>
            <View style={styles.divider} />

            {item.status !== "completed" ? (
              <AppText style={styles.processing}>Processing accessible format...</AppText>
            ) : (
              <>
                {accessibilityType === "Deaf" && item.signVideoURL && (
                  <>
                    {item.videoType === "youtube" ? (
                      <WebView source={{ uri: convertToEmbed(item.signVideoURL) }} style={styles.video} />
                    ) : (
                      <Video
                        source={{ uri: item.signVideoURL }}
                        style={styles.video}
                        useNativeControls
                        resizeMode="contain"
                        shouldPlay
                        isLooping={false}
                      />
                    )}
                  </>
                )}

                {accessibilityType === "Mute" && item.transcript && (
                  <AppText style={styles.contentText}>{item.transcript}</AppText>
                )}

                {accessibilityType === "Dyslexic" && item.transcript && (
                  <AppText style={styles.dyslexicText}>{item.transcript}</AppText>
                )}
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBlock: {
    backgroundColor: "#3F62E8",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  modePill: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#DDE5FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  modeText: {
    fontSize: 12,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  courseName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  profName: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },
  processing: {
    color: "#FF9800",
    fontStyle: "italic",
    fontSize: 14,
  },
  contentText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  dyslexicText: {
    fontSize: 17,
    color: "#1E293B",
    lineHeight: 28,
    letterSpacing: 0.5,
    fontFamily: "Lexend-Regular",
  },
  video: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    backgroundColor: "#000",
  },
});
