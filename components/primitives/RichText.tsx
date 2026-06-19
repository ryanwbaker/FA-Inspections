import { Text, StyleSheet } from 'react-native'
import { Colors } from '../../tokens'
import { useSectionNavigation } from '../../context/SectionNavigationContext'

// Supported inline tags: <strong>/<b>, <em>/<i>, <u>, <a ref="sectionId">
type Segment = {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  sectionRef?: string  // present only for <a ref="..."> segments
}

// Parses inline formatting tags within a plain-text chunk (no <a> tags).
function parseInline(input: string): Segment[] {
  const parts = input.split(/(<\/?(?:strong|b|em|i|u)>)/g)
  const segments: Segment[] = []
  let bold = false, italic = false, underline = false

  for (const part of parts) {
    switch (part) {
      case '<strong>': case '<b>': bold = true; break
      case '</strong>': case '</b>': bold = false; break
      case '<em>': case '<i>': italic = true; break
      case '</em>': case '</i>': italic = false; break
      case '<u>': underline = true; break
      case '</u>': underline = false; break
      default:
        if (part) segments.push({ text: part, bold, italic, underline })
    }
  }
  return segments
}

export function parseMarkup(input: string): Segment[] {
  const segments: Segment[] = []
  // Match <a ref="sectionId">link text</a> — sectionId and link text may not contain < or >
  const aTagRe = /<a\s+ref="([^"]+)">([^<]*)<\/a>/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = aTagRe.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...parseInline(input.slice(lastIndex, match.index)))
    }
    segments.push({ text: match[2], bold: false, italic: false, underline: false, sectionRef: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < input.length) {
    segments.push(...parseInline(input.slice(lastIndex)))
  }

  return segments
}

interface Props {
  text: string
  style?: object | (object | false | undefined)[]
}

export default function RichText({ text, style }: Props) {
  const { navigateTo } = useSectionNavigation()
  const segments = parseMarkup(text)
  const isPlain = segments.every(seg => !seg.bold && !seg.italic && !seg.underline && !seg.sectionRef)

  if (isPlain) {
    return <Text style={style}>{text}</Text>
  }

  return (
    <Text style={style}>
      {segments.map((seg, i) => (
        <Text
          key={i}
          onPress={seg.sectionRef ? () => navigateTo(seg.sectionRef!) : undefined}
          style={[
            seg.bold && s.bold,
            seg.italic && s.italic,
            seg.underline && s.underline,
            seg.sectionRef && s.link,
          ]}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  )
}

const s = StyleSheet.create({
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  link: { color: Colors.accent, textDecorationLine: 'underline' },
})
