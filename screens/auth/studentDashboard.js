import { useEffect, useState } from "react";
import { Text, View, ScrollView ,Button,StyleSheet} from "react-native";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore"
import { db } from "../../services/firebaseConfig"
import DashBoardCard from "../components/DashBoardCards";
import { useAccessibility } from '../../context/AccessibilityContext'
import AppText from "../components/AppText";
export default function StudentDashboard({ route, navigation }) {

    const { userId } = route.params
    const {setAccessibilityType,setUserName,setUserId}=useAccessibility()
    const [userData, setUserData] = useState(null)
    const DashboardItems =[
        {title:"My Courses",screen:"MyCourse"},
        {title:"Professors",screen:"ProfessorsList"},
        {title:"Content",screen:"ContentScreen"},
        
        
        
    ]
    
    // Fetch user
    useEffect(() => {
        const fetchUser = async () => {
            const docRef = doc(db, "users", userId)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                const data=docSnap.data()
                console.log("Fetched User: ",data)
                console.log("Setting Users: ",userId)
                setUserData(data)
                setAccessibilityType(data.accessibilityType)
                setUserName(data.name)
                setUserId(userId)
                console.log("Context userid",userId)
                
            }
        }

        fetchUser()
    }, [userId])

   

   return (
  <ScrollView style={{ padding: 20 }}>
    <AppText style={styles.header}>
      Student Dashboard
    </AppText>

    {userData && (
      <AppText style={styles.subHeader}>
        Welcome, {userData.name}
      </AppText>
    )}

    <View style={styles.grid}>
      {DashboardItems.map((item, index) => (
        <DashBoardCard
          key={index}
          title={item.title}
          onPress={() => navigation.navigate(item.screen)}
        />
      ))}
    </View>
  </ScrollView>
);
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9", // light gray modern bg
    padding: 20,
  },

  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
  },

  subHeader: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});