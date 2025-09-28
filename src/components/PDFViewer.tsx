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
}

function PDFViewerClient({
  pdfData,
  className,
  onStateChange,
  showControls = true,
  initialScale = 1.0
}: PDFViewerProps) {
  const [state, setState] = useState<PDFViewerState>({
    scale: initialScale,
    pageNumber: 1,
    totalPages: 0,
    isLoading: false,
    error: null
  })
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Update parent component when state changes - use individual state properties to avoid loops
  const onStateChangeRef = useRef(onStateChange)
  
  useEffect(() => {
    onStateChangeRef.current = onStateChange
  }, [onStateChange])

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
      const blob = new Blob([pdfData], { type: 'application/pdf' })
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

    const blob = new Blob([pdfData], { type: 'application/pdf' })
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
    setIsFullscreen(prev => !prev)
  }, [])

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
      'flex flex-col h-full bg-neutral-50',
      isFullscreen && 'fixed inset-0 z-50 bg-white',
      className
    )}>
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between p-3 border-b bg-white">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={state.scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
            >
              {Math.round(state.scale * 100)}%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={state.scale >= 3.0}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {state.totalPages > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={state.pageNumber <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-neutral-600">
                  {state.pageNumber} of {state.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={state.pageNumber >= state.totalPages}
                >
                  Next
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* PDF Document */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          {fileObject && (
            <Document
              file={fileObject}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              onLoadStart={onLoadStart}
              className="shadow-lg"
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="animate-pulse bg-neutral-200 rounded h-full w-full max-w-[595px]"></div>
                </div>
              }
            >
            <Page
              pageNumber={state.pageNumber}
              scale={state.scale}
              className="react-pdf__Page"
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="animate-pulse bg-neutral-200 rounded h-full w-full max-w-[595px]"></div>
                </div>
              }
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          )}
          
          {!fileObject && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-neutral-500">
                <div className="text-lg font-medium mb-2">No PDF to display</div>
                <div className="text-sm">Compile your LaTeX code to see the PDF preview</div>
              </div>
            </div>
          )}
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
