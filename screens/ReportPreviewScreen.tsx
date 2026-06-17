import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Sharing from 'expo-sharing'
// WebView imported via require so the file compiles before react-native-webview is installed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WebView } = require('react-native-webview') as {
  WebView: React.ComponentType<{ source: { html: string }; style?: object; originWhitelist?: string[] }>
}
import { Colors, FontSize, FontWeight, Spacing } from '../tokens'
import type { ReportPreviewScreenProps } from '../navigation/types'
import { exportInspectionPdf } from '../services/pdfReport'

export default function ReportPreviewScreen({ route, navigation }: ReportPreviewScreenProps) {
  const { html, filename } = route.params
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const pdfPath = await exportInspectionPdf(html, filename)
      await Sharing.shareAsync(pdfPath, {
        mimeType: 'application/pdf',
        dialogTitle: filename,
        UTI: 'com.adobe.pdf',
      })
    } catch {
      // share sheet dismissed or error — not critical
    } finally {
      setExporting(false)
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={s.title} numberOfLines={1}>Report Preview</Text>

        <TouchableOpacity
          style={[s.exportBtn, exporting && s.exportBtnDisabled]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.exportText}>Export PDF</Text>
          }
        </TouchableOpacity>
      </View>

      <WebView
        source={{ html }}
        style={s.webview}
        originWhitelist={['*']}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: FontSize.md, color: Colors.accent },
  title: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    textAlign: 'center',
  },
  exportBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 7,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    minWidth: 90,
    alignItems: 'center',
  },
  exportBtnDisabled: { opacity: 0.6 },
  exportText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#fff' },
  webview: { flex: 1 },
})
