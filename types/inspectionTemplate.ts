export interface InspectionTemplate {
  id: string
  name: string
  schemaId: string
  themeId: string
  system: boolean    // system templates can be hidden but not deleted
  hidden?: boolean   // user-controlled visibility for system templates
  createdAt: string
}
