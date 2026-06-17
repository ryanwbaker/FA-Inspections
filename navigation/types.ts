import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  SchemaList: undefined
  Inspection: { schemaId: string; loadFilePath?: string }
  Settings: undefined
  ReportPreview: { html: string; filename: string }
}

export type SchemaListScreenProps = NativeStackScreenProps<RootStackParamList, 'SchemaList'>
export type InspectionScreenProps = NativeStackScreenProps<RootStackParamList, 'Inspection'>
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>
export type ReportPreviewScreenProps = NativeStackScreenProps<RootStackParamList, 'ReportPreview'>
