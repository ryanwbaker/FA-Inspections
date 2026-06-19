import { createContext, useContext } from 'react'

interface SectionNavigationContextValue {
  navigateTo: (sectionId: string) => void
}

const SectionNavigationContext = createContext<SectionNavigationContextValue>({
  navigateTo: () => {},
})

export const SectionNavigationProvider = SectionNavigationContext.Provider

export function useSectionNavigation(): SectionNavigationContextValue {
  return useContext(SectionNavigationContext)
}
