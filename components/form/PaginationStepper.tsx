import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'

interface Props {
  current: number      // 0-based
  total: number
  onPrev: () => void
  onNext: () => void
}

export default function PaginationStepper({ current, total, onPrev, onNext }: Props) {
  const isFirst = current === 0
  const isLast = current === total - 1
  const progress = total > 1 ? current / (total - 1) : 1

  return (
    <View style={s.container}>
      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={s.row}>
        <TouchableOpacity
          style={[s.btn, isFirst && s.btnDisabled]}
          onPress={onPrev}
          disabled={isFirst}
          activeOpacity={0.7}
        >
          <Text style={[s.btnText, isFirst && s.btnTextDisabled]}>‹ Prev</Text>
        </TouchableOpacity>

        <Text style={s.counter}>
          <Text style={s.counterCurrent}>{current + 1}</Text>
          <Text style={s.counterSep}> / </Text>
          <Text style={s.counterTotal}>{total}</Text>
        </Text>

        <TouchableOpacity
          style={[s.btn, s.btnNext, isLast && s.btnDisabled]}
          onPress={onNext}
          disabled={isLast}
          activeOpacity={0.7}
        >
          <Text style={[s.btnText, s.btnNextText, isLast && s.btnTextDisabled]}>Next ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Spacing.lg,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  btn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 90,
    alignItems: 'center',
  },
  btnNext: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  btnNextText: {
    color: '#FFF',
  },
  btnTextDisabled: {},
  counter: {
    flexDirection: 'row',
  },
  counterCurrent: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  counterSep: {
    fontSize: FontSize.lg,
    color: Colors.secondary,
  },
  counterTotal: {
    fontSize: FontSize.lg,
    color: Colors.secondary,
  },
})
