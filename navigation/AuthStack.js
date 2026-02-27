import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfessorLogin from "../screens/professor/ProfessorLogin";
import ProfessorRegister from "../screens/professor/ProfessorRegister";
import LoginS from "../screens/auth/login_s";
import RegisterS from "../screens/auth/Register_s";
import RoleSelect from "../screens/auth/RoleSelect";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="RoleSelect">
      <Stack.Screen
        name="RoleSelect"
        component={RoleSelect}
        options={{title: "Select Role"}}
      />
      <Stack.Screen name="ProfessorLogin" component={ProfessorLogin} />
      <Stack.Screen name="ProfessorRegister" component={ProfessorRegister} />
      <Stack.Screen name="StudentLogin" component={LoginS} />
      <Stack.Screen name="StudentRegister" component={RegisterS} />
    </Stack.Navigator>
  );
}
