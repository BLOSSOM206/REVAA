import { View, Text,Button } from "react-native"
import { useEffect, useState } from "react"

import { db } from "../../services/firebaseConfig"

import { auth } from "../../services/firebaseConfig"
import {
  getDoc,
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  serverTimestamp
} from "firebase/firestore"
import { StyleSheet } from "react-native"

export default function ProfessorProfile({ route }) {
   console.log("Prof profile page loaded")
   const { professorId } = route.params
   console.log("Professor ID received:", professorId)
   const [professor,setProfessor]=useState(null)
   const [contentList, setContentList] = useState([])
   const [enrolled,setEnrolled]=useState(false)
   const studentId = auth.currentUser?.uid

   useEffect(()=>{
    const fetchProfessor = async ()=>{
        const docRef = doc(db,"users",professorId)
        const snapDoc = await getDoc(docRef)
        console.log("Doc exists?", snapDoc.exists())

        if(snapDoc.exists())
        {
            setProfessor(snapDoc.data())
            console.log("Professor data:", snapDoc.data())
        }
    
   }
   fetchProfessor()
   },[professorId])
    // Listen to content
       useEffect(() => {
           const q=query(
            collection(db,"content"),
            where("uploadedBy","==",professorId)
           )
   
           const unsubscribe = onSnapshot(
               q,
               (snapshot) => {
   
                   const data = snapshot.docs.map((doc) => ({
                       id: doc.id,
                       ...doc.data()
                   }))
   
                   setContentList(data)
                   console.log("Content list:", data)
               }
           )
   
           return () => unsubscribe()
       }, [professorId])
      const handleEnrollment = async () => {
  console.log("Enroll button clicked")

  if (!studentId) {
    console.log("Student ID is missing")
    return
  }

  try {
    await setDoc(
      doc(db, "enrollments", `${studentId}_${professorId}`),
      {
        studentId,
        professorId,
        createdAt: serverTimestamp()
      }
    )

    console.log("Enrollment written to Firestore")
    setEnrolled(true)
  } catch (error) {
    console.log("Enrollment error:", error)
  }
}
useEffect(()=>
{
   const checkEnrollment=async ()=>{
      
      const enrollementDoc= await getDoc(
         doc(db,"enrollments",`${studentId}_${professorId}`)
      )
      if(enrollementDoc.exists())
      {
         setEnrolled(true)
      }
   }
   checkEnrollment()
},[professorId,studentId])
  return (
  <View style={styles.container}>
    {/* Professor Header */}
    <View style={styles.headerCard}>
      <Text style={styles.profName}>
        {professor?.name}
      </Text>

      <Button
        title={enrolled ? "Enrolled ✓" : "Enroll"}
        onPress={handleEnrollment}
        disabled={enrolled}
      />
    </View>

    {/* Content Section */}
    <Text style={styles.sectionTitle}>Learning Content</Text>

    {contentList.length === 0 ? (
      <Text style={styles.emptyText}>
        No content uploaded yet.
      </Text>
    ) : (
      contentList.map((content) => (
        <View key={content.id} style={styles.contentCard}>
          <Text style={styles.contentTitle}>
            {content.originalFileName}
          </Text>

          <Text style={styles.contentType}>
            Type: {content.type}
          </Text>
        </View>
      ))
    )}
  </View>
)
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f6fa"
  },

  headerCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3
  },

  profName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2f3640"
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#353b48"
  },

  contentCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2
  },

  contentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f3640"
  },

  contentType: {
    marginTop: 5,
    fontSize: 13,
    color: "#718093"
  },

  emptyText: {
    color: "#7f8c8d",
    fontStyle: "italic",
    marginTop: 10
  }
})