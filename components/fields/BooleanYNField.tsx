import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
}

export default function BooleanYNField({ label, required }: Props) {
  const [val, setVal] = useState<boolean | null>(null);

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      <View style={s.row}>
        {([true, false] as const).map((opt) => (
          <TouchableOpacity
            key={String(opt)}
            style={[s.btn, val === opt && s.btnActive]}
            onPress={() => setVal(opt)}
          >
            <Text style={[s.btnLabel, val === opt && s.btnLabelActive]}>
              {opt ? "Yes" : "No"}
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
  btnActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  btnLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
  },
  btnLabelActive: { color: Colors.accent },
});
