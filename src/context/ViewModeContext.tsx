"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

type ViewMode = 'grid' | 'list'

interface ViewModeContextProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const ViewModeContext = createContext<ViewModeContextProps | undefined>(undefined)

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useViewMode must be used within a ViewModeProvider')
  return ctx
}
