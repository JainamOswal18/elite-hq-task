'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Download, Code, Eye, Bot, Send, User, Loader2, Play, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Keyboard, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PDFViewer } from './PDFViewer'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface AIResponse {
  aiResponse: string
  latexCode?: string
  suggestions?: string[]
  extractedInfo?: Record<string, unknown>
}

export interface ResumeEditorProps {
  onSave?: (content: string) => void
  onExport?: (pdfData: ArrayBuffer | Uint8Array) => void
}

type ViewMode = 'code' | 'preview'

interface PDFState {
  scale?: number
  pageNumber?: number
  totalPages?: number
}

export function ResumeEditor({
  onSave,
  onExport
}: ResumeEditorProps) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "👋 Welcome to Resume Pilot! I'm your AI assistant powered by Gemini 2.5 Pro.\n\nI can help you create a professional LaTeX resume by:\n• Understanding your background and experience\n• Generating LaTeX code dynamically\n• Remembering our conversation context\n• Only including information you actually provide\n\nJust tell me about yourself naturally - like \"I'm Sarah, a data scientist with 3 years experience in Python and machine learning\"\n\nWhat would you like to start with?",
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  
  // Editor state - Using article class for better online service compatibility
  const [latexContent, setLatexContent] = useState(`\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage[hidelinks]{hyperref}

% Custom formatting
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{6pt}

\\begin{document}

% Header
\\begin{center}
{\\LARGE\\textbf{Sample Resume}}\\\\[4pt]
{\\large Professional Template}\\\\[8pt]
Email: sample@email.com $\\mid$ Phone: +1 (555) 123-4567
\\end{center}

\\section{Professional Summary}
This is a sample resume template created with standard LaTeX. Chat with the AI to customize it with your information and generate a professional resume.

\\section{Education}
\\textbf{Bachelor of Science} \\hfill 2020--2024\\\\
University Name, City, State\\\\
GPA: 3.8
\\begin{itemize}[leftmargin=20pt, topsep=0pt]
\\item Relevant coursework and achievements
\\item Academic honors and distinctions
\\end{itemize}

\\section{Technical Skills}
\\textbf{Programming:} JavaScript, Python, React, Node.js\\\\
\\textbf{Databases:} MySQL, PostgreSQL, MongoDB\\\\
\\textbf{Tools:} Git, Docker, AWS, Linux

\\section{Experience}
\\textbf{Software Engineer} \\hfill 2023--Present\\\\
Tech Company, City, State
\\begin{itemize}[leftmargin=20pt, topsep=0pt]
\\item Developed and maintained web applications using modern frameworks
\\item Collaborated with cross-functional teams to deliver high-quality software
\\item Implemented best practices for code quality and testing
\\end{itemize}

\\end{document}`)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [pdfData, setPdfData] = useState<ArrayBuffer | Uint8Array | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(384) // Default width
  const [isHydrated, setIsHydrated] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [pdfScale, setPdfScale] = useState(1.0)
  const [pdfPageNumber, setPdfPageNumber] = useState(1)
  const [pdfTotalPages, setPdfTotalPages] = useState(0)
  const [showShortcuts, setShowShortcuts] = useState(false)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const debouncedCompileRef = useRef<((content: string) => void) | null>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load saved panel width after hydration to avoid SSR mismatch
  useEffect(() => {
    setIsHydrated(true)
    const saved = localStorage.getItem('resume-pilot-panel-width')
    if (saved) {
      const width = parseInt(saved, 10)
      if (width >= 280 && width <= 600) {
        setLeftPanelWidth(width)
      }
    }
  }, [])

  // Debounce helper
  const createDebounce = useCallback(<T extends unknown[]>(
    func: (...args: T) => void,
    delay: number
  ) => {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: T) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }, [])

  // Initialize debounced compile function
  useEffect(() => {
    if (!debouncedCompileRef.current) {
      const compileFunction = async (content: string) => {
        if (!content.trim()) return
        
        setIsCompiling(true)
        try {
          console.log('Starting compilation with template: modern')
          const response = await fetch('/api/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: content,
              template: 'modern'
            })
          })

          console.log('Compile response status:', response.status)
          if (response.ok) {
            const result = await response.json()
            console.log('Compile result:', result.success ? 'Success' : 'Failed')
            if (result.pdfBuffer) {
              const pdfData = new Uint8Array(result.pdfBuffer)
              setPdfData(pdfData)
              console.log('PDF data set, size:', pdfData.length)
            }
          } else {
            console.error('Compile response not ok:', response.status, response.statusText)
          }
        } catch (error) {
          console.error('Compilation error:', error)
        } finally {
          setIsCompiling(false)
        }
      }

      debouncedCompileRef.current = createDebounce(compileFunction, 1500)
    }
  }, [createDebounce])

  // Compile LaTeX when content changes
  useEffect(() => {
    if (latexContent && latexContent.trim()) {
      debouncedCompileRef.current?.(latexContent)
    }
  }, [latexContent])

  // Initial compilation when component mounts
  useEffect(() => {
    if (debouncedCompileRef.current && latexContent) {
      // Small delay to ensure debounced function is ready
      setTimeout(() => {
        debouncedCompileRef.current?.(latexContent)
      }, 100)
    }
  }, [debouncedCompileRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

  // Send message to AI
  const handleSendMessage = async () => {
    if (!inputText.trim() || isAIProcessing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsAIProcessing(true)

    try {
      // Call real AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory: messages,
          currentLatexContent: latexContent,
          resumeData: null
        })
      })

      if (!response.ok) {
        throw new Error('AI request failed')
      }

      const aiData: AIResponse = await response.json()
      console.log('🤖 AI Response received:', aiData)

      // Add AI response to chat  
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiData.aiResponse || 'I received your message and am working on your resume.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

      // Update LaTeX content if provided
      if (aiData.latexCode) {
        console.log('📝 Updating LaTeX content:', aiData.latexCode.substring(0, 200) + '...')
        setLatexContent(aiData.latexCode)
      }

    } catch (error) {
      console.error('AI Error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm having trouble processing your request. Please try again or be more specific about what you'd like to add to your resume.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAIProcessing(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle content change in editor
  const handleContentChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setLatexContent(value)
    }
  }, [])

  // Handle manual compile
  const handleManualCompile = useCallback(async () => {
    if (!latexContent.trim()) return
    
    setIsCompiling(true)
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: latexContent,
          template: 'modern'
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.pdfBuffer) {
          const pdfData = new Uint8Array(result.pdfBuffer)
          setPdfData(pdfData)
        }
      }
    } catch (error) {
      console.error('Manual compilation error:', error)
    } finally {
      setIsCompiling(false)
    }
  }, [latexContent])

  // Handle export
  const handleExport = useCallback(() => {
    if (pdfData && onExport) {
      onExport(pdfData)
    }
  }, [pdfData, onExport])

  // PDF control functions
  const handleZoomIn = useCallback(() => {
    setPdfScale(prev => Math.min(3.0, prev + 0.25))
  }, [])

  const handleZoomOut = useCallback(() => {
    setPdfScale(prev => Math.max(0.5, prev - 0.25))
  }, [])

  const handleResetZoom = useCallback(() => {
    setPdfScale(1.0)
  }, [])

  const handlePrevPage = useCallback(() => {
    setPdfPageNumber(prev => Math.max(1, prev - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setPdfPageNumber(prev => Math.min(pdfTotalPages, prev + 1))
  }, [pdfTotalPages])

  // PDF state change handler
  const handlePdfStateChange = useCallback((state: PDFState) => {
    setPdfScale(state.scale || 1.0)
    setPdfPageNumber(state.pageNumber || 1)
    setPdfTotalPages(state.totalPages || 0)
  }, [])

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault()
          setShowShortcuts(true)
        } else if (e.key === 's') {
          e.preventDefault()
          if (onSave) {
            onSave(latexContent)
            // Show save feedback
            console.log('💾 Resume saved!')
          }
        } else if (e.key === 'e') {
          e.preventDefault()
          handleExport()
        } else if (e.key === '[') {
          e.preventDefault()
          // Decrease panel width
          const newWidth = Math.max(280, leftPanelWidth - 20)
          setLeftPanelWidth(newWidth)
          localStorage.setItem('resume-pilot-panel-width', newWidth.toString())
        } else if (e.key === ']') {
          e.preventDefault()
          // Increase panel width
          const newWidth = Math.min(600, leftPanelWidth + 20)
          setLeftPanelWidth(newWidth)
          localStorage.setItem('resume-pilot-panel-width', newWidth.toString())
        } else if (e.key === '\\') {
          e.preventDefault()
          // Reset to default width
          setLeftPanelWidth(384)
          localStorage.setItem('resume-pilot-panel-width', '384')
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          // Zoom in PDF
          if (viewMode === 'preview') {
            setPdfScale(prev => Math.min(3.0, prev + 0.25))
          }
        } else if (e.key === '-') {
          e.preventDefault()
          // Zoom out PDF
          if (viewMode === 'preview') {
            setPdfScale(prev => Math.max(0.5, prev - 0.25))
          }
        } else if (e.key === '0') {
          e.preventDefault()
          // Reset PDF zoom
          if (viewMode === 'preview') {
            setPdfScale(1.0)
          }
        }
      } else if (e.key === 'Escape') {
        // Close shortcuts modal
        if (showShortcuts) {
          setShowShortcuts(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [latexContent, onSave, leftPanelWidth, viewMode, showShortcuts, handleExport])

  // Handle resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    let currentWidth = leftPanelWidth
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(280, Math.min(600, e.clientX))
      currentWidth = newWidth
      setLeftPanelWidth(newWidth)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      // Save the final width to localStorage
      localStorage.setItem('resume-pilot-panel-width', currentWidth.toString())
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [leftPanelWidth])

  // Prevent text selection during resize
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    
    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing])

  return (
    <div className="flex h-full bg-white relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
      {/* Resize overlay */}
      {isResizing && (
        <div className="fixed inset-0 z-50 bg-black/5 backdrop-blur-[1px]">
          {/* Width indicator */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-mono">
            {leftPanelWidth}px
          </div>
        </div>
      )}
      {/* Left Panel - AI Chat */}
      <div 
        className={cn(
          "bg-white border-r border-neutral-200 flex flex-col h-full shadow-lg overflow-hidden",
          isResizing ? "transition-none" : "transition-all duration-150 ease-out"
        )} 
        style={{ 
          width: isHydrated ? `${leftPanelWidth}px` : '384px',
          minWidth: '280px',
          maxWidth: '600px'
        }}
        suppressHydrationWarning
      >
        {/* Chat Header */}
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">AI Resume Assistant</h3>
              <p className="text-sm text-neutral-600 font-medium">Powered by Gemini 2.5 Pro</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-neutral-50/30 to-white min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-4 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300',
                message.type === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md',
                message.type === 'user' 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                  : 'bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200'
              )}>
                {message.type === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-neutral-600" />
                )}
              </div>
              <div className={cn(
                'rounded-2xl p-4 shadow-sm border',
                message.type === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-200'
                  : 'bg-white text-neutral-900 border-neutral-200'
              )}>
                <div className={cn(
                  'text-sm leading-relaxed whitespace-pre-line',
                  message.type === 'user' ? 'text-white' : 'text-neutral-800'
                )}>
                  {message.content}
                </div>
                <div className={cn(
                  'text-xs mt-2',
                  message.type === 'user' ? 'text-blue-100' : 'text-neutral-500'
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isAIProcessing && (
            <div className="flex gap-3 max-w-[90%] mr-auto">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200 flex items-center justify-center shadow-sm">
                <Bot className="h-4 w-4 text-neutral-600" />
              </div>
              <div className="bg-white text-neutral-900 rounded-xl p-3 border border-neutral-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-neutral-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-neutral-200 bg-white shadow-lg">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Tell me about your experience, skills, education..."
                className="w-full resize-none border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-white placeholder:text-neutral-400"
                rows={2}
                disabled={isAIProcessing}
                maxLength={1000}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={isAIProcessing || !inputText.trim()}
              className={cn(
                "px-4 py-3 rounded-xl transition-all shadow-md",
                isAIProcessing || !inputText.trim() 
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-200"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-neutral-500">
              Enter to send, Shift+Enter for new line
            </p>
            <div className="text-xs text-neutral-400">
              {inputText.length}/1000
            </div>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className={cn(
          "w-2 bg-neutral-100 hover:bg-blue-100 cursor-col-resize transition-all duration-200 relative group flex items-center justify-center border-r border-neutral-200",
          isResizing && "bg-blue-200 shadow-lg"
        )}
        onMouseDown={handleMouseDown}
        title="Drag to resize panels"
      >
        {/* Drag handle visual */}
        <div className={cn(
          "w-1 h-12 bg-neutral-300 rounded-full group-hover:bg-blue-400 transition-all duration-200",
          isResizing && "bg-blue-500 scale-110"
        )}>
          {/* Grip dots */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col space-y-0.5">
              <div className="w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Code/Preview */}
      <div className="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
        {/* Right Panel Header */}
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'code' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('code')}
                className={cn(
                  "h-8 px-3 transition-all duration-200",
                  viewMode === 'code' 
                    ? "bg-white shadow-sm text-neutral-900" 
                    : "hover:bg-white/50 text-neutral-600"
                )}
              >
                <Code className="h-4 w-4 mr-2" />
                LaTeX Code
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className={cn(
                  "h-8 px-3 transition-all duration-200",
                  viewMode === 'preview' 
                    ? "bg-white shadow-sm text-neutral-900" 
                    : "hover:bg-white/50 text-neutral-600"
                )}
              >
                <Eye className="h-4 w-4 mr-2" />
                PDF Preview
              </Button>
            </div>
            
            {/* PDF Controls - only show in preview mode */}
            {viewMode === 'preview' && pdfData && (
              <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={pdfScale <= 0.5}
                  className="h-8 px-2 hover:bg-white/50 disabled:opacity-50 transition-all duration-200"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                  className="h-8 px-3 hover:bg-white/50 font-mono text-xs min-w-[60px] transition-all duration-200"
                >
                  {Math.round(pdfScale * 100)}%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={pdfScale >= 3.0}
                  className="h-8 px-2 hover:bg-white/50 disabled:opacity-50 transition-all duration-200"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                
                {pdfTotalPages > 1 && (
                  <>
                    <div className="w-px h-6 bg-neutral-300 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={pdfPageNumber <= 1}
                      className="h-8 px-2 hover:bg-white/50 disabled:opacity-50 transition-all duration-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="px-2 py-1 bg-white rounded text-xs font-mono text-neutral-700 min-w-[50px] text-center">
                      {pdfPageNumber}/{pdfTotalPages}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={pdfPageNumber >= pdfTotalPages}
                      className="h-8 px-2 hover:bg-white/50 disabled:opacity-50 transition-all duration-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {isCompiling && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Compiling...
                </div>
              )}
              <Button
                onClick={() => setShowShortcuts(true)}
                size="sm"
                variant="ghost"
                className="h-8 px-3 hover:bg-neutral-100 transition-all duration-200"
                title="Keyboard Shortcuts (Ctrl+K)"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleManualCompile}
                disabled={isCompiling}
                size="sm"
                variant="outline"
                className="h-8 px-3 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
              >
                <Play className="h-4 w-4 mr-2" />
                Compile
              </Button>
              <Button
                onClick={handleExport}
                disabled={!pdfData}
                size="sm"
                className="h-8 px-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === 'code' ? (
            <Editor
              height="100%"
              defaultLanguage="tex"
              value={latexContent}
              onChange={handleContentChange}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                folding: true,
                bracketPairColorization: { enabled: true }
              }}
            />
          ) : (
            <div className="h-full bg-neutral-50 overflow-auto">
              {pdfData ? (
                <PDFViewer 
                  pdfData={pdfData} 
                  showControls={false}
                  initialScale={pdfScale}
                  externalScale={pdfScale}
                  externalPageNumber={pdfPageNumber}
                  onStateChange={handlePdfStateChange}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-neutral-500">
                    <div className="text-lg font-medium mb-2">
                      {isCompiling ? 'Compiling LaTeX...' : 'No PDF Preview'}
                    </div>
                    <div className="text-sm">
                      {isCompiling 
                        ? 'Please wait while we generate your PDF' 
                        : 'Click the Compile button to generate PDF preview'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto border border-neutral-200/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow">
                  <Keyboard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Keyboard Shortcuts</h2>
                  <p className="text-sm text-neutral-600">Speed up your workflow with these shortcuts</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(false)}
                className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* General */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  General
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-700">Show this shortcuts panel</span>
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl + K</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-700">Save resume</span>
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl + S</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-700">Export PDF</span>
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl + E</kbd>
                  </div>
                </div>
              </div>

              {/* Panel Resize */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Panel Resize
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-700">Decrease panel width</span>
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl + [</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-700">Increase panel width</span>
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl + ]</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-700">Reset panel width</span>
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl + \</kbd>
                  </div>
                </div>
              </div>

              {/* PDF Controls */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  PDF Controls
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Preview Mode Only</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-700">Zoom in</span>
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl + =</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-700">Zoom out</span>
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl + -</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-700">Reset zoom to 100%</span>
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">Ctrl + 0</kbd>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Drag the resize handle between panels to adjust layout</li>
                  <li>• Use the AI chat to generate LaTeX content naturally</li>
                  <li>• Switch between Code and Preview modes to see changes</li>
                  <li>• All shortcuts work with Cmd key on Mac</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
