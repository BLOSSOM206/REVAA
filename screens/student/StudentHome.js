import React, {useEffect, useMemo, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  Linking,
  Share,
} from "react-native";
import {Video} from "expo-av";
import {collection, doc, onSnapshot} from "firebase/firestore";
import {db, auth} from "../../services/firebaseConfig";
import {
  ACCESSIBILITY_MODE,
  getAccessibilityModeLabel,
  normalizeAccessibilityMode,
} from "../../utils/accessibilityMode";

function getCourseName(item) {
  return (
    item.courseName ||
    item.courseCode ||
    item.courseId ||
    "Unknown Course"
  );
}

function getProfessorName(item) {
  return item.professorName || "Professor";
}

function inferType(item) {
  const mime = (item.mimeType || "").toLowerCase();
  const name = (item.originalFileName || "").toLowerCase();
  const url = (
    item.youtubeUrl ||
    item.originalVideoURL ||
    item.signVideoURL ||
    ""
  ).toLowerCase();

  if (
    mime === "text/youtube-url" ||
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  ) {
    return "youtube";
  }

  if (mime.includes("pdf") || name.endsWith(".pdf") || url.includes(".pdf")) {
    return "pdf";
  }
  if (
    mime.startsWith("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".gif") ||
    url.includes(".png") ||
    url.includes(".jpg") ||
    url.includes(".jpeg") ||
    url.includes(".gif")
  ) {
    return "image";
  }
  return "video";
}

function getPrimaryUrl(item, mode) {
  if (mode === ACCESSIBILITY_MODE.DEAF && item.signVideoURL) {
    return item.signVideoURL;
  }
  return item.youtubeUrl || item.originalVideoURL || item.signVideoURL || "";
}

function extractYouTubeVideoId(urlValue = "") {
  const input = String(urlValue || "").trim();
  if (!input) {
    return "";
  }

  const match = input.match(
    /(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  if (match && match[1]) {
    return match[1];
  }

  return "";
}

function getYouTubeThumbnail(urlValue = "") {
  const videoId = extractYouTubeVideoId(urlValue);
  if (!videoId) {
    return "";
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function getReadableText(item) {
  if (item.transcript && item.transcript.trim()) {
    return item.transcript.trim();
  }
  if (item.originalFileName) {
    return `Readable summary is not generated yet for "${item.originalFileName}".`;
  }
  return "Readable summary is not generated yet.";
}

export default function StudentHome({navigation}) {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(ACCESSIBILITY_MODE.DYSLEXIA);
  const [communicationText, setCommunicationText] = useState(
    "I need assistance with this content.",
  );

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(
      userRef,
      (snapshot) => {
        const userData = snapshot.data() || {};
        const resolvedMode = normalizeAccessibilityMode(
          userData.accessibilityMode || userData.accessibilityType,
        );
        setMode(resolvedMode);
      },
      (error) => {
        console.log("Failed to load accessibility mode:", error);
      },
    );

    const contentRef = collection(db, "content");
    const unsubscribeContent = onSnapshot(
      contentRef,
      (snapshot) => {
        const data = snapshot.docs.map((contentDoc) => ({
          id: contentDoc.id,
          ...contentDoc.data(),
        }));
        data.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setContent(data);
        setLoading(false);
      },
      (error) => {
        console.log("Failed to load content:", error);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeUser();
      unsubscribeContent();
    };
  }, []);

  const theme = useMemo(() => {
    if (mode === ACCESSIBILITY_MODE.DEAF) {
      return {
        page: "#eef6ff",
        card: "#ffffff",
        text: "#0f172a",
        subText: "#334155",
        accent: "#1d4ed8",
      };
    }
    if (mode === ACCESSIBILITY_MODE.SPEECH) {
      return {
        page: "#f4fff7",
        card: "#ffffff",
        text: "#052e16",
        subText: "#166534",
        accent: "#15803d",
      };
    }
    return {
      page: "#fffdf2",
      card: "#ffffff",
      text: "#1f2937",
      subText: "#374151",
      accent: "#9a3412",
    };
  }, [mode]);

  const handleOpenUrl = async (item) => {
    const targetUrl = getPrimaryUrl(item, mode);
    if (!targetUrl) {
      Alert.alert("Unavailable", "No file URL found for this content.");
      return;
    }

    try {
      await Linking.openURL(targetUrl);
    } catch (error) {
      Alert.alert("Open failed", error.message || "Unable to open this file.");
    }
  };

  const handleShareText = async (textValue) => {
    try {
      await Share.share({message: textValue});
    } catch (error) {
      Alert.alert("Share failed", error.message || "Unable to share text.");
    }
  };

  const renderVisualBlock = (item, type) => {
    const mediaUrl = getPrimaryUrl(item, mode);
    if (!mediaUrl) {
      return (
        <Text style={[styles.helperText, {color: theme.subText}]}>
          No media URL available.
        </Text>
      );
    }

    if (type === "image") {
      return (
        <Image
          source={{uri: mediaUrl}}
          style={styles.imagePreview}
          resizeMode="cover"
        />
      );
    }

    if (type === "video") {
      return (
        <Video
          source={{uri: mediaUrl}}
          useNativeControls
          resizeMode="contain"
          style={styles.videoPreview}
        />
      );
    }

    if (type === "youtube") {
      const thumbnail = getYouTubeThumbnail(mediaUrl);
      return (
        <View style={styles.pdfWrap}>
          {!!thumbnail && (
            <Image
              source={{uri: thumbnail}}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          )}
          <Text style={[styles.helperText, {color: theme.subText}]}>
            YouTube source detected. Open on YouTube for playback.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: theme.accent}]}
            onPress={() => handleOpenUrl(item)}
          >
            <Text style={styles.actionBtnText}>Open YouTube</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.pdfWrap}>
        <Text style={[styles.helperText, {color: theme.subText}]}>
          PDF detected. Open file for visual reading.
        </Text>
        <TouchableOpacity
          style={[styles.actionBtn, {backgroundColor: theme.accent}]}
          onPress={() => handleOpenUrl(item)}
        >
          <Text style={styles.actionBtnText}>Open PDF</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderModeBody = (item) => {
    const fileType = inferType(item);
    const readableText = getReadableText(item);

    if (mode === ACCESSIBILITY_MODE.DEAF) {
      return (
        <View>
          <Text style={[styles.sectionTitle, {color: theme.accent}]}>
            Visual-First View
          </Text>
          {renderVisualBlock(item, fileType)}
          <View style={styles.modePanel}>
            <Text style={[styles.modePanelTitle, {color: theme.text}]}>
              Caption / Transcript
            </Text>
            <Text style={[styles.modePanelText, {color: theme.subText}]}>
              {readableText}
            </Text>
          </View>
        </View>
      );
    }

    if (mode === ACCESSIBILITY_MODE.SPEECH) {
      return (
        <View>
          <Text style={[styles.sectionTitle, {color: theme.accent}]}>
            Text Interaction Priority
          </Text>
          <View style={styles.modePanel}>
            <Text style={[styles.modePanelTitle, {color: theme.text}]}>
              Key Text
            </Text>
            <Text style={[styles.modePanelText, {color: theme.subText}]}>
              {readableText}
            </Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.smallBtn, styles.smallBtnLeft, {borderColor: theme.accent}]}
              onPress={() => handleShareText(readableText)}
            >
              <Text style={[styles.smallBtnText, {color: theme.accent}]}>
                Share Text
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, styles.smallBtnRight, {borderColor: theme.accent}]}
              onPress={() => handleOpenUrl(item)}
            >
              <Text style={[styles.smallBtnText, {color: theme.accent}]}>
                Open File
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View>
        <Text style={[styles.sectionTitle, {color: theme.accent}]}>
          Readable-First View
        </Text>
        <View style={styles.modePanel}>
          <Text style={[styles.modePanelTitle, {color: theme.text}]}>
            Easy Read Text
          </Text>
          <Text style={[styles.readableText, {color: theme.text}]}>
            {readableText}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, {backgroundColor: theme.accent}]}
          onPress={() => handleOpenUrl(item)}
        >
          <Text style={styles.actionBtnText}>Open Original File</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loaderWrap, {backgroundColor: theme.page}]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={{flex: 1, backgroundColor: theme.page}}>
      <View style={styles.container}>
        <View style={[styles.headerCard, {backgroundColor: theme.card}]}>
          <Text style={[styles.pageTitle, {color: theme.text}]}>
            Accessible Learning
          </Text>
          <Text style={[styles.modeLabel, {color: theme.subText}]}>
            Active mode: {getAccessibilityModeLabel(mode)}
          </Text>
          <TouchableOpacity
            style={[styles.settingsBtn, {borderColor: theme.accent}]}
            onPress={() => navigation.navigate("AccessibilitySettings")}
          >
            <Text style={[styles.settingsBtnText, {color: theme.accent}]}>
              Change Accessibility Mode
            </Text>
          </TouchableOpacity>
        </View>

        {mode === ACCESSIBILITY_MODE.SPEECH && (
          <View style={[styles.headerCard, {backgroundColor: theme.card}]}>
            <Text style={[styles.sectionTitle, {color: theme.accent}]}>
              Communication Pad
            </Text>
            <TextInput
              style={styles.input}
              multiline
              value={communicationText}
              onChangeText={setCommunicationText}
              placeholder="Type what you want to communicate..."
            />
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: theme.accent}]}
              onPress={() => handleShareText(communicationText)}
            >
              <Text style={styles.actionBtnText}>Share Message</Text>
            </TouchableOpacity>
          </View>
        )}

        {content.length === 0 ? (
          <View style={[styles.card, {backgroundColor: theme.card}]}>
            <Text style={[styles.empty, {color: theme.subText}]}>
              No content available right now.
            </Text>
          </View>
        ) : (
          content.map((item) => (
            <View key={item.id} style={[styles.card, {backgroundColor: theme.card}]}>
              <Text style={[styles.contentTitle, {color: theme.text}]}>
                {item.originalFileName || item.type?.toUpperCase() || "CONTENT"}
              </Text>
              <Text style={[styles.meta, {color: theme.subText}]}>
                Course: {getCourseName(item)}
              </Text>
              <Text style={[styles.meta, {color: theme.subText}]}>
                Professor: {getProfessorName(item)}
              </Text>
              <Text style={[styles.meta, {color: theme.subText}]}>
                Status: {item.status || "unknown"}
              </Text>
              {renderModeBody(item)}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modeLabel: {
    marginTop: 6,
  },
  settingsBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  settingsBtnText: {
    fontWeight: "700",
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
    marginBottom: 12,
  },
  empty: {
    textAlign: "center",
    fontWeight: "600",
  },
  contentTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    marginBottom: 2,
  },
  sectionTitle: {
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 8,
    fontSize: 14,
  },
  modePanel: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f8fafc",
  },
  modePanelTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  modePanelText: {
    lineHeight: 22,
  },
  readableText: {
    fontSize: 17,
    lineHeight: 30,
    letterSpacing: 0.25,
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#e2e8f0",
  },
  videoPreview: {
    width: "100%",
    height: 210,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "black",
  },
  helperText: {
    marginBottom: 10,
  },
  pdfWrap: {
    marginBottom: 8,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnText: {
    color: "white",
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  smallBtnLeft: {
    marginRight: 5,
  },
  smallBtnRight: {
    marginLeft: 5,
  },
  smallBtnText: {
    fontWeight: "700",
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 10,
    minHeight: 88,
    textAlignVertical: "top",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
});
