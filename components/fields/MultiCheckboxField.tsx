import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
  options: string[];
  value?: string[];
  onChange?: (val: string[]) => void;
}

export default function MultiCheckboxField({
  label,
  required,
  options,
  value,
  onChange,
}: Props) {
  const [internal, setInternal] = useState<string[]>([]);
  const selected = value !== undefined ? value : internal;

  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter((x) => x !== opt)
      : [...selected, opt];
    if (onChange) onChange(next);
    else setInternal(next);
  };

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      {options.map((opt) => (
        <TouchableOpacity key={opt} style={s.row} onPress={() => toggle(opt)}>
          <View style={[s.box, selected.includes(opt) && s.boxActive]}>
            {selected.includes(opt) && <Text style={s.check}>✓</Text>}
          </View>
          <Text style={s.optLabel}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: Radii.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  check: { color: "#FFF", fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  optLabel: { fontSize: FontSize.md, color: Colors.primary },
});
