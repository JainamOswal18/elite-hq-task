'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then(mod => mod.Document),
  { ssr: false }
)
const Page = dynamic(
  () => import('react-pdf').then(mod => mod.Page),
  { ssr: false }
)

// Configure PDF.js worker only on client side with version matching
let workerConfigured = false
if (typeof window !== 'undefined' && !workerConfigured) {
  import('react-pdf').then(({ pdfjs }) => {
    if (!workerConfigured) {
      // Use local worker file that matches the pdfjs-dist version
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      workerConfigured = true
      
      console.log('PDF.js worker configured with version:', pdfjs.version)
      console.log('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc)
    }
  }).catch((error) => {
    console.warn('PDF.js worker configuration failed:', error)
  })
}
import { ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PDFViewerState } from '@/types'

// PDF.js worker is configured above

interface PDFViewerProps {
  pdfData?: string | ArrayBuffer | Uint8Array | null
  className?: string
  onStateChange?: (state: PDFViewerState) => void
  showControls?: boolean
  initialScale?: number
  externalScale?: number
  externalPageNumber?: number
}

function PDFViewerClient({
  pdfData,
  className,
  onStateChange,
  showControls = true,
  initialScale = 1.0,
  externalScale,
  externalPageNumber
}: PDFViewerProps) {
  const [state, setState] = useState<PDFViewerState>({
    scale: initialScale,
    pageNumber: 1,
    totalPages: 0,
    isLoading: false,
    error: null
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Update parent component when state changes - use individual state properties to avoid loops
  const onStateChangeRef = useRef(onStateChange)
  
  useEffect(() => {
    onStateChangeRef.current = onStateChange
  }, [onStateChange])

  // Respond to external scale changes
  useEffect(() => {
    if (externalScale !== undefined && externalScale !== state.scale) {
      setState(prev => ({ ...prev, scale: externalScale }))
    }
  }, [externalScale, state.scale])

  // Respond to external page changes
  useEffect(() => {
    if (externalPageNumber !== undefined && externalPageNumber !== state.pageNumber) {
      setState(prev => ({ ...prev, pageNumber: externalPageNumber }))
    }
  }, [externalPageNumber, state.pageNumber])

  useEffect(() => {
    // Call onStateChange when any state property changes
    if (onStateChangeRef.current) {
      onStateChangeRef.current(state)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.scale, state.pageNumber, state.totalPages, state.isLoading, state.error])

  const updateState = useCallback((updates: Partial<PDFViewerState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    updateState({
      totalPages: numPages,
      isLoading: false,
      error: null
    })
  }, [updateState])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error)
    
    // Handle specific version mismatch errors
    let errorMessage = error.message
    if (error.message.includes('API version') && error.message.includes('Worker version')) {
      errorMessage = 'PDF worker version mismatch. Please refresh the page.'
    }
    
    updateState({
      isLoading: false,
      error: errorMessage
    })
  }, [updateState])

  const onLoadStart = useCallback(() => {
    updateState({ isLoading: true, error: null })
  }, [updateState])

  // Memoize the file object to prevent ArrayBuffer detachment and unnecessary reloads
  const fileObject = useMemo(() => {
    if (!pdfData) return null
    
    // Convert ArrayBuffer/Uint8Array to Blob to prevent detachment issues
    if (pdfData instanceof ArrayBuffer || pdfData instanceof Uint8Array) {
      const blob = new Blob([pdfData as BlobPart], { type: 'application/pdf' })
      return blob
    }
    
    // For string URLs, return as-is
    if (typeof pdfData === 'string') {
      return pdfData
    }
    
    return null
  }, [pdfData])

  const handleZoomIn = useCallback(() => {
    updateState({ scale: Math.min(state.scale + 0.25, 3.0) })
  }, [state.scale, updateState])

  const handleZoomOut = useCallback(() => {
    updateState({ scale: Math.max(state.scale - 0.25, 0.5) })
  }, [state.scale, updateState])

  const handleResetZoom = useCallback(() => {
    updateState({ scale: 1.0 })
  }, [updateState])

  const handlePrevPage = useCallback(() => {
    updateState({ pageNumber: Math.max(state.pageNumber - 1, 1) })
  }, [state.pageNumber, updateState])

  const handleNextPage = useCallback(() => {
    updateState({ pageNumber: Math.min(state.pageNumber + 1, state.totalPages) })
  }, [state.pageNumber, state.totalPages, updateState])

  const handleDownload = useCallback(() => {
    if (!pdfData) return

    const blob = new Blob([pdfData as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume-${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [pdfData])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const newFullscreen = !prev
      
      // Lock/unlock body scroll
      if (newFullscreen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      
      return newFullscreen
    })
  }, [])

  // Cleanup body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Handle scroll to show/hide controls
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    
    const currentScrollY = scrollContainerRef.current.scrollTop
    
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down - hide controls
      setControlsVisible(false)
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up - show controls
      setControlsVisible(true)
    }
    
    setLastScrollY(currentScrollY)
  }, [lastScrollY])

  // Add scroll listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen()
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen, toggleFullscreen])

  // Render loading state
  if (state.isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-neutral-50', className)}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="text-neutral-600">Compiling PDF...</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (state.error) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-neutral-50', className)}>
        <div className="text-center space-y-2 p-6">
          <div className="text-red-500 text-lg font-semibold">PDF Error</div>
          <p className="text-neutral-600 max-w-md">{state.error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateState({ error: null })}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Render empty state
  if (!pdfData) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-neutral-50', className)}>
        <div className="text-center space-y-2 p-6">
          <div className="text-neutral-400 text-lg">No PDF to display</div>
          <p className="text-neutral-500">Start editing to see your resume preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col h-full bg-neutral-50 relative',
      isFullscreen && 'fixed inset-0 z-50 bg-white shadow-2xl',
      className
    )}>
      {/* Controls */}
      {showControls && (
        <div className={cn(
          "flex items-center justify-between p-4 border-b bg-white/95 backdrop-blur-sm transition-all duration-500 ease-in-out z-20 shadow-lg",
          isFullscreen && "absolute top-0 left-0 right-0",
          !controlsVisible && "-translate-y-full opacity-0",
          controlsVisible && "translate-y-0 opacity-100"
        )}>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={state.scale <= 0.5}
              className="h-9 px-3 hover:bg-neutral-100 disabled:opacity-50 transition-all duration-200"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="h-9 px-4 hover:bg-neutral-100 font-mono text-xs min-w-[60px] transition-all duration-200"
            >
              {Math.round(state.scale * 100)}%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={state.scale >= 3.0}
              className="h-9 px-3 hover:bg-neutral-100 disabled:opacity-50 transition-all duration-200"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-1">
            {state.totalPages > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={state.pageNumber <= 1}
                  className="h-9 px-3 hover:bg-neutral-100 disabled:opacity-50 transition-all duration-200"
                >
                  <span className="text-xs font-medium">Prev</span>
                </Button>
                <div className="px-3 py-1 bg-neutral-100 rounded-md">
                  <span className="text-xs font-mono text-neutral-700">
                    {state.pageNumber} / {state.totalPages}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={state.pageNumber >= state.totalPages}
                  className="h-9 px-3 hover:bg-neutral-100 disabled:opacity-50 transition-all duration-200"
                >
                  <span className="text-xs font-medium">Next</span>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-9 px-3 hover:bg-neutral-100 transition-all duration-200 group"
            >
              <Download className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className={cn(
                "h-9 px-3 transition-all duration-200 group",
                isFullscreen 
                  ? "bg-blue-100 text-blue-600 hover:bg-blue-200" 
                  : "hover:bg-neutral-100"
              )}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <Maximize2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* PDF Document */}
      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-auto p-6 bg-gradient-to-br from-neutral-50 to-neutral-100",
          isFullscreen && "pt-24 bg-neutral-900" // Add top padding when fullscreen to account for controls
        )}
      >
        <div className="flex justify-center min-h-full">
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            isFullscreen && "scale-105"
          )}>
          {fileObject && (
            <Document
              file={fileObject}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              onLoadStart={onLoadStart}
              className="shadow-2xl rounded-lg overflow-hidden"
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="animate-pulse bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-lg shadow-lg h-full w-full max-w-[595px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              }
            >
            <Page
              pageNumber={state.pageNumber}
              scale={state.scale}
              className="react-pdf__Page shadow-lg rounded-lg overflow-hidden"
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="animate-pulse bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-lg shadow-lg h-full w-full max-w-[595px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              }
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          )}
          
          {!fileObject && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-neutral-500 p-8 bg-white rounded-xl shadow-lg border-2 border-dashed border-neutral-200">
                <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-neutral-700 mb-2">No PDF to display</div>
                <div className="text-sm text-neutral-500">Compile your LaTeX code to see the PDF preview</div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Fullscreen overlay close */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleFullscreen}
        />
      )}
    </div>
  )
}

// Export with dynamic loading to prevent SSR issues
export const PDFViewer = dynamic(
  () => Promise.resolve(PDFViewerClient),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse bg-neutral-200 rounded h-full w-full max-w-[595px]"></div>
      </div>
    )
  }
)
