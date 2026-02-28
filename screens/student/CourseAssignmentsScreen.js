import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import AppText from "../components/AppText";

export default function CourseAssignmentsScreen({ route, navigation }) {
  const { courseCode } = route.params;
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, [courseCode]);

  const fetchAssignments = async () => {
    try {
      const q = query(
        collection(db, "assignments"),
        where("courseCode", "==", courseCode)
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAssignments(list);
    } catch (error) {
      console.log("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.header}>
        Assignments for {courseCode}
      </AppText>

      {loading ? (
        <AppText>Loading...</AppText>
      ) : assignments.length === 0 ? (
        <AppText>No assignments found.</AppText>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <AppText style={styles.title}>
                {item.templateFileName}
              </AppText>

              {item.description ? (
                <AppText style={styles.desc}>
                  {item.description}
                </AppText>
              ) : null}

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() =>
                  navigation.navigate("AssignmentSubmission", {
                    assignmentId: item.id,
                    courseCode: courseCode,
                  })
                }
              >
                <AppText style={{ color: "white" }}>
                  Submit
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#F9FAFB" 
  },

  header: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20 
  },

  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 3,
  },

  title: { 
    fontSize: 16, 
    fontWeight: "bold" 
  },

  desc: { 
    fontSize: 13, 
    color: "#6B7280", 
    marginTop: 5 
  },

  submitBtn: {
    marginTop: 12,
    backgroundColor: "#16A34A",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});