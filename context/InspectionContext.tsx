import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import type { InspectionDocument, InspectionAction } from '../types/inspection'

interface ContextValue {
  doc: InspectionDocument
  dispatch: Dispatch<InspectionAction>
}

const InspectionContext = createContext<ContextValue | null>(null)

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function inspectionReducer(
  state: InspectionDocument,
  action: InspectionAction,
): InspectionDocument {
  const now = new Date().toISOString()

  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, updatedAt: now, fieldValues: { ...state.fieldValues, [action.key]: action.value } }

    case 'SET_LIST_ITEMS':
      return { ...state, updatedAt: now, listItems: { ...state.listItems, [action.key]: action.items } }

    case 'SET_DEVICE_RECORDS':
      return { ...state, updatedAt: now, deviceRecords: { ...state.deviceRecords, [action.key]: action.records } }

    case 'SET_LEGEND':
      return { ...state, updatedAt: now, legend: action.legend }

    case 'SET_APPLICABLE':
      return { ...state, updatedAt: now, applicableStates: { ...state.applicableStates, [action.pageKey]: action.value } }

    case 'ADD_GROUP':
      return {
        ...state,
        updatedAt: now,
        repeatableGroups: {
          ...state.repeatableGroups,
          [action.sectionId]: [...(state.repeatableGroups[action.sectionId] ?? []), action.groupKey],
        },
      }

    case 'REMOVE_GROUP': {
      // Remove groupKey from whichever section list it belongs to
      const updatedGroups: Record<string, string[]> = {}
      Object.entries(state.repeatableGroups).forEach(([sid, keys]) => {
        updatedGroups[sid] = keys.filter(k => k !== action.groupKey)
      })

      // Clean up all data keyed to this group
      const prefix = action.groupKey + '/'
      const fieldValues = Object.fromEntries(
        Object.entries(state.fieldValues).filter(([k]) => !k.startsWith(prefix)),
      )
      const listItems = Object.fromEntries(
        Object.entries(state.listItems).filter(([k]) => !k.startsWith(prefix)),
      )
      const deviceRecords = Object.fromEntries(
        Object.entries(state.deviceRecords).filter(([k]) => !k.startsWith(prefix)),
      )
      const applicableStates = Object.fromEntries(
        Object.entries(state.applicableStates).filter(([k]) => !action.pageKeys.includes(k)),
      )
      return { ...state, updatedAt: now, repeatableGroups: updatedGroups, fieldValues, listItems, deviceRecords, applicableStates }
    }

    case 'SET_FILENAME':
      return { ...state, filename: action.filename }

    case 'SET_FILE_PATH':
      return { ...state, filePath: action.filePath }

    default:
      return state
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ProviderProps {
  children: ReactNode
  initialDoc: InspectionDocument
}

export function InspectionProvider({ children, initialDoc }: ProviderProps) {
  const [doc, dispatch] = useReducer(inspectionReducer, initialDoc)
  return (
    <InspectionContext.Provider value={{ doc, dispatch }}>
      {children}
    </InspectionContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInspection(): ContextValue {
  const ctx = useContext(InspectionContext)
  if (!ctx) throw new Error('useInspection must be used within InspectionProvider')
  return ctx
}
