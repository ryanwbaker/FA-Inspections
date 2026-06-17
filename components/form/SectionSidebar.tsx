import { useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Pressable, StyleSheet, Dimensions,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import type { InspectionSchema } from '../../schema/types'
import type { FormPage } from '../../screens/InspectionScreen'

const SIDEBAR_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 320)

interface Props {
  visible: boolean
  pages: FormPage[]
  currentPageKey: string
  schema: InspectionSchema
  onNavigate: (pageKey: string) => void
  onAddGroup: (sectionId: string) => void
  onRemoveGroup: (groupKey: string) => void
  onClose: () => void
  // Footer actions
  autoSave: boolean
  onToggleAutoSave: () => void
  onSaveAs: () => void
  onShare: () => void
  onCloseInspection: () => void
}

// ─── Display item types ───────────────────────────────────────────────────────

interface GroupHeaderItem {
  kind: 'group-header'
  groupKey: string
  sectionId: string
  instanceLabel: string
  canRemove: boolean
}

// Parent row for single-page repeatables (e.g. Transmitter, DCL Circuit)
interface SectionContainerItem {
  kind: 'section-container'
  sectionId: string
  repeatableGroupId: string  // passed to onAddGroup; = subsectionId for repeatable_subsection
  label: string
}

interface PageItem {
  kind: 'page'
  page: FormPage
  indented: boolean
  showAdd?: boolean
  addGroupId?: string
}

type DisplayItem = GroupHeaderItem | SectionContainerItem | PageItem

// ─── Component ───────────────────────────────────────────────────────────────

export default function SectionSidebar({
  visible, pages, currentPageKey, schema,
  onNavigate, onAddGroup, onRemoveGroup, onClose,
  autoSave, onToggleAutoSave, onSaveAs, onShare, onCloseInspection,
}: Props) {
  const insets = useSafeAreaInsets()
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current
  const opacity = useRef(new Animated.Value(0)).current

  // Keys of collapsed items: groupKey for multi-page instances, sectionId for containers
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set())

  const toggleCollapse = (key: string) => {
    setCollapsedKeys(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: visible ? 0 : -SIDEBAR_WIDTH,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [visible])

  const sectionMap = Object.fromEntries(schema.sections.map(s => [s.id, s]))

  // ─── Build display items ────────────────────────────────────────────────────
  const items: DisplayItem[] = []
  const sectionsWithContainer = new Set<string>()
  let i = 0

  while (i < pages.length) {
    const page = pages[i]
    const section = sectionMap[page.sectionId]

    if (!page.isRepeatable) {
      items.push({ kind: 'page', page, indented: false })
      i++
      continue
    }

    const groupPages = pages.filter(p => p.groupKey === page.groupKey)
    const isMultiPage = groupPages.length > 1
    const allGroups = [...new Set(
      pages.filter(p => p.sectionId === page.sectionId).map(p => p.groupKey)
    )]
    const instanceNumber = allGroups.indexOf(page.groupKey) + 1
    const canRemove = allGroups.length > 1

    if (isMultiPage) {
      const instanceLabel = `${section.instance_label ?? section.title} ${instanceNumber}`
      items.push({ kind: 'group-header', groupKey: page.groupKey, sectionId: page.sectionId, instanceLabel, canRemove })
      if (!collapsedKeys.has(page.groupKey)) {
        groupPages.forEach(p => items.push({ kind: 'page', page: p, indented: true }))
      }
    } else {
      // Single-page repeatable
      const containerKey = page.repeatableGroupId ?? page.sectionId
      const isSubRepeatable = !!page.repeatableGroupId && page.repeatableGroupId === page.subsectionId

      if (isSubRepeatable) {
        // No collapsible container — emit rows directly
        const subGroupId = page.repeatableGroupId!
        const allSubGroupKeys = [...new Set(pages.filter(p => p.repeatableGroupId === subGroupId).map(p => p.groupKey))]
        const isLast = allSubGroupKeys.at(-1) === page.groupKey
        items.push({ kind: 'page', page, indented: false, showAdd: isLast, addGroupId: subGroupId })
      } else {
        // Standard single-page repeatable: emit a section container header the first time
        const containerLabel = section.instance_label ?? section.title
        if (!sectionsWithContainer.has(containerKey)) {
          sectionsWithContainer.add(containerKey)
          items.push({
            kind: 'section-container',
            sectionId: page.sectionId,
            repeatableGroupId: containerKey,
            label: containerLabel,
          })
        }
        if (!collapsedKeys.has(containerKey)) {
          items.push({ kind: 'page', page, indented: true })
        }
      }
    }

    i += groupPages.length
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Animated.View
        style={[s.overlay, { opacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[s.drawer, { transform: [{ translateX }] }]}>
        <View style={[s.drawerHeader, { paddingTop: insets.top + Spacing.md }]}>
          <Text style={s.drawerTitle}>Sections</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={s.list} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
          {items.map((item, _idx) => {

            // ── Multi-page group header ──────────────────────────────────────
            if (item.kind === 'group-header') {
              const collapsed = collapsedKeys.has(item.groupKey)
              return (
                <View key={`gh-${item.groupKey}`} style={s.groupHeader}>
                  <TouchableOpacity
                    onPress={() => toggleCollapse(item.groupKey)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={s.collapseBtn}
                  >
                    <Text style={[s.collapseArrow, { transform: [{ rotate: collapsed ? '0deg' : '90deg' }] }]}>
                      ›
                    </Text>
                  </TouchableOpacity>

                  <Text style={s.groupHeaderLabel} numberOfLines={1}>{item.instanceLabel}</Text>

                  <TouchableOpacity
                    onPress={() => onAddGroup(item.sectionId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={s.addInlineText}>+</Text>
                  </TouchableOpacity>

                  {item.canRemove && (
                    <TouchableOpacity
                      onPress={() => onRemoveGroup(item.groupKey)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={s.removeIconBtn}
                    >
                      <Feather name="trash-2" size={15} color={Colors.fail} />
                    </TouchableOpacity>
                  )}
                </View>
              )
            }

            // ── Single-page repeatable container header ──────────────────────
            if (item.kind === 'section-container') {
              const collapsed = collapsedKeys.has(item.repeatableGroupId)
              return (
                <View key={`sc-${item.repeatableGroupId}`} style={s.groupHeader}>
                  <TouchableOpacity
                    onPress={() => toggleCollapse(item.repeatableGroupId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={s.collapseBtn}
                  >
                    <Text style={[s.collapseArrow, { transform: [{ rotate: collapsed ? '0deg' : '90deg' }] }]}>
                      ›
                    </Text>
                  </TouchableOpacity>

                  <Text style={s.groupHeaderLabel} numberOfLines={1}>{item.label}</Text>

                  <TouchableOpacity
                    onPress={() => onAddGroup(item.repeatableGroupId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={s.addInlineText}>+</Text>
                  </TouchableOpacity>
                </View>
              )
            }

            // ── Page row ─────────────────────────────────────────────────────
            const { page, indented } = item
            const isCurrent = page.key === currentPageKey
            const section = sectionMap[page.sectionId]

            // Compute instance info for repeatable rows
            const groupFilterId = page.repeatableGroupId ?? page.sectionId
            const allGroups = page.isRepeatable
              ? [...new Set(pages.filter(p => (p.repeatableGroupId ?? p.sectionId) === groupFilterId).map(p => p.groupKey))]
              : []
            const instanceNumber = page.isRepeatable ? allGroups.indexOf(page.groupKey) + 1 : 0
            const isSubRepeatable = !!page.repeatableGroupId && page.repeatableGroupId === page.subsectionId
            const isSingleRepeatable = page.isRepeatable && !indented && !isSubRepeatable
            const canRemove = page.isRepeatable && (indented || isSubRepeatable) && allGroups.length > 1 && !items.some(it => it.kind === 'group-header' && it.groupKey === page.groupKey)

            return (
              <TouchableOpacity
                key={page.key}
                style={[s.row, isCurrent && s.rowActive, indented && s.rowIndented]}
                onPress={() => { onNavigate(page.key); onClose() }}
                activeOpacity={0.7}
              >
                {page.clause && (
                  <View style={[s.badge, isCurrent && s.badgeActive]}>
                    <Text style={[s.badgeText, isCurrent && s.badgeTextActive]} numberOfLines={1}>
                      {page.clause}
                    </Text>
                  </View>
                )}

                <Text style={[s.rowLabel, isCurrent && s.rowLabelActive]} numberOfLines={2}>
                  {isSingleRepeatable
                    ? `${section.instance_label ?? section.title} ${instanceNumber}`
                    : isSubRepeatable
                      ? (instanceNumber > 1 ? `${page.title} (${instanceNumber})` : page.title)
                      : page.title}
                </Text>

                {page.isOptional && !page.isApplicable && (
                  <View style={s.naBadge}>
                    <Text style={s.naBadgeText}>N/A</Text>
                  </View>
                )}

                {item.showAdd && item.addGroupId && (
                  <TouchableOpacity
                    onPress={() => onAddGroup(item.addGroupId!)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={s.addInlineText}>+</Text>
                  </TouchableOpacity>
                )}

                {canRemove && (
                  <TouchableOpacity
                    onPress={() => onRemoveGroup(page.groupKey)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={15} color={Colors.fail} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <View style={[s.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={s.footerDivider} />

          {/* Auto-save toggle */}
          <TouchableOpacity style={s.footerToggleRow} onPress={onToggleAutoSave} activeOpacity={0.7}>
            <Text style={s.footerToggleLabel}>Auto-save</Text>
            <View style={[s.pill, autoSave && s.pillOn]}>
              <View style={[s.pillThumb, autoSave && s.pillThumbOn]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.footerBtn}
            onPress={() => { onClose(); onSaveAs() }}
            activeOpacity={0.7}
          >
            <Text style={s.footerBtnText}>Save As…</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.footerBtn}
            onPress={() => { onClose(); onShare() }}
            activeOpacity={0.7}
          >
            <Text style={s.footerBtnText}>Share…</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.footerBtn, s.footerBtnClose]}
            onPress={onCloseInspection}
            activeOpacity={0.7}
          >
            <Text style={s.footerBtnCloseText}>Close Inspection</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  )
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.surface,
    zIndex: 11,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  list: { flex: 1 },
  listContent: { paddingVertical: Spacing.sm },

  // Group / container headers
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  collapseBtn: {
    width: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  collapseArrow: {
    fontSize: 18,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
    lineHeight: 22,
  },
  groupHeaderLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addInlineText: {
    fontSize: FontSize.xl,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  },
  removeIconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Page row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    gap: Spacing.md,
    minHeight: 44,
  },
  rowActive: { backgroundColor: Colors.accentSoft },
  rowIndented: { paddingLeft: Spacing.xl + Spacing.md },
  badge: {
    minWidth: 44,
    borderRadius: Radii.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  badgeActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.secondary },
  badgeTextActive: { color: '#FFF' },
  rowLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.primary,
    lineHeight: 18,
  },
  rowLabelActive: { fontWeight: FontWeight.semibold, color: Colors.accent },
  naBadge: {
    backgroundColor: Colors.naSoft,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.na,
  },
  naBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.na,
  },
  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  footerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  footerToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  footerToggleLabel: {
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  pill: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    padding: 3,
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: Colors.accent },
  pillThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  pillThumbOn: { alignSelf: 'flex-end' },
  footerBtn: {
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.md,
  },
  footerBtnText: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  footerBtnClose: {
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  footerBtnCloseText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
  },
})
