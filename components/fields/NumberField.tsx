import { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
  decimal?: boolean;
}

export default function NumberField({ label, required, decimal }: Props) {
  const [val, setVal] = useState("");

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      <TextInput
        style={s.input}
        value={val}
        onChangeText={setVal}
        keyboardType={decimal ? "decimal-pad" : "number-pad"}
        placeholder={decimal ? "0.00" : "0"}
        placeholderTextColor={Colors.secondary}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.primary,
    maxWidth: 180,
  },
});
