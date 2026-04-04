import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
  options: string[];
  value?: string | null;
  onChange?: (val: string) => void;
}

export default function RadioField({
  label,
  required,
  options,
  value,
  onChange,
}: Props) {
  const [internal, setInternal] = useState<string | null>(null);
  const val = value !== undefined ? value : internal;
  const handleChange = (v: string) => {
    if (onChange) onChange(v);
    else setInternal(v);
  };

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={s.row}
          onPress={() => handleChange(opt)}
        >
          <View style={[s.outer, val === opt && s.outerActive]}>
            {val === opt && <View style={s.inner} />}
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
  outer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  outerActive: { borderColor: Colors.accent },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  optLabel: { fontSize: FontSize.md, color: Colors.primary },
});
