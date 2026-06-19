import { useState } from 'react'
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import { FieldLabel } from '../primitives'
import { pickImageAsDataUri } from '../../services/imagePicker'

interface Props {
  label: string
  required?: boolean
  value?: string | null
  onChange?: (val: string | null) => void
}

export default function ImageField({ label, required, value, onChange }: Props) {
  const [internal, setInternal] = useState<string | null>(null)
  const img = value !== undefined ? value : internal
  const setImg = (v: string | null) => {
    if (onChange) onChange(v)
    else setInternal(v)
  }

  const pick = async () => {
    const dataUri = await pickImageAsDataUri()
    if (dataUri) setImg(dataUri)
  }

  return (
    <View style={s.container}>
      <FieldLabel label={label} required={required} />
      {img ? (
        <View style={s.previewBox}>
          <Image source={{ uri: img }} style={s.previewImage} resizeMode="contain" />
          <View style={s.actions}>
            <TouchableOpacity onPress={pick} style={s.actionBtn}>
              <Text style={s.actionText}>Replace</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setImg(null)} style={[s.actionBtn, s.actionBtnDanger]}>
              <Text style={[s.actionText, s.actionTextDanger]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.placeholder} onPress={pick}>
          <Text style={s.placeholderText}>Tap to choose image</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  placeholder: {
    height: 80,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
  },
  placeholderText: { fontSize: FontSize.md, color: Colors.secondary },
  previewBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.inputBg,
  },
  previewImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.inputBg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionBtnDanger: {
    borderColor: Colors.fail,
    backgroundColor: Colors.failSoft,
  },
  actionText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: FontWeight.semibold,
  },
  actionTextDanger: { color: Colors.fail },
})
