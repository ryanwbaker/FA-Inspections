import { Text, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight } from "../../tokens";
import { parseMarkup } from "./RichText";

interface Props {
  label: string;
  required?: boolean;
}

export default function FieldLabel({ label, required }: Props) {
  const segments = parseMarkup(label)
  const isPlain = segments.every(seg => !seg.bold && !seg.italic && !seg.underline)

  return (
    <Text style={s.label}>
      {isPlain
        ? label
        : segments.map((seg, i) => (
            <Text
              key={i}
              style={[
                seg.bold && s.bold,
                seg.italic && s.italic,
                seg.underline && s.underline,
              ]}
            >
              {seg.text}
            </Text>
          ))
      }
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
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  underline: { textDecorationLine: "underline" },
});
