import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../tokens";
import { listSchemas, getSchema } from "../schema";
import type { InspectionSchema } from "../schema";
import type { SchemaListScreenProps } from "../navigation/types";
import {
  listInspections,
  deleteInspection,
  importInspection,
  shareInspectionFiles,
  type InspectionMeta,
} from "../services/inspectionFiles";
import { ConfirmModal } from "../components/primitives";
import { Feather } from "@expo/vector-icons";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export default function SchemaListScreen({
  navigation,
}: SchemaListScreenProps) {
  const schemas = listSchemas();

  const [saved, setSaved] = useState<InspectionMeta[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<InspectionMeta | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newExpanded, setNewExpanded] = useState(true);
  const [savedExpanded, setSavedExpanded] = useState(true);
  const [infoSchema, setInfoSchema] = useState<InspectionSchema | null>(null);

  const searchKeywords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filteredSaved = searchKeywords.length === 0
    ? saved
    : saved.filter((item) => {
        const name = item.filename.toLowerCase();
        return searchKeywords.every((kw) => name.includes(kw));
      });

  // Refresh the saved list whenever this screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoadingSaved(true);
      listInspections()
        .then(setSaved)
        .catch(() => setSaved([]))
        .finally(() => setLoadingSaved(false));
    }, []),
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteInspection(deleteTarget.filePath).catch(() => {});
    setSaved((prev) =>
      prev.filter((i) => i.filePath !== deleteTarget.filePath),
    );
    setDeleteTarget(null);
  };

  const toggleSelectionMode = () => {
    setSelectionMode((v) => !v);
    setSelected(new Set());
  };

  const toggleSelected = (filePath: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filteredSaved.map((i) => i.filePath)));
  };

  const handleShareSelected = async () => {
    const items = saved.filter((i) => selected.has(i.filePath));
    if (items.length === 0) return;
    await shareInspectionFiles(
      items.map((i) => ({ filePath: i.filePath, filename: i.filename })),
    ).catch(() => {});
  };

  const handleBulkDelete = async () => {
    const paths = Array.from(selected);
    await Promise.all(paths.map((p) => deleteInspection(p).catch(() => {})));
    setSaved((prev) => prev.filter((i) => !selected.has(i.filePath)));
    setSelected(new Set());
    setSelectionMode(false);
    setConfirmBulkDelete(false);
  };

  const handleImport = async () => {
    setImportError(null);
    setImporting(true);
    try {
      const doc = await importInspection();
      if (doc) {
        navigation.navigate("Inspection", {
          schemaId: doc.schemaId,
          loadFilePath: doc.filePath!,
        });
      }
    } catch {
      setImportError(
        "Could not open the file. Make sure it is a valid inspection file.",
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Fixed header */}
      <View style={s.header}>
        <Text style={s.appTitle}>Quickway Forms</Text>
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => navigation.navigate("Settings")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="settings" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── New inspection ───────────────────────────────────────── */}
        {!selectionMode && (
          <>
            <TouchableOpacity
              style={s.sectionLabelToggle}
              onPress={() => setNewExpanded((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={s.sectionLabel}>New</Text>
              <View style={s.collapseToggleBtn}>
                <Feather
                  name={newExpanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={Colors.secondary}
                />
              </View>
            </TouchableOpacity>

            {newExpanded && (
              <>
                {schemas.map((schema) => (
                  <TouchableOpacity
                    key={schema.id}
                    style={s.schemaCard}
                    onPress={() =>
                      navigation.navigate("Inspection", { schemaId: schema.id })
                    }
                    activeOpacity={0.8}
                  >
                    <View style={s.schemaCardTop}>
                      <View style={s.versionBadge}>
                        <Text style={s.versionText}>{schema.formId}</Text>
                      </View>
                      <Text style={s.sectionCount}>
                        {schema.sections.length} sections
                      </Text>
                    </View>
                    <Text style={s.schemaTitle}>{schema.title}</Text>
                    <View style={s.schemaDescRow}>
                      <Text style={s.schemaDesc} numberOfLines={2}>
                        {schema.description}
                      </Text>
                      <TouchableOpacity
                        style={s.schemaInfoBtn}
                        onPress={() => setInfoSchema(schema)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={s.schemaInfoBtnText}>ⓘ</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={s.startRow}>
                      <Text style={s.startText}>Start Inspection →</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <View style={s.divider} />

                <TouchableOpacity
                  style={[s.importBtn, importing && s.importBtnDisabled]}
                  onPress={handleImport}
                  disabled={importing}
                  activeOpacity={0.7}
                >
                  {importing ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <Text style={s.importBtnText}>Import from Files…</Text>
                  )}
                </TouchableOpacity>

                {importError && <Text style={s.importError}>{importError}</Text>}
              </>
            )}
          </>
        )}

        {/* ── Saved inspections ──────────────────────────────────────── */}
        <View
          style={[
            s.sectionLabelRow,
            !selectionMode && { marginTop: Spacing.xl },
          ]}
        >
          <TouchableOpacity
            style={s.sectionLabelToggle}
            onPress={() => setSavedExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={s.sectionLabel}>Saved</Text>
            <View style={s.collapseToggleBtn}>
              <Feather
                name={savedExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={Colors.secondary}
              />
            </View>
          </TouchableOpacity>
          {saved.length > 0 && (
            <TouchableOpacity
              onPress={toggleSelectionMode}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.selectToggle}>
                {selectionMode ? "Cancel" : "Select"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {savedExpanded && (
          <>
            {saved.length > 0 && (
              <View style={s.searchBar}>
                <Feather name="search" size={16} color={Colors.secondary} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search by filename…"
                  placeholderTextColor={Colors.secondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={16} color={Colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {loadingSaved ? (
              <ActivityIndicator style={s.loadingSpinner} color={Colors.accent} />
            ) : saved.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No saved inspections yet.</Text>
              </View>
            ) : filteredSaved.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No inspections match your search.</Text>
              </View>
            ) : (
              <View style={s.savedList}>
                {filteredSaved.map((item) => {
                  const isSelected = selected.has(item.filePath);
                  const itemSchema = getSchema(item.schemaId);
                  return (
                    <TouchableOpacity
                      key={item.filePath}
                      style={s.savedRow}
                      onPress={() =>
                        selectionMode
                          ? toggleSelected(item.filePath)
                          : navigation.navigate("Inspection", {
                              schemaId: item.schemaId,
                              loadFilePath: item.filePath,
                            })
                      }
                      activeOpacity={0.7}
                    >
                      {selectionMode && (
                        <Feather
                          name={isSelected ? "check-circle" : "circle"}
                          size={20}
                          color={isSelected ? Colors.accent : Colors.border}
                        />
                      )}
                      <View style={s.savedInfo}>
                        <Text style={s.savedName} numberOfLines={1}>
                          {item.filename}
                        </Text>
                        <Text style={s.savedDate}>
                          {itemSchema ? `${itemSchema.formId} · ` : ""}
                          {formatDate(item.updatedAt)}
                        </Text>
                      </View>
                      <View
                        style={[
                          s.statusBadge,
                          item.status === "signed" && s.statusBadgeSigned,
                        ]}
                      >
                        <Text
                          style={[
                            s.statusText,
                            item.status === "signed" && s.statusTextSigned,
                          ]}
                        >
                          {item.status === "signed" ? "Signed" : "Draft"}
                        </Text>
                      </View>
                      {!selectionMode && (
                        <TouchableOpacity
                          style={s.deleteBtn}
                          onPress={() => setDeleteTarget(item)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Feather name="trash-2" size={16} color={Colors.fail} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {selectionMode && (
        <View style={s.selectionBar}>
          <View style={s.selectionBarLeft}>
            <TouchableOpacity
              onPress={selectAll}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.selectionBarAction}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShareSelected}
              disabled={selected.size === 0}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  s.selectionBarAction,
                  selected.size === 0 && s.selectionBarActionDisabled,
                ]}
              >
                Share
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={s.selectionBarCount}>{selected.size} selected</Text>
          <TouchableOpacity
            onPress={() => setConfirmBulkDelete(true)}
            disabled={selected.size === 0}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                s.selectionBarAction,
                s.selectionBarDelete,
                selected.size === 0 && s.selectionBarActionDisabled,
              ]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Inspection"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.filename}"? This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        visible={confirmBulkDelete}
        title="Delete Inspections"
        message={`Delete ${selected.size} inspection${
          selected.size === 1 ? "" : "s"
        }? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      <Modal
        visible={!!infoSchema}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={s.infoOverlay}>
          <View style={s.infoCard}>
            <View style={s.infoCardHeader}>
              <Text style={s.infoCardTitle}>{infoSchema?.title}</Text>
              <Text style={s.infoCardSubtitle}>{infoSchema?.formId}</Text>
            </View>
            <ScrollView
              style={s.infoScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={s.infoCardText}>{infoSchema?.description}</Text>
            </ScrollView>
            <TouchableOpacity
              style={s.infoCloseBtn}
              onPress={() => setInfoSchema(null)}
            >
              <Text style={s.infoCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabelToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  collapseToggleBtn: {
    width: 22,
    height: 22,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  selectToggle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.primary,
    padding: 0,
  },

  // Saved list
  loadingSpinner: { marginVertical: Spacing.lg },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: "center",
  },
  emptyText: { fontSize: FontSize.md, color: Colors.secondary },
  savedList: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  savedInfo: { flex: 1 },
  savedName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  savedDate: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.accent,
    flexShrink: 0,
  },
  statusBadgeSigned: {
    backgroundColor: Colors.passSoft,
    borderColor: Colors.pass,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  statusTextSigned: { color: Colors.pass },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Schema cards
  schemaCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  schemaCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  versionBadge: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    flexShrink: 1,
  },
  versionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  sectionCount: { fontSize: FontSize.sm, color: Colors.secondary },
  schemaTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    lineHeight: 22,
  },
  schemaDescRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  schemaDesc: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.secondary,
    lineHeight: 20,
  },
  schemaInfoBtn: {
    flexShrink: 0,
    paddingTop: 1,
  },
  schemaInfoBtnText: {
    fontSize: FontSize.lg,
    color: Colors.accent,
  },
  startRow: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  startText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },

  // Import
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  importBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    borderStyle: "dashed",
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  importBtnDisabled: { opacity: 0.5 },
  importBtnText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
  },
  importError: {
    fontSize: FontSize.sm,
    color: Colors.fail,
    textAlign: "center",
    marginTop: Spacing.md,
    lineHeight: 18,
  },

  // Selection bar
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectionBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  selectionBarAction: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  selectionBarDelete: {
    color: Colors.fail,
  },
  selectionBarActionDisabled: {
    color: Colors.secondary,
    opacity: 0.5,
  },
  selectionBarCount: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
  },

  // Schema info modal
  infoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  infoCard: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  infoCardHeader: {
    gap: Spacing.xs / 2,
  },
  infoCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  infoCardSubtitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  infoScroll: {
    flexShrink: 1,
  },
  infoCardText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    lineHeight: 22,
  },
  infoCloseBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  infoCloseBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: "#FFF",
  },
});
