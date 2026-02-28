import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity,StyleSheet } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import AppText from "../components/AppText";
import { getAuth } from "firebase/auth";

export default function MyCourse({ navigation }) {
  const [courses, setCourses] = useState([]);

 useEffect(() => {
  const auth = getAuth();

  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      fetchCourses(user.uid);
    } else {
      console.log("No user logged in");
    }
  });

  return () => unsubscribe();
}, []);

 const fetchCourses = async (uid) => {
  try {
    console.log("Fetching courses for:", uid);

    const q = query(
      collection(db, "enrollments"),
      where("studentId", "==", uid)
    );

    const snapshot = await getDocs(q);

    console.log("Enrollments found:", snapshot.docs.length);

    const enrolledCourses = snapshot.docs.map(doc => doc.data().courseCode);

    setCourses(enrolledCourses);

  } catch (error) {
    console.log("Error fetching courses:", error);
  }
};
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <FlatList
        data={courses}
        keyExtractor={(item, index) => index.toString()}
       renderItem={({ item }) => (
  <TouchableOpacity
    style={styles.courseCard}
    onPress={() =>
      navigation.navigate("CourseAssignments", { courseCode: item })
    }
  >
    <AppText style={styles.courseTitle}>{item}</AppText>
    <AppText style={styles.courseSub}>Tap to view assignments</AppText>
  </TouchableOpacity>
)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  courseCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 3,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  courseSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 5,
  },
});