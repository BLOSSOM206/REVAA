import React, {useEffect, useState} from "react";
import {NavigationContainer} from "@react-navigation/native";
import {View, ActivityIndicator, Text, TouchableOpacity} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import {doc, getDoc} from "firebase/firestore";
import {auth, db} from "./services/firebaseConfig";

import AuthStack from "./navigation/AuthStack";
import ProfessorStack from "./navigation/ProfessorStack";
import StudentStack from "./navigation/StudentStack";

function normalizeRole(role) {
  if (typeof role !== "string") {
    return null;
  }
  return role.trim().toLowerCase();
}

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const normalizedRole = normalizeRole(docSnap.data().role);
            setRole(normalizedRole || "unknown");
          } else {
            setRole("unknown");
          }
        } catch (error) {
          console.log("Failed to load user role:", error);
          setRole("unknown");
        }
      } else {
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : role === "professor" ? (
        <ProfessorStack />
      ) : role === "student" ? (
        <StudentStack />
      ) : (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <Text>Invalid role: {String(role)}</Text>
          <TouchableOpacity
            onPress={() => auth.signOut()}
            style={{marginTop: 12}}
          >
            <Text style={{color: "#007AFF"}}>Sign out</Text>
          </TouchableOpacity>
        </View>
      )}
    </NavigationContainer>
  );
}
