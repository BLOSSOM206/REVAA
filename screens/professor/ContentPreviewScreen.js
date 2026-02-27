import React, {useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import {Video} from "expo-av";

export default function ContentPreviewScreen({route}) {
  const item = route?.params?.item;

  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Content Preview</Text>
        <Text>No content selected.</Text>
      </View>
    );
  }

  // Define media URL first, then detect file type.
  const mediaUrl =
    item.normalizedFileURL ||
    item.originalVideoURL ||
    item.signVideoURL ||
    "";
  const youtubeUrl = item.youtubeUrl || mediaUrl;
  const itemType = String(item.type || "").toLowerCase();
  const mimeType = String(item.mimeType || "").toLowerCase();

  const isVideo =
    itemType === "video" ||
    mimeType.startsWith("video/") ||
    mediaUrl.includes(".mp4") ||
    mediaUrl.includes(".mov") ||
    mediaUrl.includes(".webm");

  const isYouTube =
    youtubeUrl.includes("youtube.com") ||
    youtubeUrl.includes("youtu.be") ||
    item.mimeType === "text/youtube-url";

  const isImage =
    itemType === "image" ||
    mimeType.startsWith("image/") ||
    mediaUrl.includes(".jpg") ||
    mediaUrl.includes(".jpeg") ||
    mediaUrl.includes(".png") ||
    mediaUrl.includes(".gif");

  const isPdf =
    itemType === "pdf" ||
    mimeType.includes("pdf") ||
    mediaUrl.includes(".pdf");

  const extractYouTubeVideoId = (urlValue = "") => {
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
  };

  const youtubeVideoId = extractYouTubeVideoId(youtubeUrl);
  const youtubeThumbnail = youtubeVideoId ?
    `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg` :
    "";

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Content Preview</Text>

      {mediaUrl ? (
        <View style={styles.mediaContainer}>
          {loading && (
            <ActivityIndicator
              size="large"
              style={styles.loader}
            />
          )}

          {isVideo && !videoError && (
            <Video
              source={{uri: mediaUrl}}
              useNativeControls
              resizeMode="contain"
              style={styles.media}
              onLoad={() => setLoading(false)}
              onError={(e) => {
                console.log("VIDEO ERROR:", e);
                setVideoError(true);
                setLoading(false);
              }}
            />
          )}

          {isImage && (
            <Image
              source={{uri: mediaUrl}}
              style={styles.media}
              onLoad={() => setLoading(false)}
              onError={(e) => {
                console.log("IMAGE ERROR:", e);
                setLoading(false);
              }}
            />
          )}

          {isYouTube && (
            <View style={styles.youtubeWrap}>
              {!!youtubeThumbnail && (
                <Image
                  source={{uri: youtubeThumbnail}}
                  style={styles.media}
                  onLoad={() => setLoading(false)}
                  onError={() => setLoading(false)}
                />
              )}
              <TouchableOpacity
                style={styles.youtubeButton}
                onPress={() => Linking.openURL(youtubeUrl)}
              >
                <Text style={styles.youtubeButtonText}>Open on YouTube</Text>
              </TouchableOpacity>
            </View>
          )}

          {isPdf && (
            <TouchableOpacity
              style={styles.youtubeButton}
              onPress={() => Linking.openURL(mediaUrl)}
            >
              <Text style={styles.youtubeButtonText}>Open PDF</Text>
            </TouchableOpacity>
          )}

          {!isVideo && !isImage && !isYouTube && !isPdf && (
            <Text>Unsupported file type.</Text>
          )}

          {videoError && (
            <Text style={styles.error}>
              Unable to play video.
            </Text>
          )}
        </View>
      ) : (
        <Text>No media available.</Text>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Status:</Text>
        <Text>{item.status || "Unknown"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Course:</Text>
        <Text>{item.courseName || "Unknown Course"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Professor:</Text>
        <Text>{item.professorName || "Unknown Professor"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Transcript:</Text>
        <Text>
          {item.transcript || "No transcript available."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f7fa",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  mediaContainer: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  media: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    backgroundColor: "black",
  },
  loader: {
    position: "absolute",
    zIndex: 1,
  },
  section: {
    marginTop: 20,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  youtubeWrap: {
    width: "100%",
    alignItems: "center",
  },
  youtubeButton: {
    marginTop: 10,
    backgroundColor: "#dc2626",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  youtubeButtonText: {
    color: "white",
    fontWeight: "700",
  },
});
