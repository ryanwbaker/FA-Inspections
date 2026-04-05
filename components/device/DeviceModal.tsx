import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";
import { TriStateField } from "../fields";
import type { TriStateVal } from "../fields";

export interface DeviceRecord {
  id: string;
  location: string;
  deviceType: string;
  circuitAddress: string;
  fireZone: string;
  needsService: TriStateVal;
  alarmConfirmed: TriStateVal;
  annunciatorInd: TriStateVal;
  circuitTrouble: TriStateVal;
  comments: string;
}

interface Props {
  devices: DeviceRecord[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  onSaveClose: () => void;
  onSaveNew: () => void;
  onCancel: () => void;
  onUpdate: (d: DeviceRecord) => void;
}

type FieldKey =
  | "location"
  | "deviceType"
  | "circuitAddress"
  | "fireZone"
  | "needsService"
  | "alarmConfirmed"
  | "annunciatorInd"
  | "circuitTrouble"
  | "comments";

type FieldType = "text" | "tristate";

interface FieldDef {
  key: FieldKey;
  type: FieldType;
  label: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
}

const FIELDS: FieldDef[] = [
  {
    key: "location",
    type: "text",
    label: "Device Location",
    hint: "Floor, room, or area",
    required: true,
  },
  {
    key: "deviceType",
    type: "text",
    label: "Device Type",
    hint: "e.g. PS, HT, M, FS",
    required: true,
  },
  {
    key: "circuitAddress",
    type: "text",
    label: "Circuit / Address",
    required: true,
  },
  {
    key: "fireZone",
    type: "text",
    label: "Annunciated Fire Zone",
    required: true,
  },
  {
    key: "needsService",
    type: "tristate",
    label: "Requires Service / Repairs / Cleaning",
  },
  {
    key: "alarmConfirmed",
    type: "tristate",
    label: "Alarm / Activation Confirmed",
  },
  { key: "annunciatorInd", type: "tristate", label: "Annunciator Indication" },
  {
    key: "circuitTrouble",
    type: "tristate",
    label: "Supervised Circuit Trouble Signal",
  },
  { key: "comments", type: "text", label: "Comments", multiline: true },
];

export default function DeviceModal({
  devices,
  activeIndex,
  onNavigate,
  onSaveClose,
  onSaveNew,
  onCancel,
  onUpdate,
}: Props) {
  const device = devices[activeIndex];
  const total = devices.length;
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const fieldOffsets = useRef<Record<string, number>>({});

  const scrollToField = useCallback((key: FieldKey, extra: number = 0) => {
    const y = fieldOffsets.current[key];
    if (y !== undefined) {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, y - 24 - extra),
        animated: true,
      });
    }
  }, []);

  const focusField = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, FIELDS.length - 1));
      setFocusedIndex(clamped);
      const field = FIELDS[clamped];
      const extra = field.type === "tristate" ? 200 : 0;
      scrollToField(field.key, extra);
      if (field.type === "text") {
        setTimeout(() => inputRefs.current[field.key]?.focus(), 50);
      }
    },
    [scrollToField],
  );

  const goNext = () => focusField(focusedIndex + 1);

  const handleTriStateChange = (key: FieldKey, val: TriStateVal) => {
    onUpdate({ ...device, [key]: val });
    const currentIndex = FIELDS.findIndex((f) => f.key === key);
    if (currentIndex < FIELDS.length - 1) {
      setTimeout(() => focusField(currentIndex + 1), 150);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.safe}>
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={onCancel}
            style={s.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.title}>Device Record</Text>
          <View style={s.nav}>
            <TouchableOpacity
              style={[s.navBtn, activeIndex === 0 && s.navBtnDisabled]}
              onPress={() => onNavigate(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <Text style={[s.navText, activeIndex === 0 && s.navTextDisabled]}>
                ‹
              </Text>
            </TouchableOpacity>
            <Text style={s.navCount}>
              {activeIndex + 1}/{total}
            </Text>
            <TouchableOpacity
              style={[s.navBtn, activeIndex === total - 1 && s.navBtnDisabled]}
              onPress={() => onNavigate(activeIndex + 1)}
              disabled={activeIndex === total - 1}
            >
              <Text
                style={[
                  s.navText,
                  activeIndex === total - 1 && s.navTextDisabled,
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          ref={scrollViewRef}
          style={s.scroll}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          {FIELDS.map((field, i) => {
            if (field.type === "text") {
              return (
                <View
                  key={field.key}
                  style={s.fieldBlock}
                  onLayout={(e) => {
                    fieldOffsets.current[field.key] = e.nativeEvent.layout.y;
                  }}
                >
                  <FieldLabel label={field.label} required={field.required} />
                  {field.hint && <Text style={s.hint}>{field.hint}</Text>}
                  <TextInput
                    ref={(r) => {
                      inputRefs.current[field.key] = r;
                    }}
                    style={[s.input, field.multiline && s.inputMulti]}
                    value={device[field.key] as string}
                    onChangeText={(v) =>
                      onUpdate({ ...device, [field.key]: v })
                    }
                    placeholder="Enter value…"
                    placeholderTextColor={Colors.secondary}
                    returnKeyType={i < FIELDS.length - 1 ? "next" : "done"}
                    onSubmitEditing={() => goNext()}
                    onFocus={() => {
                      setFocusedIndex(i);
                      scrollToField(field.key);
                    }}
                    blurOnSubmit={field.multiline ?? false}
                    multiline={field.multiline}
                  />
                </View>
              );
            }

            if (field.type === "tristate") {
              return (
                <View
                  key={field.key}
                  onLayout={(e) => {
                    fieldOffsets.current[field.key] = e.nativeEvent.layout.y;
                  }}
                >
                  <TriStateField
                    label={field.label}
                    value={device[field.key] as TriStateVal}
                    onChange={(v) => handleTriStateChange(field.key, v)}
                    focused={focusedIndex === i}
                    onFocus={() => {
                      setFocusedIndex(i);
                      scrollToField(field.key);
                    }}
                  />
                </View>
              );
            }

            return null;
          })}

          <View style={{ height: 350 }} />
        </ScrollView>

        {/* ── Action bar ── */}
        <View style={s.actions}>
          <TouchableOpacity style={s.btnCancel} onPress={onCancel}>
            <Text style={s.btnCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSaveNew} onPress={onSaveNew}>
            <Text style={s.btnSaveNewText}>Save + New</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSaveClose} onPress={onSaveClose}>
            <Text style={s.btnSaveCloseText}>Save & Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: FontSize.xl,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
  },
  title: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
  },
  nav: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.md,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnDisabled: { opacity: 0.35 },
  navText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    lineHeight: 24,
  },
  navTextDisabled: { color: Colors.secondary },
  navCount: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    minWidth: 28,
    textAlign: "center",
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  fieldBlock: { marginBottom: Spacing.md },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.primary,
  },
  inputMulti: { minHeight: 90, textAlignVertical: "top" },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  btnCancelText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
  },
  btnSaveNew: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: "center",
  },
  btnSaveNewText: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  btnSaveClose: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
    alignItems: "center",
  },
  btnSaveCloseText: {
    fontSize: FontSize.md,
    color: "#FFF",
    fontWeight: FontWeight.bold,
  },
});
