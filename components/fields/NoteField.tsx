import { View, StyleSheet } from 'react-native'
import { Colors, FontSize, Spacing, Radii } from '../../tokens'
import RichText from '../primitives/RichText'

interface Props {
  text: string
}

export default function NoteField({ text }: Props) {
  return (
    <View style={s.container}>
      <View style={s.stripe} />
      <RichText text={text} style={s.text} />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.naSoft,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  stripe: {
    width: 4,
    backgroundColor: Colors.secondary,
  },
  text: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.secondary,
    lineHeight: 20,
    padding: Spacing.md,
  },
})
