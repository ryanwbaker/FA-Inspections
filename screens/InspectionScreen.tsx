import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../tokens";
import { getSchema } from "../form_schema";
import type { InspectionSchema } from "../form_schema/types";
import {
  SectionPage,
  PaginationStepper,
  SectionSidebar,
} from "../components/form";
import { ConfirmModal } from "../components/primitives";
import type { InspectionScreenProps } from "../navigation/types";
import { STANDARD_LEGEND } from "../constants/legend";
import type { InspectionDocument } from "../types/inspection";
import {
  InspectionProvider,
  useInspection,
} from "../context/InspectionContext";
import { SectionNavigationProvider } from "../context/SectionNavigationContext";
import {
  saveInspection,
  saveInspectionAs,
  loadInspection,
  shareInspection,
} from "../services/inspectionFiles";
import {
  loadProfile,
  profileIsPopulated,
  fileSvcDiffersFromProfile,
} from "../services/companyProfile";
import { loadTechProfile } from "../services/techProfile";
import { loadLocationDefaults } from "../services/locationDefaults";
import { resolveSourceDefaults } from "../services/schemaDefaults";
import {
  type FormPage,
  buildPagesFromDocument,
} from "../services/formPages";
import { generateReportHtml } from "../services/pdfReport";

export type { FormPage };

function resolveDefault(value: string): string {
  if (value === "$today") return new Date().toISOString().slice(0, 10);
  return value;
}

function collectFieldDefaults(
  schema: InspectionSchema,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const section of schema.sections) {
    // makePages passes the section-level groupKey down to all subsection pages,
    // so both section fields and subsection fields share the same groupKey.
    const gk = `${section.id}__0`;
    if (!section.type) {
      for (const f of section.fields ?? []) {
        if (f.default !== undefined)
          result[`${gk}/${f.id}`] = resolveDefault(f.default);
      }
      for (const sub of section.subsections ?? []) {
        if (!sub.type || sub.type === "repeatable_subsection") {
          const subGk = sub.type === "repeatable_subsection" ? `${sub.id}__0` : gk;
          for (const f of sub.fields ?? []) {
            if (f.default !== undefined)
              result[`${subGk}/${f.id}`] = resolveDefault(f.default);
          }
        }
      }
    }
  }
  return result;
}

function createInitialDocument(schema: InspectionSchema): InspectionDocument {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    schemaId: schema.id,
    schemaVersion: schema.version,
    status: "draft",
    filename: "Untitled Inspection",
    filePath: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    repeatableGroups: {},
    applicableStates: {},
    fieldValues: collectFieldDefaults(schema),
    listItems: {},
    legend: [...STANDARD_LEGEND],
  };
}

// ─── Inner content (uses context) ────────────────────────────────────────────

interface ContentProps {
  schema: InspectionSchema;
  navigation: InspectionScreenProps["navigation"];
}

function InspectionContent({ schema, navigation }: ContentProps) {
  const { doc, dispatch } = useInspection();

  const { repeatableGroups, applicableStates } = doc;
  const pages = useMemo(
    () => buildPagesFromDocument(schema, repeatableGroups, applicableStates),
    [schema, repeatableGroups, applicableStates],
  );

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{
    groupKey: string;
    message: string;
  } | null>(null);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [autoSave, setAutoSave] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Clamp index when pages shrink after a group is removed
  useEffect(() => {
    if (currentPageIndex >= pages.length) {
      setCurrentPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length]);

  // Auto-save with 2s debounce
  useEffect(() => {
    if (!autoSave) return;
    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const path = await saveInspection(doc);
        if (doc.filePath !== path)
          dispatch({ type: "SET_FILE_PATH", filePath: path });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [doc, autoSave]);

  const currentPage = pages[Math.min(currentPageIndex, pages.length - 1)];

  const goToPage = (index: number) => {
    setCurrentPageIndex(Math.max(0, Math.min(index, pages.length - 1)));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleNavigateByKey = (pageKey: string) => {
    const idx = pages.findIndex((p) => p.key === pageKey);
    if (idx !== -1) goToPage(idx);
  };

  const handleNavigateBySectionId = (sectionId: string) => {
    const idx = pages.findIndex(
      (p) => p.sectionId === sectionId || p.subsectionId === sectionId
    );
    if (idx !== -1) goToPage(idx);
  };

  const handleAddGroup = (sectionId: string) => {
    const groupKey = `${sectionId}__${Date.now()}`;
    dispatch({ type: "ADD_GROUP", sectionId, groupKey });
  };

  const handleRemoveGroup = (groupKey: string) => {
    const groupPages = pages.filter((p) => p.groupKey === groupKey);
    const firstPage = groupPages[0];
    const section = schema.sections.find((s) => s.id === firstPage.sectionId)!;
    const sub = firstPage.subsectionId
      ? section.subsections?.find((s) => s.id === firstPage.subsectionId)
      : undefined;
    const isSubRepeatable = firstPage.repeatableGroupId === firstPage.subsectionId;
    const label = isSubRepeatable
      ? (sub?.title ?? section.title)
      : (section.instance_label ?? section.title);
    const message = `Remove this ${label} instance?${groupPages.length > 1 ? ` All ${groupPages.length} pages will be removed.` : ""}`;
    setConfirmRemove({ groupKey, message });
  };

  const confirmRemoveGroup = () => {
    if (!confirmRemove) return;
    const groupPages = pages.filter(
      (p) => p.groupKey === confirmRemove.groupKey,
    );
    const pageKeys = groupPages.map((p) => p.key);
    dispatch({
      type: "REMOVE_GROUP",
      groupKey: confirmRemove.groupKey,
      pageKeys,
    });
    setConfirmRemove(null);
  };

  const handleToggleApplicable = (pageKey: string) => {
    const page = pages.find((p) => p.key === pageKey);
    if (page)
      dispatch({ type: "SET_APPLICABLE", pageKey, value: !page.isApplicable });
  };

  const handleSaveAs = async () => {
    const name = saveAsName.trim() || doc.filename;
    try {
      const copy = await saveInspectionAs(doc, name);
      dispatch({ type: "SET_FILENAME", filename: copy.filename });
      dispatch({ type: "SET_FILE_PATH", filePath: copy.filePath! });
    } catch {
      /* ignore */
    }
    setShowSaveAs(false);
    setSaveAsName("");
  };

  if (!currentPage) return null;

  // Instance label for the header
  const section = schema.sections.find((s) => s.id === currentPage.sectionId)!;
  const subsection = currentPage.subsectionId
    ? section.subsections?.find((sub) => sub.id === currentPage.subsectionId)
    : undefined;
  const currentInfoText = subsection?.info_text ?? section.info_text;

  const groupFilterId = currentPage.repeatableGroupId ?? currentPage.sectionId;
  const groupsForSection = [
    ...new Set(
      pages
        .filter((p) => (p.repeatableGroupId ?? p.sectionId) === groupFilterId)
        .map((p) => p.groupKey),
    ),
  ];
  const instanceNumber = groupsForSection.indexOf(currentPage.groupKey) + 1;
  const displayClause = currentPage.isRepeatable ? section.clause : currentPage.clause;
  const headerTitle = currentPage.isRepeatable
    ? groupsForSection.length > 1
      ? `${section.instance_label ?? section.title} ${instanceNumber}`
      : section.title
    : currentPage.title;

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Error"
          : "";

  return (
    <SectionNavigationProvider value={{ navigateTo: handleNavigateBySectionId }}>
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => setSidebarOpen(true)}
        >
          <Feather name="menu" size={22} color={Colors.primary} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={s.headerTitleRow}>
            {(displayClause || saveLabel) && (
              <View style={s.headerLeftCol}>
                {displayClause && (
                  <View style={s.clauseBadge}>
                    <Text style={s.clauseText}>§{displayClause}</Text>
                  </View>
                )}
                {saveLabel ? (
                  <Text
                    style={[
                      s.saveStatus,
                      saveStatus === "error" && s.saveStatusError,
                    ]}
                  >
                    {saveLabel}
                  </Text>
                ) : null}
              </View>
            )}
            <Text style={s.headerTitle} numberOfLines={2}>
              {headerTitle}
            </Text>
            {currentInfoText && (
              <TouchableOpacity
                style={s.infoBtn}
                onPress={() => setShowInfoModal(true)}
              >
                <Text style={s.infoBtnText}>ⓘ</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="x" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Info modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={s.infoOverlay}>
          <View style={s.infoCard}>
            <Text style={s.infoCardTitle}>
              {currentPage.clause ? `§${currentPage.clause} — ` : ""}
              {currentPage.title}
            </Text>
            <ScrollView
              style={s.infoScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={s.infoCardText}>{currentInfoText}</Text>
            </ScrollView>
            <TouchableOpacity
              style={s.infoCloseBtn}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={s.infoCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
          onLegendChange={(legend) => dispatch({ type: "SET_LEGEND", legend })}
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
        onToggleAutoSave={() => setAutoSave((v) => !v)}
        onSaveAs={() => {
          setSidebarOpen(false);
          setSaveAsName(doc.filename);
          setShowSaveAs(true);
        }}
        onShare={() => {
          setSidebarOpen(false);
          shareInspection(doc).catch(() => {});
        }}
        onExportPdf={async () => {
          setSidebarOpen(false);
          const profile = await loadProfile();
          const html = generateReportHtml(doc, schema, profile);
          navigation.navigate("ReportPreview", { html, filename: doc.filename });
        }}
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
      <Modal
        visible={showSaveAs}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              <TouchableOpacity
                style={s.saveAsCancel}
                onPress={() => {
                  setShowSaveAs(false);
                  setSaveAsName("");
                }}
              >
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
    </SectionNavigationProvider>
  );
}

// ─── Screen (outer shell — provides context) ─────────────────────────────────

export default function InspectionScreen({
  route,
  navigation,
}: InspectionScreenProps) {
  const { schemaId, loadFilePath } = route.params;
  const schema = getSchema(schemaId);

  const [initialDoc, setInitialDoc] = useState<InspectionDocument | null>(null);

  // pendingNewDoc holds a fully-prepared new document waiting for the user to name it.
  const [pendingNewDoc, setPendingNewDoc] = useState<InspectionDocument | null>(
    null,
  );
  const [newDocName, setNewDocName] = useState("");
  const newDocNameRef = useRef<TextInput>(null);

  // pendingConflict holds a loaded file doc alongside profile-prefilled values,
  // waiting for the user to choose which company info to use.
  const [pendingConflict, setPendingConflict] = useState<{
    doc: InspectionDocument;
    profileValues: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (!schema) return;

    if (loadFilePath) {
      loadInspection(loadFilePath)
        .then(async (doc) => {
          const [profile, tech, loc] = await Promise.all([
            loadProfile(),
            loadTechProfile(),
            loadLocationDefaults(),
          ]);
          const profiles = { company_profile: profile, tech_profile: tech, location: loc };

          // Apply tech/location defaults silently when the file's fields are blank
          const techValues = resolveSourceDefaults(schema, profiles, {
            prefix: "tech_profile.",
            skipIfFilled: doc.fieldValues,
          });
          const locValues = resolveSourceDefaults(schema, profiles, {
            prefix: "location.",
            skipIfFilled: doc.fieldValues,
          });
          const profileValues = resolveSourceDefaults(schema, profiles, {
            prefix: "company_profile.",
          });

          if (
            profileIsPopulated(profile) &&
            fileSvcDiffersFromProfile(schema, doc.fieldValues, profile)
          ) {
            setPendingConflict({
              doc: {
                ...doc,
                fieldValues: {
                  ...doc.fieldValues,
                  ...locValues,
                  ...techValues,
                },
              },
              profileValues,
            });
          } else {
            setInitialDoc({
              ...doc,
              fieldValues: {
                ...doc.fieldValues,
                ...profileValues,
                ...locValues,
                ...techValues,
              },
            });
          }
        })
        .catch(async () => {
          const [profile, tech, loc] = await Promise.all([
            loadProfile(),
            loadTechProfile(),
            loadLocationDefaults(),
          ]);
          const profiles = { company_profile: profile, tech_profile: tech, location: loc };
          const doc = createInitialDocument(schema);
          setInitialDoc({
            ...doc,
            fieldValues: {
              ...doc.fieldValues,
              ...resolveSourceDefaults(schema, profiles),
            },
          });
        });
    } else {
      Promise.all([loadProfile(), loadTechProfile(), loadLocationDefaults()])
        .then(([profile, tech, loc]) => {
          const profiles = { company_profile: profile, tech_profile: tech, location: loc };
          const doc = createInitialDocument(schema);
          setPendingNewDoc({
            ...doc,
            fieldValues: {
              ...doc.fieldValues,
              ...resolveSourceDefaults(schema, profiles),
            },
          });
        })
        .catch(() => setPendingNewDoc(createInitialDocument(schema)));
    }
  }, []);

  const confirmNewDoc = () => {
    if (!pendingNewDoc) return;
    const name = newDocName.trim() || "Untitled Inspection";
    setInitialDoc({ ...pendingNewDoc, filename: name });
    setPendingNewDoc(null);
    setNewDocName("");
  };

  const resolveConflict = (useProfile: boolean) => {
    if (!pendingConflict) return;
    const { doc, profileValues } = pendingConflict;
    setInitialDoc(
      useProfile
        ? { ...doc, fieldValues: { ...doc.fieldValues, ...profileValues } }
        : doc,
    );
    setPendingConflict(null);
  };

  if (!schema) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={s.errorText}>Schema not found.</Text>
      </SafeAreaView>
    );
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
                This file has different company info than your saved settings.
                Which would you like to use?
              </Text>
              <TouchableOpacity
                style={s.conflictBtnPrimary}
                onPress={() => resolveConflict(true)}
              >
                <Text style={s.conflictBtnPrimaryText}>Use My Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.conflictBtnSecondary}
                onPress={() => resolveConflict(false)}
              >
                <Text style={s.conflictBtnSecondaryText}>Keep File Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Name-new-inspection prompt
  if (pendingNewDoc) {
    return (
      <SafeAreaView style={s.safe}>
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <KeyboardAvoidingView
            style={s.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={s.saveAsCard}>
              <View style={s.saveAsHeader}>
                <Text style={s.saveAsTitle}>Name this Inspection</Text>
                <TouchableOpacity
                  style={s.saveAsCloseBtn}
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={20} color={Colors.secondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                ref={newDocNameRef}
                style={s.saveAsInput}
                value={newDocName}
                onChangeText={setNewDocName}
                placeholder="Untitled Inspection"
                placeholderTextColor={Colors.secondary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={confirmNewDoc}
              />
              <TouchableOpacity
                style={s.startInspectionBtn}
                onPress={confirmNewDoc}
              >
                <Text style={s.saveAsConfirmText}>Start Inspection</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    );
  }

  if (!initialDoc) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={s.loadingText}>Loading inspection…</Text>
      </SafeAreaView>
    );
  }

  return (
    <InspectionProvider initialDoc={initialDoc} schema={schema}>
      <InspectionContent schema={schema} navigation={navigation} />
    </InspectionProvider>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  headerLeftCol: {
    flexShrink: 0,
    gap: Spacing.xs / 2,
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
    color: "#FFF",
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
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.fail,
    textAlign: "center",
    margin: Spacing.xxl,
  },
  loadingText: {
    fontSize: FontSize.lg,
    color: Colors.secondary,
    textAlign: "center",
    margin: Spacing.xxl,
  },

  // Save As modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  saveAsCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  saveAsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  saveAsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveAsCloseBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "flex-end",
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
    color: "#FFF",
  },
  startInspectionBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
    alignItems: "center",
  },

  // Info modal
  infoBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoBtnText: {
    fontSize: FontSize.lg,
    color: Colors.accent,
    lineHeight: 22,
  },
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
  infoCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
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

  // Company info conflict modal
  conflictOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  conflictCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  conflictTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
  },
  conflictMessage: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  conflictBtnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  conflictBtnPrimaryText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: "#FFF",
  },
  conflictBtnSecondary: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  conflictBtnSecondaryText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
  },
});
