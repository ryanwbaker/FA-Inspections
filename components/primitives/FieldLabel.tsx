import { Text, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight } from "../../tokens";

interface Props {
  label: string;
  required?: boolean;
}

export default function FieldLabel({ label, required }: Props) {
  return (
    <Text style={s.label}>
      {label}
      {required && <Text style={s.star}> *</Text>}
    </Text>
  );
}

const s = StyleSheet.create({
  label: {
    fontSize: FontSize.md,
    color: Colors.primary,
    marginBottom: 6,
    lineHeight: 20,
    fontWeight: FontWeight.regular,
  },
  star: { color: Colors.accent },
});
