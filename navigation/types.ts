import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  SchemaList:       undefined
  Inspection:       { schemaId: string; themeId?: string; loadFilePath?: string }
  Settings:         undefined
  SettingsDefaults: undefined
  SettingsSchemas:  undefined
  SettingsThemes:   undefined
  SettingsTemplates: undefined
  ReportPreview:    { html: string; filename: string }
}

export type SchemaListScreenProps    = NativeStackScreenProps<RootStackParamList, 'SchemaList'>
export type InspectionScreenProps    = NativeStackScreenProps<RootStackParamList, 'Inspection'>
export type SettingsScreenProps      = NativeStackScreenProps<RootStackParamList, 'Settings'>
export type SettingsDefaultsProps    = NativeStackScreenProps<RootStackParamList, 'SettingsDefaults'>
export type SettingsSchemasProps     = NativeStackScreenProps<RootStackParamList, 'SettingsSchemas'>
export type SettingsThemesProps      = NativeStackScreenProps<RootStackParamList, 'SettingsThemes'>
export type SettingsTemplatesProps   = NativeStackScreenProps<RootStackParamList, 'SettingsTemplates'>
export type ReportPreviewScreenProps = NativeStackScreenProps<RootStackParamList, 'ReportPreview'>
