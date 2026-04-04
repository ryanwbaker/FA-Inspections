import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
  options: string[];
  value?: string | null;
  onChange?: (val: string) => void;
}

export default function DropdownField({
  label,
  required,
  options,
  value,
  onChange,
}: Props) {
  const [internal, setInternal] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const val = value !== undefined ? value : internal;

  const handleChange = (v: string) => {
    if (onChange) onChange(v);
    else setInternal(v);
    setOpen(false);
  };

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      <TouchableOpacity style={s.btn} onPress={() => setOpen(!open)}>
        <Text style={val ? s.val : s.placeholder}>{val ?? "Select…"}</Text>
        <Text style={s.chevron}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {open && (
        <View style={s.list}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[s.item, val === opt && s.itemActive]}
              onPress={() => handleChange(opt)}
            >
              <Text style={[s.itemText, val === opt && s.itemTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  btn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  val: { fontSize: FontSize.lg, color: Colors.primary },
  placeholder: { fontSize: FontSize.lg, color: Colors.secondary },
  chevron: { fontSize: FontSize.xs, color: Colors.secondary },
  list: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    marginTop: Spacing.xs,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },
  item: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemActive: { backgroundColor: Colors.accentSoft },
  itemText: { fontSize: FontSize.md, color: Colors.primary },
  itemTextActive: { color: Colors.accent, fontWeight: FontWeight.semibold },
});
