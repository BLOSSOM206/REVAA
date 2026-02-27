import { View,Text,Button,FlatList,StyleSheet } from "react-native";
import { useAccessibility } from "../../context/AccessibilityContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { useEffect, useState } from "react";
import { EmailAuthCredential } from "firebase/auth/web-extension";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Video } from "expo-av";
import {WebView} from "react-native-webview"
import AppText from "../components/AppText";

export default function ContentScreen()

{
    const {userId,accessibilityType}=useAccessibility()
    const [enrolledProfessorIds, setEnrolledProfessorIds] = useState([]);
    const [contentList, setContentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const convertToEmbed = (url) => {
  if (!url) return "";
  const videoId = url.split("v=")[1];
  return `https://www.youtube.com/embed/${videoId}`;
};

    useEffect(()=>{
        const auth = getAuth()
        console.log("Auth UID ",auth.currentUser?.uid)
        if(!auth.currentUser)
        {
            console.log("User auth not ready!")
            return
        }
         if(!userId)
    {
        return
    }
    const q = query(collection(db,"enrollments"),where("studentId","==",userId))
    const unsubscribe=onSnapshot(q,(snapshot)=>{
        const professorId = snapshot.docs.map(doc=>doc.data().professorId)
        console.log("Enrolled Professor: ",professorId)
        setEnrolledProfessorIds(professorId)
        
    })
        return ()=>unsubscribe()
    },[userId])

    //fetch professors 
    useEffect(()=>{
        if(enrolledProfessorIds.length===0)
        {
            setLoading(false)
            return
        }

        const q=query(collection(db,"content"),where("uploadedBy","in",enrolledProfessorIds))
        const unsubscribe = onSnapshot(q,(snapshot)=>{
            const contents= snapshot.docs.map((content)=>({
                id:content.id,
                ...content.data(),
            }))
            console.log("Contents fetched: ",contents)

            setContentList(contents)
            setLoading(false)

        })
        return ()=>unsubscribe()
    },[enrolledProfessorIds])
     if(loading)
   {
    return(
        <View>
            <AppText>
                loading.....
            </AppText>
        </View>
    )
   }
    
   if( !loading && contentList.length===0)
   {
    return (
        <View>
            <AppText>
                No Content yet
            </AppText>
        </View>
    )
   }
  
    
   return (
  <View style={styles.container}>
    
    {/* Top Header */}
    <View style={styles.topSection}>
      <AppText style={styles.header}>Content Feed</AppText>

      <View style={styles.modePill}>
        <AppText style={styles.modeText}>
          Accessibility Mode: {accessibilityType}
        </AppText>
      </View>
    </View>

    <FlatList
      data={contentList}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 30 }}
      renderItem={({ item }) => (
        <View style={styles.card}>

          {/* Course + Professor */}
          <AppText style={styles.courseName}>
            {item.courseName||"Course Name"}
          </AppText>

          <AppText style={styles.profName}>
            {item.professorName||"Professor Name"}
          </AppText>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Accessibility Content */}
          {item.status !== "completed" ? (
            <AppText style={styles.processing}>
              Generating accessible format...
            </AppText>
          ) : (
            <>
            
       {accessibilityType === "Deaf" && item.signVideoURL && (
  <>
    {item.videoType === "mp4" && (
      <Video
        source={{ uri: item.signVideoURL }}
        style={styles.video}
        useNativeControls
        resizeMode="contain"
      />
    )}

    {item.videoType === "youtube" && (
      <WebView
        source={{ uri: convertToEmbed(item.signVideoURL) }}
        style={{ height: 250 }}
      />
    )}
  </>
)}

              {accessibilityType === "Mute" && (
                <AppText style={styles.contentText}>
                  {item.transcript}
                </AppText>
              )}

              {accessibilityType === "Dyslexic" && (
                <AppText style={styles.dyslexicText}>
                  {item.transcript}
                </AppText>
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
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  /* Top Section */
  topSection: {
    marginBottom: 20,
  },

  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },

  modePill: {
    alignSelf: "flex-start",
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },

  modeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  /* Card */
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  courseName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },

  profName: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },

  contentText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },

  processing: {
    fontSize: 14,
    color: "#F59E0B",
    fontStyle: "italic",
  },

  dyslexicText: {
    fontSize: 18,
    lineHeight: 28,
    color: "#1E293B",
    letterSpacing: 0.5,
    fontFamily:"Lexend-Regular"
  },
  mediaContainer: {
  marginTop: 12,
},

video: {
  width: "100%",
  height: 220,
  borderRadius: 12,
  backgroundColor: "#000",
},

sectionLabel: {
  fontSize: 16,
  fontWeight: "600",
  marginBottom: 8,
  color: "#0F172A",
},

fallbackText: {
  color: "#DC2626",
  marginBottom: 6,
  fontSize: 13,
},
});