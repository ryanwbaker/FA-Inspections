import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SchemaListScreen from '../screens/SchemaListScreen'
import InspectionScreen from '../screens/InspectionScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SchemaList" component={SchemaListScreen} />
        <Stack.Screen name="Inspection" component={InspectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
