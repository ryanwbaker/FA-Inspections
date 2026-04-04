import { View, Text, StyleSheet } from "react-native";
import { Colors, FontSize, FontWeight, Spacing, Radii } from "../../tokens";

interface Props {
  clause: string;
  title: string;
}

export default function SectionHeader({ clause, title }: Props) {
  return (
    <View style={s.container}>
      <View style={s.badge}>
        <Text style={s.badgeText}>{clause}</Text>
      </View>
      <Text style={s.title}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  badge: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#FFF",
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    flex: 1,
  },
});
