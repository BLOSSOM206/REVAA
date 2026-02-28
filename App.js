import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ProfessorsList from './screens/student/ProfessorsList'
import ProfessorProfile from './screens/student/ProfessorProfile'
import Register from "./screens/auth/Register_s"
import Login_s from './screens/auth/login_s'
import CameraScreen from './screens/student/CameraScreen'
import AssignmentSubmission from './screens/student/AssignmentSubmission'
import ContentScreen from './screens/student/ContentScreen'
import StudentDashboard from './screens/auth/studentDashboard'
import { AccessibilityProvider } from './context/AccessibilityContext'
import RoleSelection from './screens/auth/RoleSelection'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import MyCourse from './screens/student/MyCourse'
import CourseAssignmentsScreen from './screens/student/CourseAssignmentsScreen'
const Stack = createNativeStackNavigator()

export default function App() {
  
 return (
  <SafeAreaProvider>
  <AccessibilityProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RoleSelection">

        
        <Stack.Screen
        name="RoleSelection"
        component={RoleSelection}
        options={{headerShown: false}}/>
        <Stack.Screen 
          name="Register" 
          component={Register}
        />
        <Stack.Screen 
          name="Login" 
          component={Login_s}
          
        />

        <Stack.Screen 
          name="StudentDashboard" 
          component={StudentDashboard}
        />

        <Stack.Screen 
          name="ProfessorProfile"
          component={ProfessorProfile}
        />

        <Stack.Screen 
          name="ProfessorsList"
          component={ProfessorsList}
        />
        <Stack.Screen
  name="MyCourse"
  component={MyCourse}
/>
<Stack.Screen
  name="CourseAssignments"
  component={CourseAssignmentsScreen}
/>
        <Stack.Screen
          name="ContentScreen"
          component={ContentScreen}/>

          <Stack.Screen
          name="AssignmentSubmission"
          component={AssignmentSubmission}/>
          <Stack.Screen
  name="CameraScreen"
  component={CameraScreen}
/>

      </Stack.Navigator>
    </NavigationContainer>
  </AccessibilityProvider></SafeAreaProvider>
)}