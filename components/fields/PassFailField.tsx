import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
  value?: "pass" | "fail" | null;
  onChange?: (val: "pass" | "fail") => void;
}

const opts: {
  value: "pass" | "fail";
  label: string;
  color: string;
  bg: string;
}[] = [
  { value: "pass", label: "Pass", color: Colors.pass, bg: Colors.passSoft },
  { value: "fail", label: "Fail", color: Colors.fail, bg: Colors.failSoft },
];

export default function PassFailField({
  label,
  required,
  value,
  onChange,
}: Props) {
  const [internal, setInternal] = useState<"pass" | "fail" | null>(null);
  const val = value !== undefined ? value : internal;
  const handleChange = (v: "pass" | "fail") => {
    if (onChange) onChange(v);
    else setInternal(v);
  };

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      <View style={s.row}>
        {opts.map((o) => (
          <TouchableOpacity
            key={o.value}
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
  container: { marginBottom: Spacing.xs },
  row: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
  },
});
