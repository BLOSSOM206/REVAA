import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StudentHome from "../screens/student/StudentHome";
import AccessibilitySettingsScreen from "../screens/student/AccessibilitySettingsScreen";

const Stack = createNativeStackNavigator();

export default function StudentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StudentHome" component={StudentHome} />
      <Stack.Screen
        name="AccessibilitySettings"
        component={AccessibilitySettingsScreen}
        options={{title: "Accessibility"}}
      />
    </Stack.Navigator>
  );
}
