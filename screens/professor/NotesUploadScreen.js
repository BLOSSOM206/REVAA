import React, {useEffect, useState} from "react";
import {
  View,
  Button,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {ref, uploadBytes, getDownloadURL} from "firebase/storage";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import {auth, db, storage} from "../../services/firebaseConfig";

const MB = 1024 * 1024;

const UPLOAD_RULES = {
  video: {
    mimeTypes: ["video/mp4"],
    extensions: [".mp4"],
    maxBytes: 300 * MB,
    label: "MP4 video (max 300 MB)",
    normalizedMimeType: "video/mp4",
  },
  pdf: {
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
    maxBytes: 50 * MB,
    label: "PDF document (max 50 MB)",
    normalizedMimeType: "application/pdf",
  },
  image: {
    mimeTypes: ["image/jpeg", "image/png"],
    extensions: [".jpg", ".jpeg", ".png"],
    maxBytes: 20 * MB,
    label: "JPG/PNG image (max 20 MB)",
    normalizedMimeType: "image/jpeg_or_png",
  },
};

const SUPPORTED_MIME_TYPES = [
  ...UPLOAD_RULES.video.mimeTypes,
  ...UPLOAD_RULES.pdf.mimeTypes,
  ...UPLOAD_RULES.image.mimeTypes,
];

const SUPPORTED_FORMAT_LABEL = [
  UPLOAD_RULES.video.label,
  UPLOAD_RULES.pdf.label,
  UPLOAD_RULES.image.label,
].join(" | ");

const createValidationError = (message) => {
  const error = new Error(message);
  error.isValidationError = true;
  return error;
};

const getExtension = (fileName = "") => {
  const lower = fileName.toLowerCase();
  const dotIndex = lower.lastIndexOf(".");
  return dotIndex === -1 ? "" : lower.slice(dotIndex);
};

const inferMimeFromExtension = (extension) => {
  if (extension === ".mp4") {
    return "video/mp4";
  }
  if (extension === ".pdf") {
    return "application/pdf";
  }
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }
  return "";
};

const extractYouTubeVideoId = (urlValue = "") => {
  const input = String(urlValue || "").trim();
  if (!input) {
    return null;
  }

  const hostMatch = input.match(
    /^https?:\/\/(?:www\.|m\.)?(youtube\.com|youtu\.be)\//i,
  );
  if (!hostMatch) {
    return null;
  }

  const fallbackMatch = input.match(
    /(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1];
  }

  return null;
};

const normalizeYouTubeUrl = (videoId) => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};

const resolveSourceType = ({mimeType, extension}) => {
  if (UPLOAD_RULES.video.mimeTypes.includes(mimeType) ||
    UPLOAD_RULES.video.extensions.includes(extension)) {
    return "video";
  }

  if (UPLOAD_RULES.pdf.mimeTypes.includes(mimeType) ||
    UPLOAD_RULES.pdf.extensions.includes(extension)) {
    return "pdf";
  }

  if (UPLOAD_RULES.image.mimeTypes.includes(mimeType) ||
    UPLOAD_RULES.image.extensions.includes(extension)) {
    return "image";
  }

  return null;
};

const validateUploadContract = ({mimeType, fileName, fileSizeBytes}) => {
  const normalizedMimeType = (mimeType || "").toLowerCase().trim();
  const extension = getExtension(fileName);
  const sourceType = resolveSourceType({mimeType: normalizedMimeType, extension});

  if (!sourceType) {
    throw createValidationError(
      `Unsupported format. Allowed: ${SUPPORTED_FORMAT_LABEL}`,
    );
  }

  const rules = UPLOAD_RULES[sourceType];
  if (!rules) {
    throw createValidationError("Unsupported format category.");
  }

  if (!rules.mimeTypes.includes(normalizedMimeType) &&
    normalizedMimeType !== "") {
    throw createValidationError(
      `Invalid MIME type "${mimeType}" for ${sourceType}. Allowed: ${rules.mimeTypes.join(", ")}`,
    );
  }

  if (fileSizeBytes > rules.maxBytes) {
    const maxMb = Math.round(rules.maxBytes / MB);
    throw createValidationError(
      `${rules.label} exceeded. Maximum allowed size is ${maxMb} MB.`,
    );
  }

  return {
    sourceType,
    extension,
    mimeType: normalizedMimeType || inferMimeFromExtension(extension) || rules.mimeTypes[0],
    maxBytes: rules.maxBytes,
    normalizedMimeType: rules.normalizedMimeType,
  };
};

const getResolvedProfessorName = (userData = {}, authUser = null) => {
  return (
    userData.name ||
    userData.fullName ||
    userData.displayName ||
    authUser?.displayName ||
    "Professor"
  );
};

const getResolvedCourseName = (courseData = {}, fallbackId = "") => {
  return (
    courseData.name ||
    courseData.courseName ||
    courseData.title ||
    courseData.courseCode ||
    fallbackId ||
    "Untitled"
  );
};

export default function NotesUploadScreen() {
  const [uploading, setUploading] = useState(false);
  const [submittingYoutube, setSubmittingYoutube] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [professorName, setProfessorName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  useEffect(() => {
    const loadProfessorName = async () => {
      if (!auth.currentUser) {
        return;
      }

      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};
        setProfessorName(getResolvedProfessorName(userData, auth.currentUser));
      } catch (error) {
        console.log("FAILED TO LOAD PROFESSOR NAME:", error);
        setProfessorName(getResolvedProfessorName({}, auth.currentUser));
      }
    };

    loadProfessorName();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }
    const courseQuery = query(
      collection(db, "courses"),
      where("professors", "array-contains", auth.currentUser.uid),
    );

    const unsubscribe = onSnapshot(courseQuery, (snapshot) => {
      const courseData = snapshot.docs.map((courseDoc) => ({
        id: courseDoc.id,
        ...courseDoc.data(),
      }));
      setCourses(courseData);

      if (courseData.length > 0) {
        setSelectedCourseId((current) => current || courseData[0].id);
      }
    });

    return unsubscribe;
  }, []);

  const resolveContentMeta = async () => {
    if (!auth.currentUser) {
      throw new Error("Please login again.");
    }

    if (!selectedCourseId) {
      throw new Error("Please create a course first.");
    }

    const selectedCourse = courses.find((course) => course.id === selectedCourseId) || {};
    let selectedCourseData = {...selectedCourse};

    try {
      const selectedCourseRef = doc(db, "courses", selectedCourseId);
      const selectedCourseSnap = await getDoc(selectedCourseRef);
      if (selectedCourseSnap.exists()) {
        selectedCourseData = {
          ...selectedCourseData,
          ...selectedCourseSnap.data(),
        };
      }
    } catch (courseError) {
      console.log("FAILED TO LOAD COURSE DETAILS:", courseError);
    }

    let resolvedProfessorName = professorName;
    if (!resolvedProfessorName) {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};
        resolvedProfessorName = getResolvedProfessorName(userData, auth.currentUser);
        setProfessorName(resolvedProfessorName);
      } catch (profileError) {
        console.log("FAILED TO RESOLVE PROFESSOR NAME:", profileError);
        resolvedProfessorName = getResolvedProfessorName({}, auth.currentUser);
      }
    }

    const contentMeta = {
      courseId: selectedCourseId,
      courseName: getResolvedCourseName(selectedCourseData, selectedCourseId),
      courseCode: selectedCourseData.courseCode || "",
      professorId: auth.currentUser.uid,
      professorName: resolvedProfessorName,
    };

    return contentMeta;
  };

  const pickAndUpload = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "Please login again.");
      return;
    }

    if (!selectedCourseId) {
      Alert.alert("Select Course", "Please create a course first.");
      return;
    }

    let pickedFile = null;
    let storagePath = null;
    let downloadURL = null;
    let validation = null;
    let contentMeta = null;

    try {
      contentMeta = await resolveContentMeta();

      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_MIME_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        return;
      }

      setUploading(true);
      pickedFile = result.assets?.[0];
      if (!pickedFile?.uri) {
        throw new Error("No file selected.");
      }

      const response = await fetch(pickedFile.uri);
      const blob = await response.blob();
      const fileSizeBytes = Number(pickedFile.size) || Number(blob.size) || 0;
      validation = validateUploadContract({
        mimeType: pickedFile.mimeType || "",
        fileName: pickedFile.name || "",
        fileSizeBytes,
      });

      const safeName = (pickedFile.name || "upload").replace(/[^\w.-]/g, "_");
      storagePath = `uploads/${auth.currentUser.uid}/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, blob);
      downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "content"), {
        ...contentMeta,
        ownerId: auth.currentUser.uid,
        uploadedBy: auth.currentUser.uid,
        originalVideoURL: downloadURL,
        storagePath,
        originalFileName: pickedFile.name || "uploaded_file",
        mimeType: validation.mimeType,
        type: validation.sourceType,
        sourceFormat: {
          mimeType: validation.mimeType,
          extension: validation.extension,
          sizeBytes: fileSizeBytes,
          maxAllowedBytes: validation.maxBytes,
        },
        conversion: {
          required: true,
          schemaVersion: "v1",
          sourceType: validation.sourceType,
          targetNormalization: validation.normalizedMimeType,
          stage: "queued",
        },
        conversionStatus: "queued",
        normalizedFileURL: null,
        extractedText: null,
        easyReadText: null,
        captions: [],
        textInteractions: [],
        processedAt: null,
        status: "processing",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Upload completed.");
    } catch (error) {
      console.log("UPLOAD ERROR:", error);
      console.log("UPLOAD SERVER RESPONSE:", error?.customData?.serverResponse);

      if (pickedFile && !error?.isValidationError) {
        try {
          const fileSizeBytes = Number(pickedFile.size) || 0;
          await addDoc(collection(db, "content"), {
            ...contentMeta,
            ownerId: auth.currentUser.uid,
            uploadedBy: auth.currentUser.uid,
            originalVideoURL: downloadURL,
            storagePath,
            originalFileName: pickedFile.name || "uploaded_file",
            mimeType: validation?.mimeType || pickedFile.mimeType || "application/octet-stream",
            type: validation?.sourceType || "unknown",
            sourceFormat: {
              mimeType: validation?.mimeType || pickedFile.mimeType || "application/octet-stream",
              extension: validation?.extension || getExtension(pickedFile.name || ""),
              sizeBytes: fileSizeBytes,
              maxAllowedBytes: validation?.maxBytes || null,
            },
            conversion: {
              required: true,
              schemaVersion: "v1",
              sourceType: validation?.sourceType || "unknown",
              targetNormalization: validation?.normalizedMimeType || "unknown",
              stage: "failed_at_upload",
            },
            conversionStatus: "failed",
            normalizedFileURL: null,
            extractedText: null,
            easyReadText: null,
            captions: [],
            textInteractions: [],
            processedAt: null,
            status: "upload_failed",
            errorMessage: error.message || "Upload failed",
            createdAt: serverTimestamp(),
          });
        } catch (docError) {
          console.log("FAILED TO SAVE ERROR DOC:", docError);
        }
      }

      Alert.alert("Error", error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submitYoutubeForTranscript = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "Please login again.");
      return;
    }

    if (!selectedCourseId) {
      Alert.alert("Select Course", "Please create a course first.");
      return;
    }

    const rawUrl = youtubeUrl.trim();
    if (!rawUrl) {
      Alert.alert("Validation Error", "Please paste a YouTube URL.");
      return;
    }

    const videoId = extractYouTubeVideoId(rawUrl);
    if (!videoId) {
      Alert.alert("Validation Error", "Invalid YouTube URL.");
      return;
    }

    setSubmittingYoutube(true);
    try {
      const contentMeta = await resolveContentMeta();
      const canonicalUrl = normalizeYouTubeUrl(videoId);

      await addDoc(collection(db, "content"), {
        ...contentMeta,
        ownerId: auth.currentUser.uid,
        uploadedBy: auth.currentUser.uid,
        originalVideoURL: canonicalUrl,
        youtubeUrl: canonicalUrl,
        youtubeVideoId: videoId,
        storagePath: null,
        originalFileName: `YouTube_${videoId}`,
        mimeType: "text/youtube-url",
        type: "youtube",
        sourceFormat: {
          mimeType: "text/youtube-url",
          extension: "",
          sizeBytes: 0,
          maxAllowedBytes: null,
        },
        conversion: {
          required: true,
          schemaVersion: "v1",
          sourceType: "youtube",
          targetNormalization: "text/plain",
          stage: "queued",
        },
        conversionStatus: "queued",
        normalizedFileURL: null,
        extractedText: null,
        easyReadText: null,
        captions: [],
        textInteractions: [],
        processedAt: null,
        status: "processing",
        createdAt: serverTimestamp(),
      });

      setYoutubeUrl("");
      Alert.alert("Queued", "YouTube transcript extraction started.");
    } catch (error) {
      console.log("YOUTUBE QUEUE ERROR:", error);
      Alert.alert("Error", error.message || "Failed to queue YouTube transcript.");
    } finally {
      setSubmittingYoutube(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Notes or Video</Text>
      <Text style={styles.supportedText}>
        Supported: {SUPPORTED_FORMAT_LABEL}
      </Text>
      {courses.length === 0 ? (
        <Text style={styles.info}>No courses found. Create a course first.</Text>
      ) : (
        <>
          <Text style={styles.info}>Select Course</Text>
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            style={styles.courseList}
            renderItem={({item}) => {
              const selected = selectedCourseId === item.id;
              return (
                <TouchableOpacity
                  style={[styles.courseItem, selected && styles.courseItemSelected]}
                  onPress={() => setSelectedCourseId(item.id)}
                >
                  <Text style={[styles.courseText, selected && styles.courseTextSelected]}>
                    {getResolvedCourseName(item, item.id)} ({item.courseCode || item.id})
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.metaCard}>
            <Text style={styles.metaTitle}>Upload Metadata</Text>
            <Text style={styles.metaText}>
              Course: {getResolvedCourseName(
                courses.find((item) => item.id === selectedCourseId) || {},
                selectedCourseId,
              )}
            </Text>
            <Text style={styles.metaText}>
              Professor: {professorName || "Professor"}
            </Text>
          </View>
          <View style={styles.youtubeCard}>
            <Text style={styles.metaTitle}>YouTube Transcript</Text>
            <Text style={styles.metaText}>
              Paste YouTube URL to extract transcript directly.
            </Text>
            <TextInput
              style={styles.youtubeInput}
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.youtubeButton, submittingYoutube && styles.youtubeButtonDisabled]}
              disabled={submittingYoutube || uploading}
              onPress={submitYoutubeForTranscript}
            >
              <Text style={styles.youtubeButtonText}>
                {submittingYoutube ? "Queuing..." : "Queue YouTube Transcript"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <Button
        title={uploading ? "Uploading..." : "Upload Notes/Video"}
        onPress={pickAndUpload}
        disabled={uploading || submittingYoutube || courses.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  info: {
    marginBottom: 10,
    color: "#555",
    textAlign: "center",
  },
  supportedText: {
    marginBottom: 10,
    color: "#475569",
    fontSize: 12,
    textAlign: "center",
  },
  courseList: {
    width: "100%",
    maxHeight: 180,
    marginBottom: 16,
  },
  courseItem: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  courseItemSelected: {
    borderColor: "#4a6cf7",
    backgroundColor: "#eef2ff",
  },
  courseText: {
    color: "#111",
  },
  courseTextSelected: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
  metaCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#f8fafc",
  },
  metaTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111827",
  },
  metaText: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 3,
  },
  youtubeCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#f8fbff",
  },
  youtubeInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  youtubeButton: {
    backgroundColor: "#1d4ed8",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  youtubeButtonDisabled: {
    opacity: 0.7,
  },
  youtubeButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
