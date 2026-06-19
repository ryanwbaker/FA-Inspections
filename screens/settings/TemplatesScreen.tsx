import { useCallback, useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import type { SettingsTemplatesProps } from '../../navigation/types'
import {
  listAllTemplates, saveUserTemplate, deleteUserTemplate,
  setSystemTemplateHidden, isSystemTemplate, newTemplateId,
} from '../../services/templateStore'
import { listAllSchemas } from '../../services/schemaStore'
import { listAllThemes } from '../../services/themeStore'
import type { InspectionTemplate } from '../../types/inspectionTemplate'
import type { InspectionSchema } from '../../form_schema/types'
import type { PdfTheme } from '../../types/pdfTheme'
import { ConfirmModal } from '../../components/primitives'

export default function TemplatesScreen({ navigation }: SettingsTemplatesProps) {
  const [templates, setTemplates] = useState<InspectionTemplate[]>([])
  const [schemas, setSchemas] = useState<InspectionSchema[]>([])
  const [themes, setThemes] = useState<PdfTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<InspectionTemplate | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSchemaId, setNewSchemaId] = useState('')
  const [newThemeId, setNewThemeId] = useState('default')

  useFocusEffect(useCallback(() => {
    Promise.all([listAllTemplates(), listAllSchemas(), listAllThemes()])
      .then(([tmpl, sch, thm]) => { setTemplates(tmpl); setSchemas(sch); setThemes(thm) })
      .finally(() => setLoading(false))
  }, []))

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteUserTemplate(deleteTarget.id)
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id))
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete template.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggleHidden = async (template: InspectionTemplate) => {
    const hidden = !template.hidden
    await setSystemTemplateHidden(template.id, hidden)
    setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, hidden } : t))
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newSchemaId || !newThemeId) return
    const t = await saveUserTemplate({
      id: newTemplateId(),
      name: newName.trim(),
      schemaId: newSchemaId,
      themeId: newThemeId,
      hidden: false,
    })
    setTemplates(prev => [...prev, t])
    setShowNewModal(false)
    setNewName('')
  }

  const schemaName = (id: string) => schemas.find(s => s.id === id)?.title ?? id
  const themeName  = (id: string) => themes.find(t => t.id === id)?.name  ?? id

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Templates</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => {
          setNewSchemaId(schemas[0]?.id ?? '')
          setNewThemeId(themes[0]?.id ?? 'default')
          setNewName('')
          setShowNewModal(true)
        }}>
          <Feather name="plus" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} />
        ) : (
          <View style={s.card}>
            {templates.map((tmpl, i) => {
              const system = isSystemTemplate(tmpl.id)
              return (
                <View key={tmpl.id} style={[s.row, i < templates.length - 1 && s.rowBorder, tmpl.hidden && s.rowHidden]}>
                  <View style={s.rowBody}>
                    <View style={s.rowTop}>
                      <Text style={[s.rowLabel, tmpl.hidden && s.rowLabelMuted]} numberOfLines={1}>{tmpl.name}</Text>
                      {system && <View style={s.systemBadge}><Text style={s.systemBadgeText}>System</Text></View>}
                      {tmpl.hidden && <View style={s.hiddenBadge}><Text style={s.hiddenBadgeText}>Hidden</Text></View>}
                    </View>
                    <Text style={s.rowMeta} numberOfLines={1}>
                      {schemaName(tmpl.schemaId)} · {themeName(tmpl.themeId)}
                    </Text>
                  </View>
                  {system ? (
                    <TouchableOpacity onPress={() => handleToggleHidden(tmpl)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name={tmpl.hidden ? 'eye-off' : 'eye'} size={16} color={Colors.secondary} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => setDeleteTarget(tmpl)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="trash-2" size={16} color={Colors.fail} />
                    </TouchableOpacity>
                  )}
                </View>
              )
            })}
          </View>
        )}
        <Text style={s.hint}>
          Templates combine a form schema and a PDF theme. System templates can be hidden from the home screen.
        </Text>
      </ScrollView>

      {/* New template modal */}
      <Modal visible={showNewModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalSafe}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewModal(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>New Template</Text>
            <TouchableOpacity onPress={handleCreate} disabled={!newName.trim() || !newSchemaId}>
              <Text style={[s.doneText, (!newName.trim() || !newSchemaId) && s.doneDisabled]}>Create</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalContent}>
            <Text style={s.fieldLabel}>Name</Text>
            <TextInput
              style={s.textInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Annual Fire Alarm Inspection"
              placeholderTextColor={Colors.secondary}
              autoFocus
            />

            <Text style={[s.fieldLabel, { marginTop: Spacing.lg }]}>Form Schema</Text>
            <View style={s.pickerCard}>
              {schemas.map((sch, i) => (
                <TouchableOpacity
                  key={sch.id}
                  style={[s.pickerRow, i < schemas.length - 1 && s.rowBorder]}
                  onPress={() => setNewSchemaId(sch.id)}
                >
                  <Text style={[s.pickerRowLabel, newSchemaId === sch.id && s.pickerRowSelected]} numberOfLines={1}>
                    {sch.title}
                  </Text>
                  {newSchemaId === sch.id && <Feather name="check" size={16} color={Colors.accent} />}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.fieldLabel, { marginTop: Spacing.lg }]}>PDF Theme</Text>
            <View style={s.pickerCard}>
              {themes.map((thm, i) => (
                <TouchableOpacity
                  key={thm.id}
                  style={[s.pickerRow, i < themes.length - 1 && s.rowBorder]}
                  onPress={() => setNewThemeId(thm.id)}
                >
                  <Text style={[s.pickerRowLabel, newThemeId === thm.id && s.pickerRowSelected]} numberOfLines={1}>
                    {thm.name}
                  </Text>
                  {newThemeId === thm.id && <Feather name="check" size={16} color={Colors.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Template"
        message={deleteTarget ? `Delete "${deleteTarget.name}"?` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, minHeight: 56,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowHidden: { opacity: 0.5 },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary, flex: 1 },
  rowLabelMuted: { color: Colors.secondary },
  rowMeta: { fontSize: FontSize.sm, color: Colors.secondary, marginTop: 2 },
  systemBadge: { backgroundColor: Colors.naSoft, borderRadius: Radii.sm, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border },
  systemBadgeText: { fontSize: FontSize.xs, color: Colors.secondary, fontWeight: FontWeight.bold },
  hiddenBadge: { backgroundColor: Colors.failSoft, borderRadius: Radii.sm, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.fail },
  hiddenBadgeText: { fontSize: FontSize.xs, color: Colors.fail, fontWeight: FontWeight.bold },
  hint: { fontSize: FontSize.sm, color: Colors.secondary, lineHeight: 18, textAlign: 'center' },
  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  cancelText: { fontSize: FontSize.lg, color: Colors.secondary },
  doneText: { fontSize: FontSize.lg, color: Colors.accent, fontWeight: FontWeight.semibold },
  doneDisabled: { opacity: 0.4 },
  modalContent: { padding: Spacing.lg, gap: Spacing.xs },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.xs },
  textInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSize.md, color: Colors.primary,
  },
  pickerCard: { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  pickerRowLabel: { flex: 1, fontSize: FontSize.md, color: Colors.primary },
  pickerRowSelected: { color: Colors.accent, fontWeight: FontWeight.semibold },
})
