import { Text, StyleSheet } from 'react-native'

// Supported inline tags: <strong>/<b>, <em>/<i>, <u>. Newlines via literal \n.
type Segment = { text: string; bold: boolean; italic: boolean; underline: boolean }

export function parseMarkup(input: string): Segment[] {
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

interface Props {
  text: string
  style?: object | (object | false | undefined)[]
}

export default function RichText({ text, style }: Props) {
  const segments = parseMarkup(text)
  const isPlain = segments.every(s => !s.bold && !s.italic && !s.underline)

  if (isPlain) {
    return <Text style={style}>{text}</Text>
  }

  return (
    <Text style={style}>
      {segments.map((seg, i) => (
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
      ))}
    </Text>
  )
}

const s = StyleSheet.create({
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
})
