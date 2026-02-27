import { collection, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import { Text, View,TouchableOpacity } from "react-native";
import { onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import ProfessorProfile from "./ProfessorProfile";

export default function ProfessorsList({navigation}) {
   const [professors,setProfessors]=useState([])
   
   useEffect(()=>{
      const q=query(
         collection(db,"users"),
         where("role","==","professor")
      )
      const unsubscribe =onSnapshot(q,((snapshot)=>{
            const data=snapshot.docs.map((prof)=>{
               return {
                  id:prof.id,
                  ...prof.data()
               }
            })
            setProfessors(data)
      }))
      return ()=>unsubscribe()

   },[])
   
   return (
  <View style={styles.container}>
    
    <Text style={styles.heading}>Professors</Text>

    {professors.map((prof) => (
      <TouchableOpacity
        key={prof.id}
        style={styles.card}
        onPress={() =>
          navigation.navigate("ProfessorProfile", {
            professorId: prof.id,
          })
        }
      >
        <Text style={styles.name}>{prof.name}</Text>
      </TouchableOpacity>
    ))}

  </View>
);
}
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF0F6",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#222",
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 5, // Android shadow
  },

  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
});