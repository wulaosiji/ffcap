"use client"

import { Button } from '@/components/ui/button'
import { Grid, List } from 'lucide-react'
import { useLang } from '@/context/LangContext'

interface ViewToggleProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  className?: string
}

export function ViewToggle({ viewMode, onViewModeChange, className = '' }: ViewToggleProps) {
  const { lang } = useLang()

  const toggleViewMode = () => {
    onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${className}`}
      onClick={toggleViewMode}
      aria-label={lang === 'zh' ? '切换视图模式' : 'Toggle view mode'}
    >
      {viewMode === 'grid' ? (
        <Grid className="h-4 w-4" />
      ) : (
        <List className="h-4 w-4" />
      )}
    </Button>
  )
}
