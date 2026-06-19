import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../tokens'
import type { SettingsScreenProps } from '../navigation/types'

type NavRow = {
  label: string
  description: string
  icon: React.ComponentProps<typeof Feather>['name']
  screen: 'SettingsDefaults' | 'SettingsSchemas' | 'SettingsThemes' | 'SettingsTemplates'
}

const ROWS: NavRow[] = [
  {
    label: 'Defaults',
    description: 'Company info, technician, logo, and location defaults',
    icon: 'user',
    screen: 'SettingsDefaults',
  },
  {
    label: 'Form Schemas',
    description: 'Import and manage form schemas',
    icon: 'file-text',
    screen: 'SettingsSchemas',
  },
  {
    label: 'PDF Themes',
    description: 'Import and manage PDF report themes',
    icon: 'layout',
    screen: 'SettingsThemes',
  },
  {
    label: 'Templates',
    description: 'Combine a schema and theme into a reusable template',
    icon: 'layers',
    screen: 'SettingsTemplates',
  },
]

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          {ROWS.map((row, i) => (
            <TouchableOpacity
              key={row.screen}
              style={[s.row, i < ROWS.length - 1 && s.rowBorder]}
              onPress={() => navigation.navigate(row.screen)}
              activeOpacity={0.7}
            >
              <View style={s.iconWrap}>
                <Feather name={row.icon} size={18} color={Colors.accent} />
              </View>
              <View style={s.rowBody}>
                <Text style={s.rowLabel}>{row.label}</Text>
                <Text style={s.rowDesc} numberOfLines={1}>{row.description}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.secondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 56,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary },
  rowDesc: { fontSize: FontSize.sm, color: Colors.secondary, marginTop: 1 },
})
