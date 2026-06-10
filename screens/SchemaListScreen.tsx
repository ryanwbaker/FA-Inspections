import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../tokens";
import { listSchemas } from "../schema";
import type { SchemaListScreenProps } from "../navigation/types";
import {
  listInspections,
  deleteInspection,
  importInspection,
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
        <View>
          <Text style={s.appTitle}>FA Inspections</Text>
          <Text style={s.appSubtitle}>CAN/ULC-S536:2019</Text>
        </View>
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
        {/* ── Saved inspections ──────────────────────────────────────── */}
        <Text style={s.sectionLabel}>Saved</Text>

        {loadingSaved ? (
          <ActivityIndicator style={s.loadingSpinner} color={Colors.accent} />
        ) : saved.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No saved inspections yet.</Text>
          </View>
        ) : (
          <View style={s.savedList}>
            {saved.map((item) => (
              <TouchableOpacity
                key={item.filePath}
                style={s.savedRow}
                onPress={() =>
                  navigation.navigate("Inspection", {
                    schemaId: item.schemaId,
                    loadFilePath: item.filePath,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={s.savedInfo}>
                  <Text style={s.savedName} numberOfLines={1}>
                    {item.filename}
                  </Text>
                  <Text style={s.savedDate}>{formatDate(item.updatedAt)}</Text>
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
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => setDeleteTarget(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="trash-2" size={16} color={Colors.fail} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── New inspection ─────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { marginTop: Spacing.xl }]}>New</Text>

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
                <Text style={s.versionText}>{schema.version}</Text>
              </View>
              <Text style={s.sectionCount}>
                {schema.sections.length} sections
              </Text>
            </View>
            <Text style={s.schemaTitle}>{schema.title}</Text>
            <Text style={s.schemaDesc} numberOfLines={2}>
              {schema.description}
            </Text>
            <View style={s.startRow}>
              <Text style={s.startText}>Start Inspection →</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Import ─────────────────────────────────────────────────── */}
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
      </ScrollView>

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
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: FontSize.md,
    color: Colors.secondary,
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
    marginBottom: Spacing.sm,
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
    marginBottom: Spacing.xs,
  },
  versionBadge: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
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
  schemaDesc: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    lineHeight: 20,
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
});
