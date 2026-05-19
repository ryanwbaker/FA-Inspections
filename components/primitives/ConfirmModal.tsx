import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'

interface Props {
  visible: boolean
  title: string
  message?: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  visible, title, message,
  confirmLabel = 'Confirm', destructive,
  onConfirm, onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>{title}</Text>
          {message ? <Text style={s.message}>{message}</Text> : null}
          <View style={s.buttons}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.confirmBtn, destructive && s.destructiveBtn]}
              onPress={onConfirm}
            >
              <Text style={[s.confirmText, destructive && s.destructiveText]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  destructiveBtn: { backgroundColor: Colors.fail },
  confirmText: {
    fontSize: FontSize.md,
    color: '#FFF',
    fontWeight: FontWeight.bold,
  },
  destructiveText: { color: '#FFF' },
})
