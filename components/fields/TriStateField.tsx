import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

export type TriStateVal = "pass" | "fail" | "na" | null;

interface Props {
  label: string;
  required?: boolean;
  value?: TriStateVal;
  onChange?: (val: TriStateVal) => void;
}

const opts: { value: TriStateVal; label: string; color: string; bg: string }[] =
  [
    { value: "pass", label: "✓", color: Colors.pass, bg: Colors.passSoft },
    { value: "fail", label: "✗", color: Colors.fail, bg: Colors.failSoft },
    { value: "na", label: "—", color: Colors.na, bg: Colors.naSoft },
  ];

export default function TriStateField({
  label,
  required,
  value,
  onChange,
}: Props) {
  const [internal, setInternal] = useState<TriStateVal>(null);
  const val = value !== undefined ? value : internal;
  const handleChange = (v: TriStateVal) => {
    if (onChange) onChange(v);
    else setInternal(v);
  };

  return (
    <View style={s.row}>
      <Text style={s.label}>
        {label}
        {required && <Text style={s.star}> *</Text>}
      </Text>
      <View style={s.buttons}>
        {opts.map((o) => (
          <TouchableOpacity
            key={o.value!}
            style={[
              s.btn,
              val === o.value && {
                backgroundColor: o.bg,
                borderColor: o.color,
              },
            ]}
            onPress={() => handleChange(o.value)}
          >
            <Text style={[s.btnLabel, val === o.value && { color: o.color }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.md,
    color: Colors.primary,
    flex: 1,
    lineHeight: 20,
  },
  star: { color: Colors.accent },
  buttons: { flexDirection: "row", gap: 6 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: {
    fontSize: FontSize.xl,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
  },
});
