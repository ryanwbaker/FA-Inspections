import { useState } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import SignatureCanvas from "react-native-signature-canvas";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F0",
  surface: "#FFFFFF",
  border: "#E0DED8",
  primary: "#1A1A1A",
  secondary: "#6B6B6B",
  accent: "#D4380D", // fire-red accent
  accentSoft: "#FFF1ED",
  pass: "#389E0D",
  passSoft: "#F6FFED",
  fail: "#CF1322",
  failSoft: "#FFF1F0",
  na: "#8C8C8C",
  naSoft: "#FAFAFA",
  inputBg: "#FAFAF8",
};

// ─── Reusable primitives ─────────────────────────────────────────────────────

function SectionHeader({ clause, title }: { clause: string; title: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.clauseBadge}>
        <Text style={s.clauseText}>{clause}</Text>
      </View>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text style={s.fieldLabel}>
      {label}
      {required && <Text style={s.requiredStar}> *</Text>}
    </Text>
  );
}

// ─── Field: string / textarea ─────────────────────────────────────────────────

function StringField({
  label,
  required,
  multiline,
  hint,
}: {
  label: string;
  required?: boolean;
  multiline?: boolean;
  hint?: string;
}) {
  const [val, setVal] = useState("");
  return (
    <View style={s.fieldBlock}>
      <FieldLabel label={label} required={required} />
      {hint && <Text style={s.hint}>{hint}</Text>}
      <TextInput
        style={[s.input, multiline && s.inputMulti]}
        value={val}
        onChangeText={setVal}
        multiline={multiline}
        placeholder={multiline ? "Enter notes…" : "Enter value…"}
        placeholderTextColor={C.secondary}
      />
    </View>
  );
}

// ─── Field: integer / number ──────────────────────────────────────────────────

function NumberField({
  label,
  required,
  decimal,
}: {
  label: string;
  required?: boolean;
  decimal?: boolean;
}) {
  const [val, setVal] = useState("");
  return (
    <View style={s.fieldBlock}>
      <FieldLabel label={label} required={required} />
      <TextInput
        style={[s.input, s.inputNarrow]}
        value={val}
        onChangeText={setVal}
        keyboardType={decimal ? "decimal-pad" : "number-pad"}
        placeholder={decimal ? "0.00" : "0"}
        placeholderTextColor={C.secondary}
      />
    </View>
  );
}

// ─── Field: boolean_yn ────────────────────────────────────────────────────────

function BooleanYNField({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  const [val, setVal] = useState<boolean | null>(null);
  return (
    <View style={s.fieldBlock}>
      <FieldLabel label={label} required={required} />
      <View style={s.segRow}>
        {([true, false] as const).map((opt) => (
          <TouchableOpacity
            key={String(opt)}
            style={[s.segBtn, val === opt && s.segBtnActive]}
            onPress={() => setVal(opt)}
          >
            <Text style={[s.segLabel, val === opt && s.segLabelActive]}>
              {opt ? "Yes" : "No"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Field: tri_state ─────────────────────────────────────────────────────────

type TriVal = "pass" | "fail" | "na" | null;

function TriStateField({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  const [val, setVal] = useState<TriVal>(null);

  const opts: { value: TriVal; label: string; color: string; bg: string }[] = [
    { value: "pass", label: "✓", color: C.pass, bg: C.passSoft },
    { value: "fail", label: "✗", color: C.fail, bg: C.failSoft },
    { value: "na", label: "—", color: C.na, bg: C.naSoft },
  ];

  return (
    <View style={s.triRow}>
      <Text style={s.triLabel}>
        {label}
        {required && <Text style={s.requiredStar}> *</Text>}
      </Text>
      <View style={s.triButtons}>
        {opts.map((o) => (
          <TouchableOpacity
            key={o.value!}
            style={[
              s.triBtn,
              val === o.value && {
                backgroundColor: o.bg,
                borderColor: o.color,
              },
            ]}
            onPress={() => setVal(o.value)}
          >
            <Text
              style={[s.triBtnLabel, val === o.value && { color: o.color }]}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Field: radio ─────────────────────────────────────────────────────────────

function RadioField({
  label,
  required,
  options,
}: {
  label: string;
  required?: boolean;
  options: string[];
}) {
  const [val, setVal] = useState<string | null>(null);
  return (
    <View style={s.fieldBlock}>
      <FieldLabel label={label} required={required} />
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={s.radioRow}
          onPress={() => setVal(opt)}
        >
          <View style={[s.radioOuter, val === opt && s.radioOuterActive]}>
            {val === opt && <View style={s.radioInner} />}
          </View>
          <Text style={s.radioLabel}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Field: multi_checkbox ────────────────────────────────────────────────────

function MultiCheckboxField({
  label,
  required,
  options,
}: {
  label: string;
  required?: boolean;
  options: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (opt: string) => {
    const next = new Set(selected);
    next.has(opt) ? next.delete(opt) : next.add(opt);
    setSelected(next);
  };
  return (
    <View style={s.fieldBlock}>
      <FieldLabel label={label} required={required} />
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={s.radioRow}
          onPress={() => toggle(opt)}
        >
          <View style={[s.checkbox, selected.has(opt) && s.checkboxActive]}>
            {selected.has(opt) && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.radioLabel}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Field: dropdown (simple picker stand-in) ─────────────────────────────────

function DropdownField({
  label,
  required,
  options,
}: {
  label: string;
  required?: boolean;
  options: string[];
}) {
  const [val, setVal] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <View style={s.fieldBlock}>
      <FieldLabel label={label} required={required} />
      <TouchableOpacity style={s.dropdownBtn} onPress={() => setOpen(!open)}>
        <Text style={val ? s.dropdownVal : s.dropdownPlaceholder}>
          {val ?? "Select…"}
        </Text>
        <Text style={s.dropdownChevron}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {open && (
        <View style={s.dropdownList}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[s.dropdownItem, val === opt && s.dropdownItemActive]}
              onPress={() => {
                setVal(opt);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  s.dropdownItemText,
                  val === opt && s.dropdownItemTextActive,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Field: date ──────────────────────────────────────────────────────────────

function DateField({ label, required }: { label: string; required?: boolean }) {
  const [val, setVal] = useState("");
  return (
    <View style={s.fieldBlock}>
      <FieldLabel label={label} required={required} />
      <TextInput
        style={[s.input, s.inputNarrow]}
        value={val}
        onChangeText={setVal}
        placeholder="MM/DD/YY"
        placeholderTextColor={C.secondary}
        keyboardType="numbers-and-punctuation"
        maxLength={8}
      />
    </View>
  );
}

// ─── Field: signature ─────────────────────────────────────────────────────────

const sigWebStyle = `
  * { touch-action: none; }
  .m-signature-pad { 
    box-shadow: none; 
    border: none;
    margin: 0;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
    height: 100%;
  }
  .m-signature-pad--body { 
    border: none;
    background: #FAFAF8;
    position: absolute;
    top: 0; left: 0; right: 0;
    bottom: 80px;
  }
  .m-signature-pad--footer {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 80px;
    background: #FFFFFF;
    border-top: 1px solid #E0DED8;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
  .m-signature-pad--footer .button {
    background-color: #D4380D;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 32px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    height: 48px;
    line-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    -webkit-appearance: none;
    appearance: none;
    box-sizing: border-box;
  }
  .m-signature-pad--footer .button.clear {
    background-color: transparent;
    color: #6B6B6B;
    border: 1px solid #E0DED8;
    padding: 0 32px;
  }
  .m-signature-pad--footer .description {
    display: none;
  }
  body { 
    margin: 0; 
    background: #FAFAF8;
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }
`;

function SignatureField({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  const [sig, setSig] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const openModal = async () => {
    await ScreenOrientation.unlockAsync();
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    );
    setModalVisible(true);
  };

  const closeModal = async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
    setModalVisible(false);
  };

  const handleSave = async (data: string) => {
    setSig(data);
    setTimestamp(new Date().toLocaleString());
    await closeModal();
  };

  const handleClear = () => {
    setSig(null);
    setTimestamp(null);
  };

  return (
    <View style={s.fieldBlock}>
      <FieldLabel label={label} required={required} />

      {sig ? (
        <View style={s.sigPreviewBox}>
          <Image
            source={{ uri: sig }}
            style={s.sigPreviewImage}
            resizeMode="contain"
          />
          <View style={s.sigPreviewMeta}>
            <Text style={s.sigTimestamp}>Signed {timestamp}</Text>
            <View style={s.sigActions}>
              <TouchableOpacity onPress={openModal} style={s.sigActionBtn}>
                <Text style={s.sigActionText}>Redraw</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClear}
                style={[s.sigActionBtn, s.sigActionBtnDanger]}
              >
                <Text style={[s.sigActionText, s.sigActionTextDanger]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.signatureBox} onPress={openModal}>
          <Text style={s.signaturePlaceholder}>Tap to sign</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        supportedOrientations={[
          "landscape",
          "landscape-left",
          "landscape-right",
        ]}
      >
        <SafeAreaView style={[s.modalSafe, { backgroundColor: "#FAFAF8" }]}>
          <View style={[s.modalHeader, { paddingHorizontal: 20 }]}>
            <TouchableOpacity
              onPress={closeModal}
              style={s.modalClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Sign Here</Text>
            <View style={{ width: 32 }} />
          </View>
          <View style={s.sigCanvasWrapper}>
            <SignatureCanvas
              onOK={handleSave}
              onEmpty={() => {}}
              descriptionText=""
              clearText="Clear"
              confirmText="Save Signature"
              webStyle={sigWebStyle}
              autoClear={false}
              imageType="image/png"
              scrollable={false}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ─── Field: pass_fail ─────────────────────────────────────────────────────────

function PassFailField({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  const [val, setVal] = useState<"pass" | "fail" | null>(null);
  return (
    <View style={s.fieldBlock}>
      <FieldLabel label={label} required={required} />
      <View style={s.segRow}>
        {(["pass", "fail"] as const).map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              s.segBtn,
              val === opt && {
                backgroundColor: opt === "pass" ? C.passSoft : C.failSoft,
                borderColor: opt === "pass" ? C.pass : C.fail,
              },
            ]}
            onPress={() => setVal(opt)}
          >
            <Text
              style={[
                s.segLabel,
                val === opt && { color: opt === "pass" ? C.pass : C.fail },
              ]}
            >
              {opt === "pass" ? "Pass" : "Fail"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Repeatable Device Record ─────────────────────────────────────────────────

type TriStateVal = "pass" | "fail" | "na" | null;

interface DeviceRecord {
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

function newDevice(): DeviceRecord {
  return {
    id: Math.random().toString(36).slice(2),
    location: "",
    deviceType: "",
    circuitAddress: "",
    fireZone: "",
    needsService: null,
    alarmConfirmed: null,
    annunciatorInd: null,
    circuitTrouble: null,
    comments: "",
  };
}

function TriStateMini({
  value,
  onChange,
}: {
  value: TriStateVal;
  onChange: (v: TriStateVal) => void;
}) {
  const opts: {
    value: TriStateVal;
    label: string;
    color: string;
    bg: string;
  }[] = [
    { value: "pass", label: "✓", color: C.pass, bg: C.passSoft },
    { value: "fail", label: "✗", color: C.fail, bg: C.failSoft },
    { value: "na", label: "—", color: C.na, bg: C.naSoft },
  ];
  return (
    <View style={s.triButtons}>
      {opts.map((o) => (
        <TouchableOpacity
          key={o.value!}
          style={[
            s.triBtn,
            value === o.value && {
              backgroundColor: o.bg,
              borderColor: o.color,
            },
          ]}
          onPress={() => onChange(o.value)}
        >
          <Text
            style={[s.triBtnLabel, value === o.value && { color: o.color }]}
          >
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function DeviceStatusDot({ value }: { value: TriStateVal }) {
  const color =
    value === "pass"
      ? C.pass
      : value === "fail"
        ? C.fail
        : value === "na"
          ? C.na
          : C.border;
  return <View style={[s.statusDot, { backgroundColor: color }]} />;
}

// ─── Device Modal ─────────────────────────────────────────────────────────────

function DeviceModal({
  devices,
  activeIndex,
  onNavigate,
  onSaveClose,
  onSaveNew,
  onCancel,
  onUpdate,
}: {
  devices: DeviceRecord[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  onSaveClose: () => void;
  onSaveNew: () => void;
  onCancel: () => void;
  onUpdate: (d: DeviceRecord) => void;
}) {
  const device = devices[activeIndex];
  const total = devices.length;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.modalSafe}>
        {/* ── Modal header ── */}
        <View style={s.modalHeader}>
          <TouchableOpacity
            onPress={onCancel}
            style={s.modalClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.modalCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle}>Device Record</Text>
          {/* Prev / Next */}
          <View style={s.modalNav}>
            <TouchableOpacity
              style={[
                s.modalNavBtn,
                activeIndex === 0 && s.modalNavBtnDisabled,
              ]}
              onPress={() => onNavigate(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <Text
                style={[
                  s.modalNavText,
                  activeIndex === 0 && s.modalNavTextDisabled,
                ]}
              >
                ‹
              </Text>
            </TouchableOpacity>
            <Text style={s.modalNavCount}>
              {activeIndex + 1}/{total}
            </Text>
            <TouchableOpacity
              style={[
                s.modalNavBtn,
                activeIndex === total - 1 && s.modalNavBtnDisabled,
              ]}
              onPress={() => onNavigate(activeIndex + 1)}
              disabled={activeIndex === total - 1}
            >
              <Text
                style={[
                  s.modalNavText,
                  activeIndex === total - 1 && s.modalNavTextDisabled,
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Scrollable fields ── */}
        <ScrollView
          style={s.modalScroll}
          contentContainerStyle={s.modalContent}
        >
          {(
            [
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
              {
                key: "circuitAddress",
                label: "Circuit / Address",
                hint: "",
                required: true,
              },
              {
                key: "fireZone",
                label: "Annunciated Fire Zone",
                hint: "",
                required: true,
              },
            ] as const
          ).map((f) => (
            <View key={f.key} style={s.fieldBlock}>
              <Text style={s.fieldLabel}>
                {f.label}
                {f.required && <Text style={s.requiredStar}> *</Text>}
              </Text>
              {f.hint ? <Text style={s.hint}>{f.hint}</Text> : null}
              <TextInput
                style={s.input}
                value={device[f.key]}
                onChangeText={(v) => onUpdate({ ...device, [f.key]: v })}
                placeholder="Enter value…"
                placeholderTextColor={C.secondary}
              />
            </View>
          ))}

          <View style={s.modalDivider} />

          {(
            [
              {
                key: "needsService",
                label: "Requires Service / Repairs / Cleaning",
              },
              { key: "alarmConfirmed", label: "Alarm / Activation Confirmed" },
              { key: "annunciatorInd", label: "Annunciator Indication" },
              {
                key: "circuitTrouble",
                label: "Supervised Circuit Trouble Signal",
              },
            ] as const
          ).map((f) => (
            <View key={f.key} style={[s.triRow, { marginBottom: 16 }]}>
              <Text style={s.triLabel}>{f.label}</Text>
              <TriStateMini
                value={device[f.key]}
                onChange={(v) => onUpdate({ ...device, [f.key]: v })}
              />
            </View>
          ))}

          <View style={s.modalDivider} />

          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>Comments</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={device.comments}
              onChangeText={(v) => onUpdate({ ...device, comments: v })}
              multiline
              placeholder="Enter notes…"
              placeholderTextColor={C.secondary}
            />
          </View>

          {/* Bottom padding so content clears the action bar */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── Action bar ── */}
        <View style={s.modalActions}>
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

// ─── Device List ──────────────────────────────────────────────────────────────

function DeviceList() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // Draft holds in-progress edits while modal is open
  const [draft, setDraft] = useState<DeviceRecord[]>([]);

  const openModal = (index: number) => {
    setDraft([...devices]);
    setActiveIndex(index);
  };

  const openNew = () => {
    const next = [...devices, newDevice()];
    setDraft(next);
    setActiveIndex(next.length - 1);
  };

  const handleUpdate = (d: DeviceRecord) => {
    setDraft((prev) => prev.map((x) => (x.id === d.id ? d : x)));
  };

  const handleSaveClose = () => {
    setDevices(draft);
    setActiveIndex(null);
  };

  const handleSaveNew = () => {
    const next = [...draft, newDevice()];
    setDraft(next);
    setDevices(next);
    setActiveIndex(next.length - 1);
  };

  const handleCancel = () => {
    setActiveIndex(null);
    // discard draft — devices unchanged
  };

  const handleDelete = (id: string) => {
    Alert.alert("Remove Device", "Remove this device record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setDevices((prev) => prev.filter((x) => x.id !== id));
        },
      },
    ]);
  };

  return (
    <View>
      {devices.length === 0 && (
        <Text style={s.emptyState}>
          No devices added yet. Tap below to add the first one.
        </Text>
      )}

      {devices.map((d, i) => (
        <TouchableOpacity
          key={d.id}
          style={s.deviceCard}
          onPress={() => openModal(i)}
          activeOpacity={0.7}
        >
          <View style={s.deviceCardHeader}>
            <View style={s.deviceBadge}>
              <Text style={s.deviceBadgeText}>{d.deviceType || "?"}</Text>
            </View>
            <View style={s.deviceSummary}>
              <Text style={s.deviceSummaryTitle} numberOfLines={1}>
                {d.location || "New Device"}
              </Text>
              <Text style={s.deviceSummaryZone} numberOfLines={1}>
                {d.fireZone ? `Zone: ${d.fireZone}` : "No zone set"}
              </Text>
            </View>
            <View style={s.deviceDots}>
              <DeviceStatusDot value={d.needsService} />
              <DeviceStatusDot value={d.alarmConfirmed} />
              <DeviceStatusDot value={d.annunciatorInd} />
              <DeviceStatusDot value={d.circuitTrouble} />
            </View>
            <Text style={s.deviceChevron}>›</Text>
          </View>

          {/* Swipe-to-delete hint on long press */}
          <TouchableOpacity
            style={s.deviceDeleteHint}
            onPress={() => handleDelete(d.id)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={s.deviceDeleteHintText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={s.addBtn} onPress={openNew}>
        <Text style={s.addBtnText}>+ Add Device</Text>
      </TouchableOpacity>

      {activeIndex !== null && (
        <DeviceModal
          devices={draft}
          activeIndex={activeIndex}
          onNavigate={setActiveIndex}
          onSaveClose={handleSaveClose}
          onSaveNew={handleSaveNew}
          onCancel={handleCancel}
          onUpdate={handleUpdate}
        />
      )}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SampleSection() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.appTitle}>FA Inspections</Text>
        <Text style={s.appSubtitle}>CAN/ULC-S536:2019</Text>

        <SectionHeader clause="22.2" title="Control Unit Functional Test" />

        {/* tri_state — the most common field type */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Pass / Fail / N/A Fields</Text>
          <TriStateField
            label="A — Power 'on' visual indicator operates."
            required
          />
          <View style={s.divider} />
          <TriStateField
            label="B — Time and date indication corresponds with local time and date."
            required
          />
          <View style={s.divider} />
          <TriStateField
            label="C — Common visual trouble signal operates."
            required
          />
        </View>

        {/* string */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Text Fields</Text>
          <StringField
            label="Field Location"
            required
            hint="Floor, room, or panel identifier"
          />
          <View style={s.divider} />
          <StringField
            label="Technician's Recommendations / Testing Notes"
            multiline
          />
        </View>

        {/* number */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Numeric Fields</Text>
          <NumberField label="Auto-transfer time (seconds)" />
          <View style={s.divider} />
          <NumberField label="Battery voltage — main power ON (VDC)" decimal />
        </View>

        {/* date */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Date Field</Text>
          <DateField label="Date of Service?" required />
        </View>

        {/* boolean_yn */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Yes / No Fields</Text>
          <BooleanYNField
            label="System is connected to a Fire Signal Receiving Centre."
            required
          />
          <View style={s.divider} />
          <BooleanYNField
            label="The fire alarm system is fully functional."
            required
          />
        </View>

        {/* radio */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Single Select (Radio)</Text>
          <RadioField
            label="System Stage"
            required
            options={["Single Stage", "Two Stage", "Other"]}
          />
        </View>

        {/* multi_checkbox */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Multi Select (Checkbox)</Text>
          <MultiCheckboxField
            label="System Technology"
            required
            options={["Addressable", "Conventional", "Wireless", "Hybrid"]}
          />
        </View>

        {/* dropdown */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Dropdown</Text>
          <DropdownField
            label="Device Type"
            required
            options={[
              "M — Manual pull station",
              "HT — Heat Detector",
              "PS — Photo-electric Smoke",
              "DS — Duct Smoke Detector",
              "FS — Sprinkler Flow Switch",
              "B — Bell",
              "H — Horn",
            ]}
          />
        </View>

        {/* pass_fail */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Pass / Fail (Circuit Fault)</Text>
          <PassFailField label="Circuit fault tolerance test result" required />
        </View>

        {/* signature */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>Signature</Text>
          <SignatureField label="Primary Technician Signature" required />
        </View>

        {/* repeatable_list */}
        <View style={s.card}>
          <Text style={s.cardGroupLabel}>
            Repeatable List — Device Record (§23.2)
          </Text>
          <DeviceList />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },

  appTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.primary,
    marginBottom: 2,
  },
  appSubtitle: { fontSize: 13, color: C.secondary, marginBottom: 24 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  clauseBadge: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  clauseText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: C.primary, flex: 1 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardGroupLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  fieldBlock: { marginBottom: 4 },
  fieldLabel: {
    fontSize: 14,
    color: C.primary,
    marginBottom: 6,
    lineHeight: 20,
  },
  requiredStar: { color: C.accent },
  hint: { fontSize: 12, color: C.secondary, marginBottom: 6 },

  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.primary,
  },
  inputMulti: { minHeight: 90, textAlignVertical: "top" },
  inputNarrow: { maxWidth: 180 },

  // tri_state
  triRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  triLabel: { fontSize: 14, color: C.primary, flex: 1, lineHeight: 20 },
  triButtons: { flexDirection: "row", gap: 6 },
  triBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  triBtnLabel: { fontSize: 16, color: C.secondary, fontWeight: "600" },

  // boolean_yn / pass_fail
  segRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  segBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  segBtnActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  segLabel: { fontSize: 14, fontWeight: "600", color: C.secondary },
  segLabelActive: { color: C.accent },

  // radio
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: C.accent },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.accent,
  },
  radioLabel: { fontSize: 14, color: C.primary },

  // checkbox
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: C.accent, borderColor: C.accent },
  checkmark: { color: "#FFF", fontSize: 12, fontWeight: "700" },

  // dropdown
  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownVal: { fontSize: 15, color: C.primary },
  dropdownPlaceholder: { fontSize: 15, color: C.secondary },
  dropdownChevron: { fontSize: 11, color: C.secondary },
  dropdownList: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: C.surface,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropdownItemActive: { backgroundColor: C.accentSoft },
  dropdownItemText: { fontSize: 14, color: C.primary },
  dropdownItemTextActive: { color: C.accent, fontWeight: "600" },

  // device list
  deviceCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: C.inputBg,
    flexDirection: "row",
    alignItems: "center",
  },
  deviceCardHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  deviceBadge: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: "center",
  },
  deviceBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  deviceSummary: { flex: 1 },
  deviceSummaryTitle: { fontSize: 14, fontWeight: "600", color: C.primary },
  deviceSummaryZone: { fontSize: 12, color: C.secondary, marginTop: 1 },
  deviceDots: { flexDirection: "row", gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  deviceChevron: { fontSize: 18, color: C.secondary, marginLeft: 4 },
  deviceDeleteHint: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },
  deviceDeleteHintText: { fontSize: 13, color: C.fail, fontWeight: "600" },
  emptyState: {
    fontSize: 13,
    color: C.secondary,
    textAlign: "center",
    paddingVertical: 16,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: C.accent,
    borderRadius: 8,
    borderStyle: "dashed",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  addBtnText: { color: C.accent, fontWeight: "600", fontSize: 14 },

  // modal
  modalSafe: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: { fontSize: 16, color: C.secondary, fontWeight: "600" },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: C.primary,
    textAlign: "center",
  },
  modalNav: { flexDirection: "row", alignItems: "center", gap: 4 },
  modalNavBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalNavBtnDisabled: { opacity: 0.35 },
  modalNavText: {
    fontSize: 20,
    color: C.primary,
    fontWeight: "600",
    lineHeight: 24,
  },
  modalNavTextDisabled: { color: C.secondary },
  modalNavCount: {
    fontSize: 12,
    color: C.secondary,
    minWidth: 28,
    textAlign: "center",
  },
  modalScroll: { flex: 1 },
  modalContent: { padding: 16 },
  modalDivider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  btnCancelText: { fontSize: 14, color: C.secondary, fontWeight: "600" },
  btnSaveNew: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.accent,
    alignItems: "center",
  },
  btnSaveNewText: { fontSize: 14, color: C.accent, fontWeight: "600" },
  btnSaveClose: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  btnSaveCloseText: { fontSize: 14, color: "#FFF", fontWeight: "700" },

  // signature
  signatureBox: {
    height: 80,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 8,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.inputBg,
  },
  signatureBoxSigned: {
    borderStyle: "solid",
    borderColor: C.pass,
    backgroundColor: C.passSoft,
  },
  signaturePlaceholder: { fontSize: 14, color: C.secondary },
  signatureSigned: { fontSize: 14, color: C.pass, fontWeight: "600" },
  sigPreviewBox: {
    borderWidth: 1,
    borderColor: C.pass,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: C.passSoft,
  },
  sigPreviewImage: { width: "100%", height: 120, backgroundColor: C.passSoft },
  sigPreviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  sigTimestamp: { fontSize: 12, color: C.secondary, flex: 1 },
  sigActions: { flexDirection: "row", gap: 8 },
  sigActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  sigActionBtnDanger: { borderColor: C.fail, backgroundColor: C.failSoft },
  sigActionText: { fontSize: 12, color: C.secondary, fontWeight: "600" },
  sigActionTextDanger: { color: C.fail },
  sigCanvasWrapper: { flex: 1 },
});
