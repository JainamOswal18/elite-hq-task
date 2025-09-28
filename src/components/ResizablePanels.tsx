'use client'

import { ReactNode } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { cn } from '@/lib/utils'

interface ResizablePanelsProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  className?: string
  defaultLeftSize?: number
  minLeftSize?: number
  minRightSize?: number
  direction?: 'horizontal' | 'vertical'
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  className,
  defaultLeftSize = 50,
  minLeftSize = 20,
  minRightSize = 20,
  direction = 'horizontal'
}: ResizablePanelsProps) {
  return (
    <div className={cn('h-full w-full', className)}>
      <PanelGroup direction={direction}>
        <Panel
          defaultSize={defaultLeftSize}
          minSize={minLeftSize}
          className="flex flex-col"
        >
          {leftPanel}
        </Panel>
        
        <PanelResizeHandle className={cn(
          'bg-border hover:bg-primary/20 active:bg-primary/30 transition-colors',
          direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'
        )} />
        
        <Panel
          minSize={minRightSize}
          className="flex flex-col"
        >
          {rightPanel}
        </Panel>
      </PanelGroup>
    </div>
  )
}

// Mobile-friendly stacked layout for smaller screens
export function StackedPanels({
  leftPanel,
  rightPanel,
  className
}: {
  leftPanel: ReactNode
  rightPanel: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col h-full w-full', className)}>
      <div className="flex-1 min-h-0">
        {leftPanel}
      </div>
      <div className="flex-1 min-h-0 border-t">
        {rightPanel}
      </div>
    </div>
  )
}
