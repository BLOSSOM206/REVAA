import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, deleteObject } from "firebase/storage";
import { auth, db, storage } from "../../services/firebaseConfig";

export default function ProfessorDashboard({ navigation }) {
  const [content, setContent] = useState([]);
  const [courses, setCourses] = useState([]);
  const [professorDisplayName, setProfessorDisplayName] = useState("");

  useEffect(() => {
    const loadProfessorDisplayName = async () => {
      if (!auth.currentUser) {
        return;
      }

      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};
        const resolvedName =
          userData.name ||
          userData.fullName ||
          userData.displayName ||
          auth.currentUser.displayName ||
          "Professor";
        setProfessorDisplayName(resolvedName);
      } catch (error) {
        console.log("FAILED TO LOAD PROFESSOR DISPLAY NAME:", error);
        setProfessorDisplayName(auth.currentUser.displayName || "Professor");
      }
    };

    loadProfessorDisplayName();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const courseQuery = query(
      collection(db, "courses"),
      where("professors", "array-contains", auth.currentUser.uid)
    );

    const unsubscribeCourses = onSnapshot(courseQuery, (snapshot) => {
      const courseData = snapshot.docs.map((courseDoc) => ({
        id: courseDoc.id,
        ...courseDoc.data(),
      }));
      setCourses(courseData);
    });

    return unsubscribeCourses;
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }

    // Show professor's uploads directly so content stays visible even if course list is empty.
    const contentQuery = query(
      collection(db, "content"),
      where("uploadedBy", "==", auth.currentUser.uid)
    );

    const unsubscribeContent = onSnapshot(contentQuery, (snapshot) => {
      const data = snapshot.docs.map((contentDoc) => ({
        id: contentDoc.id,
        ...contentDoc.data(),
      }));
      setContent(data);
    });

    return unsubscribeContent;
  }, []);

  const processingCount = content.filter(
    (item) => item.status === "processing"
  ).length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Logout failed:", error);
    }
  };

  const handleDelete = async (item) => {
    try {
      // Only owner can delete
      if ((item.ownerId || item.uploadedBy) !== auth.currentUser.uid) {
        Alert.alert("Not Allowed", "You cannot delete this content.");
        return;
      }

      if (item.storagePath) {
        const storageRef = ref(storage, item.storagePath);
        await deleteObject(storageRef);
      }

      await deleteDoc(doc(db, "content", item.id));
    } catch (error) {
      console.log("DELETE ERROR:", error);
      Alert.alert("Delete failed", error.message || "Could not delete item");
    }
  };

  const handleDeleteCourse = async (course) => {
    Alert.alert(
      "Delete Course",
      `Delete "${course.name || "this course"}" and all its uploaded content?`,
      [
        {text: "Cancel", style: "cancel"},
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!auth.currentUser) return;
              if (!Array.isArray(course.professors) ||
                !course.professors.includes(auth.currentUser.uid)) {
                Alert.alert("Not Allowed", "You cannot delete this course.");
                return;
              }

              const courseContentQuery = query(
                collection(db, "content"),
                where("courseId", "==", course.id),
              );
              const contentSnapshot = await getDocs(courseContentQuery);

              for (const contentDoc of contentSnapshot.docs) {
                const contentData = contentDoc.data() || {};
                if (contentData.storagePath) {
                  try {
                    await deleteObject(ref(storage, contentData.storagePath));
                  } catch (storageError) {
                    console.log("CONTENT FILE DELETE ERROR:", storageError);
                  }
                }
                await deleteDoc(contentDoc.ref);
              }

              await deleteDoc(doc(db, "courses", course.id));
            } catch (error) {
              console.log("DELETE COURSE ERROR:", error);
              Alert.alert(
                "Delete failed",
                error.message || "Could not delete course",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.welcome}>Professor Dashboard</Text>
        <Text style={styles.email}>{professorDisplayName || "Professor"}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Uploads</Text>
          <Text style={styles.cardValue}>{content.length}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Processing</Text>
          <Text style={styles.cardValue}>{processingCount}</Text>
        </View>
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("NotesUpload")}
      >
        <Text style={styles.buttonText}>+ Upload New Content</Text>
      </TouchableOpacity>

      {/* Create Course Button */}
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: "#34c759" }]}
        onPress={() => navigation.navigate("CreateCourse")}
      >
        <Text style={styles.buttonText}>+ Create New Course</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>My Courses</Text>
          {courses.length === 0 ? (
            <Text style={styles.emptyText}>No courses created yet.</Text>
          ) : (
            courses.map((course) => (
              <View key={course.id} style={styles.courseItem}>
                <View style={{flex: 1}}>
                  <Text style={styles.listTitle}>{course.name || "Untitled"}</Text>
                  <Text style={styles.courseCode}>
                    {course.courseCode || course.id}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCourse(course)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>My Uploaded Content</Text>
          {content.length === 0 ? (
            <Text style={styles.emptyText}>No content uploaded yet.</Text>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={content}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate("ContentPreview", { item })}
                  >
                    {(() => {
                      const mappedCourse = courses.find((course) => course.id === item.courseId);
                      const resolvedCourseName =
                        item.courseName ||
                        mappedCourse?.name ||
                        mappedCourse?.courseName ||
                        mappedCourse?.courseCode ||
                        item.courseId ||
                        "Unknown Course";
                      const resolvedProfessorName =
                        item.professorName || professorDisplayName || "Professor";

                      return (
                        <>
                          <Text style={styles.listTitle}>
                            {item.originalFileName || item.type?.toUpperCase() || "CONTENT"}
                          </Text>
                          <View style={styles.metaWrap}>
                            <Text style={styles.metaText}>
                              Course: {resolvedCourseName}
                            </Text>
                            <Text style={styles.metaText}>
                              Professor: {resolvedProfessorName}
                            </Text>
                          </View>
                        </>
                      );
                    })()}
                    <Text>Status: {item.status || "unknown"}</Text>
                  </TouchableOpacity>

                  {(item.ownerId || item.uploadedBy) === auth.currentUser.uid && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    padding: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: "#4a6cf7",
  },
  logoutButton: {
    position: "absolute",
    right: 20,
    top: 40,
  },
  logoutText: {
    color: "white",
    fontWeight: "bold",
  },
  welcome: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
  },
  email: {
    color: "white",
    marginTop: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: -30,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    width: "48%",
    elevation: 5,
  },
  cardTitle: {
    fontSize: 14,
    color: "gray",
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  primaryButton: {
    backgroundColor: "#4a6cf7",
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  sectionWrap: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: "#666",
    marginBottom: 8,
  },
  courseItem: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  courseCode: {
    color: "#666",
    marginTop: 4,
    fontSize: 12,
  },
  listItem: {
    backgroundColor: "white",
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  listTitle: {
    fontWeight: "bold",
  },
  metaWrap: {
    marginTop: 6,
    marginBottom: 4,
  },
  metaText: {
    color: "#4b5563",
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
