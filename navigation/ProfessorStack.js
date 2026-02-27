import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { auth } from "../services/firebaseConfig";

import ProfessorLogin from "../screens/professor/ProfessorLogin";
import ProfessorRegister from "../screens/professor/ProfessorRegister";
import ProfessorDashboard from "../screens/professor/ProfessorDashboard";
import ProfessorProfile from "../screens/professor/ProfessorProfile";
import NotesUploadScreen from "../screens/professor/NotesUploadScreen";
import ContentPreviewScreen from "../screens/professor/ContentPreviewScreen";
import CreateCourseScreen from "../screens/professor/CreateCourseScreen";

const Stack = createNativeStackNavigator();

export default function ProfessorStack() {
  const user = auth.currentUser;

  return (
    <Stack.Navigator
      initialRouteName={user ? "ProfessorDashboard" : "ProfessorLogin"}
    >
      <Stack.Screen
        name="ProfessorLogin"
        component={ProfessorLogin}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ProfessorRegister"
        component={ProfessorRegister}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ProfessorDashboard"
        component={ProfessorDashboard}
      />

      <Stack.Screen
        name="ProfessorProfile"
        component={ProfessorProfile}
      />

      <Stack.Screen
        name="NotesUpload"
        component={NotesUploadScreen}
      />

      <Stack.Screen
        name="ContentPreview"
        component={ContentPreviewScreen}
      />

      <Stack.Screen
        name="CreateCourse"
        component={CreateCourseScreen}
      />
    </Stack.Navigator>
  );
}
