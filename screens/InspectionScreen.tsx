import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../tokens'
import { getSchema } from '../schema'
import type { InspectionSchema } from '../schema/types'
import { SectionPage, PaginationStepper, SectionSidebar } from '../components/form'
import { ConfirmModal } from '../components/primitives'
import type { InspectionScreenProps } from '../navigation/types'
import { STANDARD_LEGEND } from '../constants/legend'
import type { InspectionDocument } from '../types/inspection'
import { InspectionProvider, useInspection } from '../context/InspectionContext'
import { saveInspection, saveInspectionAs, loadInspection, shareInspection } from '../services/inspectionFiles'
import {
  loadProfile, profileToSvcValues, profileIsPopulated, fileSvcDiffersFromProfile,
} from '../services/companyProfile'

// ─── Page model ──────────────────────────────────────────────────────────────

export interface FormPage {
  key: string
  sectionId: string
  subsectionId?: string
  groupKey: string
  clause?: string
  title: string
  isRepeatable: boolean
  isOptional: boolean
  isApplicable: boolean
}

function makePages(
  schema: InspectionSchema,
  sectionId: string,
  groupKey: string,
): FormPage[] {
  const section = schema.sections.find(s => s.id === sectionId)!
  const isRepeatable = section.type === 'repeatable_section'

  if (section.subsections && section.subsections.length > 0) {
    return section.subsections.map((sub, subIndex) => ({
      key: `${groupKey}__${sub.id}`,
      sectionId: section.id,
      subsectionId: sub.id,
      groupKey,
      clause: sub.clause ?? (section.clause ? `${section.clause} (${subIndex + 1})` : undefined),
      title: sub.title,
      isRepeatable,
      isOptional: !!sub.applicable_toggle,
      isApplicable: sub.applicable_toggle ? sub.applicable_toggle.default : true,
    }))
  }

  return [{
    key: `${groupKey}__${section.id}`,
    sectionId: section.id,
    subsectionId: undefined,
    groupKey,
    clause: section.clause,
    title: section.title,
    isRepeatable,
    isOptional: !!section.applicable_toggle,
    isApplicable: section.applicable_toggle ? section.applicable_toggle.default : true,
  }]
}

function buildPagesFromDocument(
  schema: InspectionSchema,
  repeatableGroups: Record<string, string[]>,
  applicableStates: Record<string, boolean>,
): FormPage[] {
  return schema.sections.flatMap(section => {
    const groupKeys = repeatableGroups[section.id] ?? [`${section.id}__0`]
    return groupKeys.flatMap(groupKey => {
      const rawPages = makePages(schema, section.id, groupKey)
      return rawPages.map(p => {
        if (p.isOptional && applicableStates[p.key] !== undefined) {
          return { ...p, isApplicable: applicableStates[p.key] }
        }
        return p
      })
    })
  })
}

function createInitialDocument(schema: InspectionSchema): InspectionDocument {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    schemaId: schema.id,
    schemaVersion: schema.version,
    status: 'draft',
    filename: 'Untitled Inspection',
    filePath: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    repeatableGroups: {},
    applicableStates: {},
    fieldValues: {},
    listItems: {},
    deviceRecords: {},
    legend: [...STANDARD_LEGEND],
  }
}

// ─── Inner content (uses context) ────────────────────────────────────────────

interface ContentProps {
  schema: InspectionSchema
  navigation: InspectionScreenProps['navigation']
}

function InspectionContent({ schema, navigation }: ContentProps) {
  const { doc, dispatch } = useInspection()

  const { repeatableGroups, applicableStates } = doc
  const pages = useMemo(
    () => buildPagesFromDocument(schema, repeatableGroups, applicableStates),
    [schema, repeatableGroups, applicableStates],
  )

  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<{ groupKey: string; message: string } | null>(null)
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [saveAsName, setSaveAsName] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [autoSave, setAutoSave] = useState(true)
  const scrollRef = useRef<ScrollView>(null)

  // Clamp index when pages shrink after a group is removed
  useEffect(() => {
    if (currentPageIndex >= pages.length) {
      setCurrentPageIndex(Math.max(0, pages.length - 1))
    }
  }, [pages.length])

  // Auto-save with 2s debounce
  useEffect(() => {
    if (!autoSave) return
    setSaveStatus('saving')
    const timer = setTimeout(async () => {
      try {
        const path = await saveInspection(doc)
        if (doc.filePath !== path) dispatch({ type: 'SET_FILE_PATH', filePath: path })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [doc, autoSave])

  const currentPage = pages[Math.min(currentPageIndex, pages.length - 1)]

  const goToPage = (index: number) => {
    setCurrentPageIndex(Math.max(0, Math.min(index, pages.length - 1)))
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }

  const handleNavigateByKey = (pageKey: string) => {
    const idx = pages.findIndex(p => p.key === pageKey)
    if (idx !== -1) goToPage(idx)
  }

  const handleAddGroup = (sectionId: string) => {
    const groupKey = `${sectionId}__${Date.now()}`
    dispatch({ type: 'ADD_GROUP', sectionId, groupKey })
  }

  const handleRemoveGroup = (groupKey: string) => {
    const groupPages = pages.filter(p => p.groupKey === groupKey)
    const section = schema.sections.find(s => s.id === groupPages[0].sectionId)!
    const label = section.instance_label ?? section.title
    const message = `Remove this ${label} instance?${groupPages.length > 1 ? ` All ${groupPages.length} pages will be removed.` : ''}`
    setConfirmRemove({ groupKey, message })
  }

  const confirmRemoveGroup = () => {
    if (!confirmRemove) return
    const groupPages = pages.filter(p => p.groupKey === confirmRemove.groupKey)
    const pageKeys = groupPages.map(p => p.key)
    dispatch({ type: 'REMOVE_GROUP', groupKey: confirmRemove.groupKey, pageKeys })
    setConfirmRemove(null)
  }

  const handleToggleApplicable = (pageKey: string) => {
    const page = pages.find(p => p.key === pageKey)
    if (page) dispatch({ type: 'SET_APPLICABLE', pageKey, value: !page.isApplicable })
  }

  const handleSaveAs = async () => {
    const name = saveAsName.trim() || doc.filename
    try {
      const copy = await saveInspectionAs(doc, name)
      dispatch({ type: 'SET_FILENAME', filename: copy.filename })
      dispatch({ type: 'SET_FILE_PATH', filePath: copy.filePath! })
    } catch { /* ignore */ }
    setShowSaveAs(false)
    setSaveAsName('')
  }

  if (!currentPage) return null

  // Instance label for the header
  const section = schema.sections.find(s => s.id === currentPage.sectionId)!
  const groupsForSection = [...new Set(pages.filter(p => p.sectionId === currentPage.sectionId).map(p => p.groupKey))]
  const instanceNumber = groupsForSection.indexOf(currentPage.groupKey) + 1
  const headerTitle = currentPage.isRepeatable && groupsForSection.length > 1
    ? `${section.instance_label ?? section.title} ${instanceNumber} — ${currentPage.title}`
    : currentPage.title

  const saveLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : ''

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => setSidebarOpen(true)}>
          <View style={s.menuIcon}>
            <View style={s.menuLine} />
            <View style={s.menuLine} />
            <View style={s.menuLine} />
          </View>
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={s.headerTitleRow}>
            {currentPage.clause && (
              <View style={s.clauseBadge}>
                <Text style={s.clauseText}>§{currentPage.clause}</Text>
              </View>
            )}
            <Text style={s.headerTitle} numberOfLines={2}>{headerTitle}</Text>
          </View>
          {saveLabel ? <Text style={[s.saveStatus, saveStatus === 'error' && s.saveStatusError]}>{saveLabel}</Text> : null}
        </View>

        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <SectionPage
          page={currentPage}
          schema={schema}
          legend={doc.legend}
          onLegendChange={legend => dispatch({ type: 'SET_LEGEND', legend })}
          onToggleApplicable={() => handleToggleApplicable(currentPage.key)}
        />
      </ScrollView>

      {/* Pagination */}
      <PaginationStepper
        current={currentPageIndex}
        total={pages.length}
        onPrev={() => goToPage(currentPageIndex - 1)}
        onNext={() => goToPage(currentPageIndex + 1)}
      />

      {/* Sidebar */}
      <SectionSidebar
        visible={sidebarOpen}
        pages={pages}
        currentPageKey={currentPage.key}
        schema={schema}
        onNavigate={handleNavigateByKey}
        onAddGroup={handleAddGroup}
        onRemoveGroup={handleRemoveGroup}
        onClose={() => setSidebarOpen(false)}
        autoSave={autoSave}
        onToggleAutoSave={() => setAutoSave(v => !v)}
        onSaveAs={() => { setSidebarOpen(false); setSaveAsName(doc.filename); setShowSaveAs(true) }}
        onShare={() => { setSidebarOpen(false); shareInspection(doc).catch(() => {}) }}
        onCloseInspection={() => navigation.goBack()}
      />

      <ConfirmModal
        visible={!!confirmRemove}
        title="Remove Section"
        message={confirmRemove?.message}
        confirmLabel="Remove"
        destructive
        onConfirm={confirmRemoveGroup}
        onCancel={() => setConfirmRemove(null)}
      />

      {/* Save As modal */}
      <Modal visible={showSaveAs} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.saveAsCard}>
            <Text style={s.saveAsTitle}>Save As</Text>
            <TextInput
              style={s.saveAsInput}
              value={saveAsName}
              onChangeText={setSaveAsName}
              placeholder="Filename"
              placeholderTextColor={Colors.secondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveAs}
            />
            <View style={s.saveAsActions}>
              <TouchableOpacity style={s.saveAsCancel} onPress={() => { setShowSaveAs(false); setSaveAsName('') }}>
                <Text style={s.saveAsCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveAsConfirm} onPress={handleSaveAs}>
                <Text style={s.saveAsConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Screen (outer shell — provides context) ─────────────────────────────────

export default function InspectionScreen({ route, navigation }: InspectionScreenProps) {
  const { schemaId, loadFilePath } = route.params
  const schema = getSchema(schemaId)

  const [initialDoc, setInitialDoc] = useState<InspectionDocument | null>(null)

  // pendingConflict holds a loaded file doc alongside profile-prefilled values,
  // waiting for the user to choose which company info to use.
  const [pendingConflict, setPendingConflict] = useState<{
    doc: InspectionDocument
    profileValues: Record<string, string>
  } | null>(null)

  useEffect(() => {
    if (!schema) return

    if (loadFilePath) {
      loadInspection(loadFilePath)
        .then(async doc => {
          const profile = await loadProfile()
          if (profileIsPopulated(profile) && fileSvcDiffersFromProfile(doc.fieldValues, profile)) {
            setPendingConflict({ doc, profileValues: profileToSvcValues(profile) })
          } else if (profileIsPopulated(profile)) {
            // File has no company name — silently pre-fill from profile
            setInitialDoc({ ...doc, fieldValues: { ...doc.fieldValues, ...profileToSvcValues(profile) } })
          } else {
            setInitialDoc(doc)
          }
        })
        .catch(async () => {
          const profile = await loadProfile()
          const doc = createInitialDocument(schema)
          setInitialDoc({ ...doc, fieldValues: { ...doc.fieldValues, ...profileToSvcValues(profile) } })
        })
    } else {
      loadProfile()
        .then(profile => {
          const doc = createInitialDocument(schema)
          setInitialDoc({ ...doc, fieldValues: { ...doc.fieldValues, ...profileToSvcValues(profile) } })
        })
        .catch(() => setInitialDoc(createInitialDocument(schema)))
    }
  }, [])

  const resolveConflict = (useProfile: boolean) => {
    if (!pendingConflict) return
    const { doc, profileValues } = pendingConflict
    setInitialDoc(useProfile
      ? { ...doc, fieldValues: { ...doc.fieldValues, ...profileValues } }
      : doc,
    )
    setPendingConflict(null)
  }

  if (!schema) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={s.errorText}>Schema not found.</Text>
      </SafeAreaView>
    )
  }

  // Profile conflict prompt
  if (pendingConflict) {
    return (
      <SafeAreaView style={s.safe}>
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <View style={s.conflictOverlay}>
            <View style={s.conflictCard}>
              <Text style={s.conflictTitle}>Company Info</Text>
              <Text style={s.conflictMessage}>
                This file has different company info than your saved settings. Which would you like to use?
              </Text>
              <TouchableOpacity style={s.conflictBtnPrimary} onPress={() => resolveConflict(true)}>
                <Text style={s.conflictBtnPrimaryText}>Use My Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.conflictBtnSecondary} onPress={() => resolveConflict(false)}>
                <Text style={s.conflictBtnSecondaryText}>Keep File Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }

  if (!initialDoc) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={s.loadingText}>Loading inspection…</Text>
      </SafeAreaView>
    )
  }

  return (
    <InspectionProvider initialDoc={initialDoc}>
      <InspectionContent schema={schema} navigation={navigation} />
    </InspectionProvider>
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
    gap: Spacing.sm,
    minHeight: 56,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuIcon: { width: 22, gap: 5 },
  menuLine: { height: 2, backgroundColor: Colors.primary, borderRadius: 1 },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  clauseBadge: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    flexShrink: 0,
  },
  clauseText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  saveStatus: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
  },
  saveStatusError: {
    color: Colors.fail,
  },
  backText: { fontSize: FontSize.lg, color: Colors.secondary },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.fail,
    textAlign: 'center',
    margin: Spacing.xxl,
  },
  loadingText: {
    fontSize: FontSize.lg,
    color: Colors.secondary,
    textAlign: 'center',
    margin: Spacing.xxl,
  },

  // Save As modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  saveAsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  saveAsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  saveAsInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  saveAsActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  saveAsCancel: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveAsCancelText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
  },
  saveAsConfirm: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
  },
  saveAsConfirmText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#FFF',
  },

  // Company info conflict modal
  conflictOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  conflictCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  conflictTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  conflictMessage: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  conflictBtnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  conflictBtnPrimaryText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFF',
  },
  conflictBtnSecondary: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  conflictBtnSecondaryText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
  },
})
