import { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
}

export default function DateField({ label, required }: Props) {
  const [val, setVal] = useState("");

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      <TextInput
        style={s.input}
        value={val}
        onChangeText={setVal}
        placeholder="MM/DD/YY"
        placeholderTextColor={Colors.secondary}
        keyboardType="numbers-and-punctuation"
        maxLength={8}
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
