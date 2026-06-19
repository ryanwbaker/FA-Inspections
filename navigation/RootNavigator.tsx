import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SchemaListScreen       from '../screens/SchemaListScreen'
import InspectionScreen       from '../screens/InspectionScreen'
import SettingsScreen         from '../screens/SettingsScreen'
import DefaultsScreen         from '../screens/settings/DefaultsScreen'
import SchemasScreen          from '../screens/settings/SchemasScreen'
import ThemesScreen           from '../screens/settings/ThemesScreen'
import TemplatesScreen        from '../screens/settings/TemplatesScreen'
import ReportPreviewScreen    from '../screens/ReportPreviewScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SchemaList"        component={SchemaListScreen} />
        <Stack.Screen name="Inspection"        component={InspectionScreen} />
        <Stack.Screen name="Settings"          component={SettingsScreen} />
        <Stack.Screen name="SettingsDefaults"  component={DefaultsScreen} />
        <Stack.Screen name="SettingsSchemas"   component={SchemasScreen} />
        <Stack.Screen name="SettingsThemes"    component={ThemesScreen} />
        <Stack.Screen name="SettingsTemplates" component={TemplatesScreen} />
        <Stack.Screen name="ReportPreview"     component={ReportPreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
