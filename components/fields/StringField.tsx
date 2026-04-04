import { View, Text, TextInput, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing, Radii } from "../../tokens";
import { FieldLabel } from "../primitives";

interface Props {
  label: string;
  required?: boolean;
  multiline?: boolean;
  hint?: string;
}

export default function StringField({
  label,
  required,
  multiline,
  hint,
}: Props) {
  const [val, setVal] = require("react").useState("");

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      {hint && <Text style={s.hint}>{hint}</Text>}
      <TextInput
        style={[s.input, multiline && s.inputMulti]}
        value={val}
        onChangeText={setVal}
        multiline={multiline}
        placeholder={multiline ? "Enter notes…" : "Enter value…"}
        placeholderTextColor={Colors.secondary}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.primary,
  },
  inputMulti: { minHeight: 90, textAlignVertical: "top" },
});
