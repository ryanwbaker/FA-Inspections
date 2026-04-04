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
import { FieldLabel, Divider } from "../primitives";
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

  const textFields: {
    key: keyof Pick<
      DeviceRecord,
      "location" | "deviceType" | "circuitAddress" | "fireZone"
    >;
    label: string;
    hint?: string;
    required?: boolean;
  }[] = [
    {
      key: "location",
      label: "Device Location",
      hint: "Floor, room, or area",
      required: true,
    },
    {
      key: "deviceType",
      label: "Device Type",
      hint: "e.g. PS, HT, M, FS",
      required: true,
    },
    { key: "circuitAddress", label: "Circuit / Address", required: true },
    { key: "fireZone", label: "Annunciated Fire Zone", required: true },
  ];

  const triFields: {
    key: keyof Pick<
      DeviceRecord,
      "needsService" | "alarmConfirmed" | "annunciatorInd" | "circuitTrouble"
    >;
    label: string;
  }[] = [
    { key: "needsService", label: "Requires Service / Repairs / Cleaning" },
    { key: "alarmConfirmed", label: "Alarm / Activation Confirmed" },
    { key: "annunciatorInd", label: "Annunciator Indication" },
    { key: "circuitTrouble", label: "Supervised Circuit Trouble Signal" },
  ];

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

        {/* ── Scrollable fields ── */}
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          {textFields.map((f) => (
            <View key={f.key} style={s.fieldBlock}>
              <FieldLabel label={f.label} required={f.required} />
              {f.hint && <Text style={s.hint}>{f.hint}</Text>}
              <TextInput
                style={s.input}
                value={device[f.key]}
                onChangeText={(v) => onUpdate({ ...device, [f.key]: v })}
                placeholder="Enter value…"
                placeholderTextColor={Colors.secondary}
              />
            </View>
          ))}

          <Divider />

          {triFields.map((f) => (
            <TriStateField
              key={f.key}
              label={f.label}
              value={device[f.key]}
              onChange={(v) => onUpdate({ ...device, [f.key]: v })}
            />
          ))}

          <Divider />

          <View style={s.fieldBlock}>
            <FieldLabel label="Comments" />
            <TextInput
              style={[s.input, s.inputMulti]}
              value={device.comments}
              onChangeText={(v) => onUpdate({ ...device, comments: v })}
              multiline
              placeholder="Enter notes…"
              placeholderTextColor={Colors.secondary}
            />
          </View>

          <View style={{ height: 120 }} />
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
  fieldBlock: { marginBottom: Spacing.xs },
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
