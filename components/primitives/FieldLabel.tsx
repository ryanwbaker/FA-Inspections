import { Text, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight } from "../../tokens";

// Strip HTML tags from schema labels — italic/bold markup is for PDF output only.
// A single flat <Text> avoids Fabric's nested-Text height-measurement bug.
function stripMarkup(s: string): string {
  return s.replace(/<\/?[a-z][^>]*>/gi, '')
}

interface Props {
  label: string;
  required?: boolean;
}

export default function FieldLabel({ label, required }: Props) {
  return (
    <Text style={s.label}>
      {stripMarkup(label)}{required ? ' *' : ''}
    </Text>
  );
}

const s = StyleSheet.create({
  label: {
    fontSize: FontSize.md,
    color: Colors.primary,
    marginBottom: 6,
    fontWeight: FontWeight.regular,
  },
});
