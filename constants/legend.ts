export interface DeviceLegendEntry {
  id: string
  code: string
  description: string
  isStandard: boolean
  hasSensitivityTest?: boolean   // S and DS get extra sensitivity test fields
  // Optional documentation columns (technician fills in for this specific system)
  type?: string
  modelNo?: string
  manufacturer?: string
  sensitivityRange?: string
  sensitivityTestMethod?: string
}

// Exact codes from CAN/ULC-S536:2019 Table, sorted A-Z. "–" wildcards at end.
export const STANDARD_LEGEND: DeviceLegendEntry[] = [
  { id: 'AD',   code: 'AD',   description: 'Ancillary Device',                          isStandard: true },
  { id: 'B',    code: 'B',    description: 'Bell',                                       isStandard: true },
  { id: 'DS',   code: 'DS',   description: 'Duct Smoke Detector',                        isStandard: true, hasSensitivityTest: true },
  { id: 'EM',   code: 'EM',   description: 'Fault Isolator',                             isStandard: true },
  { id: 'EOL',  code: 'EOL',  description: 'End-of-Line Device',                         isStandard: true },
  { id: 'ET',   code: 'ET',   description: 'Emergency Telephone',                        isStandard: true },
  { id: 'FS',   code: 'FS',   description: 'Sprinkler Flow Switch',                      isStandard: true },
  { id: 'H',    code: 'H',    description: 'Horn',                                       isStandard: true },
  { id: 'HSP',  code: 'HSP',  description: 'Horn Type Speaker',                          isStandard: true },
  { id: 'HT',   code: 'HT',   description: 'Heat Detector, Non-restorable',              isStandard: true },
  { id: 'M',    code: 'M',    description: 'Manual Station',                             isStandard: true },
  { id: 'RHT',  code: 'RHT',  description: 'Heat Detector, Restorable',                 isStandard: true },
  { id: 'RI',   code: 'RI',   description: 'Remote Indicator Unit',                      isStandard: true },
  { id: 'S',    code: 'S',    description: 'Smoke Detector',                             isStandard: true, hasSensitivityTest: true },
  { id: 'SB',   code: 'SB',   description: 'Sounder Base',                               isStandard: true },
  { id: 'SFD',  code: 'SFD',  description: 'Supporting Field Device (Monitor)',           isStandard: true },
  { id: 'SP',   code: 'SP',   description: 'Cone Type Speaker',                          isStandard: true },
  { id: 'SS',   code: 'SS',   description: 'Sprinkler Supervisory Device',               isStandard: true },
  { id: 'SSAD', code: 'SSAD', description: 'Suite Silencing Audible Device',             isStandard: true },
  { id: 'SSS',  code: 'SSS',  description: 'Suite Silencing Switch',                     isStandard: true },
  { id: 'V',    code: 'V',    description: 'Visible Signal Device',                      isStandard: true },
  { id: 'other-detector',    code: '–', description: 'Other Type of Detector',           isStandard: true },
  { id: 'other-supervisory', code: '–', description: 'Other Supervisory Devices (Low Pressure, Low Water, Low Temperature, Power Loss, etc.)', isStandard: true },
]

export function sortLegend(entries: DeviceLegendEntry[]): DeviceLegendEntry[] {
  return [...entries].sort((a, b) => {
    const aIsDash = a.code === '–'
    const bIsDash = b.code === '–'
    if (aIsDash && !bIsDash) return 1
    if (!aIsDash && bIsDash) return -1
    const byCode = a.code.localeCompare(b.code)
    if (byCode !== 0) return byCode
    // Same code: standard entries sort before custom so they're easier to distinguish
    if (a.isStandard && !b.isStandard) return -1
    if (!a.isStandard && b.isStandard) return 1
    return 0
  })
}
