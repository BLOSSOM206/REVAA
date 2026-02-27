import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ProfessorsList from './screens/student/ProfessorsList'
import ProfessorProfile from './screens/student/ProfessorProfile'
import Register from "./screens/auth/Register_s"
import Login_s from './screens/auth/login_s'
import ContentScreen from './screens/student/ContentScreen'
import StudentDashboard from './screens/auth/studentDashboard'
import { AccessibilityProvider } from './context/AccessibilityContext'
import RoleSelection from './screens/auth/RoleSelection'

const Stack = createNativeStackNavigator()

export default function App() {
  
 return (
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
          name="ContentScreen"
          component={ContentScreen}/>

      </Stack.Navigator>
    </NavigationContainer>
  </AccessibilityProvider>
)}