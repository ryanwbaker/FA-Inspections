import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (val: string) => void;
}

function toDate(val: string): Date {
  if (val) {
    const parts = val.split("/");
    if (parts.length === 3) {
      const year = parseInt(parts[2].length === 2 ? "20" + parts[2] : parts[2]);
      const d = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
      if (!isNaN(d.getTime())) return d;
    }
  }
  return new Date();
}

function toDisplay(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${mm}/${dd}/${yy}`;
}

export default function DateField({ label, required, value, onChange }: Props) {
  const [internal, setInternal] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const val = value !== undefined ? value : internal;
  const currentDate = toDate(val);

  const commit = (d: Date) => {
    const formatted = toDisplay(d);
    if (onChange) onChange(formatted);
    else setInternal(formatted);
  };

  // Android: picker renders inline on change event — no modal needed
  if (Platform.OS === "android") {
    return (
      <View style={s.container}>
        <FieldLabel label={label} required={required} />
        <TouchableOpacity style={s.input} onPress={() => setShowPicker(true)}>
          <Text style={val ? s.inputText : s.placeholder}>{val || "MM/DD/YY"}</Text>
          <Text style={s.calIcon}>📅</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={currentDate}
            mode="date"
            onChange={(_, d) => {
              setShowPicker(false);
              if (d) commit(d);
            }}
          />
        )}
      </View>
    );
  }

  // iOS: show native spinner in a bottom sheet modal
  const [draft, setDraft] = useState(currentDate);

  const handleOpen = () => {
    setDraft(toDate(val));
    setShowPicker(true);
  };

  const handleDone = () => {
    commit(draft);
    setShowPicker(false);
  };

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      <TouchableOpacity style={s.input} onPress={handleOpen}>
        <Text style={val ? s.inputText : s.placeholder}>{val || "MM/DD/YY"}</Text>
        <Text style={s.calIcon}>📅</Text>
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={s.sheetTitle}>Select Date</Text>
              <TouchableOpacity onPress={handleDone}>
                <Text style={s.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              onChange={(_, d) => { if (d) setDraft(d); }}
              style={s.picker}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  inputText: { flex: 1, fontSize: FontSize.lg, color: Colors.primary },
  placeholder: { flex: 1, fontSize: FontSize.lg, color: Colors.secondary },
  calIcon: { fontSize: 18 },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    paddingBottom: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  cancelText: { fontSize: FontSize.lg, color: Colors.secondary },
  doneText: {
    fontSize: FontSize.lg,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  picker: { width: "100%" },
});
