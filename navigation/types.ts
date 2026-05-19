import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  SchemaList: undefined
  Inspection: { schemaId: string; loadFilePath?: string }
}

export type SchemaListScreenProps = NativeStackScreenProps<RootStackParamList, 'SchemaList'>
export type InspectionScreenProps = NativeStackScreenProps<RootStackParamList, 'Inspection'>
