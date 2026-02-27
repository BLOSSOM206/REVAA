import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function Login_s({ navigation }) {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async () => {

        if (!email.trim()) {
            alert("Enter email!")
            return
        }

        if (!password) {
            alert("Enter password")
            return
        }

        try {
            const userCredentials = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredentials.user

            if (!user.emailVerified) {
                alert("Please verify the email!")
                return
            }

            const docRef = doc(db, "users", user.uid)
            const docSnap = await getDoc(docRef)

            if (!docSnap.exists()) {
                alert("User data not found.")
                return
            }

            const userData = docSnap.data()

            if (userData.role === "student") {
                navigation.replace("StudentDashboard", { userId: user.uid })
            }

        } catch (e) {
            alert(e.message)
        }
    }

   
       return (
  <View style={styles.container}>
    <View style={styles.card}>
      
      <Text style={styles.heading}>Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>LOGIN</Text>
      </TouchableOpacity>

    </View>
  </View>
);
    
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF0F6",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 18,
    elevation: 6, // Android shadow
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
    color: "#222",
  },

  input: {
    backgroundColor: "#F5F7FA",
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
  },

  loginButton: {
    backgroundColor: "#2196F3", // Android blue
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  loginText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});