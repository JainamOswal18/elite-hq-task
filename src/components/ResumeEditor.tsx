'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Download, Code, Eye, Bot, Send, User, Loader2, Play } from 'lucide-react'
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

export function ResumeEditor({
  onSave,
  onExport
}: ResumeEditorProps) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "👋 Welcome to Resume Pilot! I'm your AI assistant powered by Gemini 2.5 Flash.\n\n**I can help you create a professional LaTeX resume by:**\n• Understanding your background and experience\n• Generating LaTeX code dynamically\n• Remembering our conversation context\n• Only including information you actually provide\n\n**Just tell me about yourself naturally** - like \"I'm Sarah, a data scientist with 3 years experience in Python and machine learning\"\n\nWhat would you like to start with?",
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
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const debouncedCompileRef = useRef<((content: string) => void) | null>(null)

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  return (
    <div className="flex h-full bg-white">
      {/* Left Panel - AI Chat */}
      <div className="w-96 bg-white border-r border-neutral-200 flex flex-col h-full">
        {/* Chat Header */}
        <div className="p-4 border-b border-neutral-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">AI Resume Assistant</h3>
              <p className="text-xs text-neutral-600">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 max-w-[90%]',
                message.type === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
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
                'rounded-xl p-3 shadow-sm',
                message.type === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                  : 'bg-white text-neutral-900 border border-neutral-200'
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
        <div className="p-4 border-t border-neutral-100 bg-white">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Tell me about your experience, skills, education..."
                className="w-full resize-none border border-neutral-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                rows={2}
                disabled={isAIProcessing}
                maxLength={1000}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={isAIProcessing || !inputText.trim()}
              className={cn(
                "px-3 py-2 rounded-lg transition-all",
                isAIProcessing || !inputText.trim() 
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
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

      {/* Right Panel - Code/Preview */}
      <div className="flex-1 flex flex-col">
        {/* Right Panel Header */}
        <div className="p-4 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'code' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('code')}
              >
                <Code className="h-4 w-4 mr-1" />
                LaTeX Code
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
              >
                <Eye className="h-4 w-4 mr-1" />
                PDF Preview
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {isCompiling && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Compiling...
                </div>
              )}
              <Button
                onClick={handleManualCompile}
                disabled={isCompiling}
                size="sm"
                variant="outline"
              >
                <Play className="h-4 w-4 mr-1" />
                Compile
              </Button>
              <Button
                onClick={handleExport}
                disabled={!pdfData}
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative">
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
            <div className="h-full bg-neutral-50">
              {pdfData ? (
                <PDFViewer pdfData={pdfData} />
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
    </div>
  )
}
