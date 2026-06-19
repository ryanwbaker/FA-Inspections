import { StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight } from "../../tokens";
import RichText from "./RichText";

interface Props {
  label: string;
  required?: boolean;
}

export default function FieldLabel({ label, required }: Props) {
  return (
    <RichText text={label + (required ? ' *' : '')} style={s.label} />
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
