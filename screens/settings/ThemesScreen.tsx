import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import type { SettingsThemesProps } from '../../navigation/types'
import {
  listAllThemes, importTheme, deleteUserTheme, exportTheme, isSystemTheme,
} from '../../services/themeStore'
import type { PdfTheme } from '../../types/pdfTheme'
import { ConfirmModal } from '../../components/primitives'

export default function ThemesScreen({ navigation }: SettingsThemesProps) {
  const [themes, setThemes] = useState<PdfTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PdfTheme | null>(null)

  useFocusEffect(useCallback(() => {
    listAllThemes().then(setThemes).finally(() => setLoading(false))
  }, []))

  const handleImport = async () => {
    setImporting(true)
    try {
      const theme = await importTheme()
      if (theme) setThemes(prev => [...prev.filter(t => t.id !== theme.id), theme])
    } catch (e: unknown) {
      Alert.alert('Import Failed', e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteUserTheme(deleteTarget.id)
      setThemes(prev => prev.filter(t => t.id !== deleteTarget.id))
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete theme.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleExport = async (theme: PdfTheme) => {
    try { await exportTheme(theme.id) } catch { /* ignore */ }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.title}>PDF Themes</Text>
        <TouchableOpacity
          style={[s.importBtn, importing && s.importBtnDisabled]}
          onPress={handleImport}
          disabled={importing}
        >
          {importing
            ? <ActivityIndicator size="small" color={Colors.accent} />
            : <Feather name="upload" size={18} color={Colors.accent} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} />
        ) : (
          <View style={s.card}>
            {themes.map((theme, i) => {
              const system = isSystemTheme(theme.id)
              return (
                <View key={theme.id} style={[s.row, i < themes.length - 1 && s.rowBorder]}>
                  <View style={[s.colorSwatch, { backgroundColor: theme.colors.accent }]} />
                  <View style={s.rowBody}>
                    <View style={s.rowTop}>
                      <Text style={s.rowLabel} numberOfLines={1}>{theme.name}</Text>
                      {system && <View style={s.systemBadge}><Text style={s.systemBadgeText}>System</Text></View>}
                    </View>
                    <Text style={s.rowMeta}>{theme.id} · {theme.page.size.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleExport(theme)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="share" size={16} color={Colors.secondary} />
                  </TouchableOpacity>
                  {!system && (
                    <TouchableOpacity onPress={() => setDeleteTarget(theme)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="trash-2" size={16} color={Colors.fail} />
                    </TouchableOpacity>
                  )}
                </View>
              )
            })}
          </View>
        )}

        <Text style={s.hint}>
          Import a JSON theme file to customise PDF report appearance. System themes cannot be deleted.
          Tap the share icon to export a theme for editing.
        </Text>

        <TouchableOpacity
          style={[s.importFullBtn, importing && s.importBtnDisabled]}
          onPress={handleImport}
          disabled={importing}
        >
          <Feather name="upload" size={16} color={Colors.accent} />
          <Text style={s.importFullBtnText}>Import Theme…</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Theme"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? Templates using this theme will fall back to the default.` : undefined}
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
  importBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  importBtnDisabled: { opacity: 0.4 },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  colorSwatch: { width: 12, height: 36, borderRadius: 3, flexShrink: 0 },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary, flex: 1 },
  rowMeta: { fontSize: FontSize.sm, color: Colors.secondary, marginTop: 2 },
  systemBadge: { backgroundColor: Colors.naSoft, borderRadius: Radii.sm, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border },
  systemBadgeText: { fontSize: FontSize.xs, color: Colors.secondary, fontWeight: FontWeight.bold },
  hint: { fontSize: FontSize.sm, color: Colors.secondary, lineHeight: 18, textAlign: 'center' },
  importFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.accent, borderStyle: 'dashed',
    borderRadius: Radii.lg, paddingVertical: Spacing.md,
  },
  importFullBtnText: { fontSize: FontSize.md, color: Colors.accent, fontWeight: FontWeight.semibold },
})
