import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfessorLogin from "../screens/professor/ProfessorLogin";
import ProfessorRegister from "../screens/professor/ProfessorRegister";
import ProfessorDashboard from "../screens/professor/ProfessorDashboard";
import ProfessorProfile from "../screens/professor/ProfessorProfile";
import AppointmentsScreen from "../screens/professor/AppointmentsScreen";
import NotesUploadScreen from "../screens/professor/NotesUploadScreen";
import MessagesScreen from "../screens/professor/MessagesScreen";

const Stack = createNativeStackNavigator();

export default function ProfessorNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ProfessorLogin">
        <Stack.Screen name="ProfessorLogin" component={ProfessorLogin} />
        <Stack.Screen name="ProfessorRegister" component={ProfessorRegister} />
        <Stack.Screen name="ProfessorDashboard" component={ProfessorDashboard} />
        <Stack.Screen name="ProfessorProfile" component={ProfessorProfile} />
        <Stack.Screen name="Appointments" component={AppointmentsScreen} />
        <Stack.Screen name="NotesUpload" component={NotesUploadScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}