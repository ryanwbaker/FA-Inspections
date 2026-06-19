import * as FileSystem from 'expo-file-system/legacy'
import { PDFDocument } from 'pdf-lib'

/**
 * Merges two PDFs — portrait (with blank placeholder pages) and landscape —
 * by replacing each placeholder page at landscapePageIndices with the
 * corresponding landscape page.
 *
 * landscapePageIndices: 0-indexed positions in the FINAL merged document.
 * The portrait PDF must already have blank pages at those positions.
 */
export async function mergePdfsInterleaved(
  portraitPath: string,
  landscapePath: string,
  landscapePageIndices: number[],
  outputPath: string,
): Promise<void> {
  const [portraitB64, landscapeB64] = await Promise.all([
    FileSystem.readAsStringAsync(portraitPath, { encoding: FileSystem.EncodingType.Base64 }),
    FileSystem.readAsStringAsync(landscapePath, { encoding: FileSystem.EncodingType.Base64 }),
  ])

  const [portraitDoc, landscapeDoc] = await Promise.all([
    PDFDocument.load(portraitB64),
    PDFDocument.load(landscapeB64),
  ])

  // Replace placeholder pages in reverse index order so earlier indices stay valid
  const landscapePageCount = landscapeDoc.getPageCount()
  const indicesToProcess = [...landscapePageIndices].reverse()

  for (let i = indicesToProcess.length - 1; i >= 0; i--) {
    const pageIndex  = indicesToProcess[i]
    const srcIndex   = landscapePageCount - 1 - i  // reverse order matches reversed indices

    // Copy the landscape page into the portrait document
    const [copied] = await portraitDoc.copyPages(landscapeDoc, [srcIndex])
    // Swap: remove blank placeholder, insert landscape page at same position
    portraitDoc.removePage(pageIndex)
    portraitDoc.insertPage(pageIndex, copied)
  }

  const mergedB64 = await portraitDoc.saveAsBase64()
  await FileSystem.writeAsStringAsync(outputPath, mergedB64, {
    encoding: FileSystem.EncodingType.Base64,
  })
}
