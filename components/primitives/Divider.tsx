import { View, StyleSheet } from "react-native";
import { Colors, Spacing } from "../../tokens";

export default function Divider() {
  return <View style={s.divider} />;
}

const s = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
});
