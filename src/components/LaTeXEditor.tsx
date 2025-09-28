'use client'

import { useEffect, useRef, useState } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import { cn } from '@/lib/utils'
import { EditorState } from '@/types'

// Monaco Editor types
type MonacoPosition = {
  lineNumber: number
  column: number
}

type MonacoCursorEvent = {
  position: MonacoPosition
}

type MonacoSelection = {
  getStartPosition: () => MonacoPosition
  getEndPosition: () => MonacoPosition
  isEmpty: () => boolean
}

type MonacoModel = {
  getValue: () => string
  getOffsetAt: (position: MonacoPosition) => number
  isAttachedToEditor: () => boolean
  getValueInRange: (selection: MonacoSelection) => string
}

type MonacoEditor = {
  onDidChangeCursorPosition: (callback: (e: MonacoCursorEvent) => void) => void
  addCommand: (keybinding: number, handler: () => void) => void
  getModel: () => MonacoModel
  getSelection: () => MonacoSelection
  executeEdits: (source: string, edits: unknown[]) => void
  setPosition: (position: MonacoPosition) => void
  focus: () => void
}

interface LaTeXEditorProps {
  value: string
  onChange: (value: string) => void
  onStateChange?: (state: EditorState) => void
  className?: string
  theme?: 'light' | 'dark'
  readOnly?: boolean
  fontSize?: number
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
}

export function LaTeXEditor({
  value,
  onChange,
  onStateChange,
  className,
  theme = 'light',
  readOnly = false,
  fontSize = 14,
  wordWrap = 'on'
}: LaTeXEditorProps) {
  const editorRef = useRef<MonacoEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Handle editor mount
  function handleEditorDidMount(editor: unknown, monaco: Monaco) {
    const monacoEditor = editor as MonacoEditor
    editorRef.current = monacoEditor
    monacoRef.current = monaco
    setIsReady(true)

    // Configure LaTeX language support
    configureLaTeXLanguage(monaco)

    // Set up event listeners - use throttled state change to prevent infinite loops
    let stateChangeTimeout: NodeJS.Timeout | null = null
    monacoEditor.onDidChangeCursorPosition((e: MonacoCursorEvent) => {
      if (onStateChange && stateChangeTimeout === null) {
        stateChangeTimeout = setTimeout(() => {
          const model = monacoEditor.getModel()
          const selection = monacoEditor.getSelection()
          
          onStateChange({
            content: model.getValue(),
            cursorPosition: model.getOffsetAt(e.position),
            selection: {
              start: model.getOffsetAt(selection.getStartPosition()),
              end: model.getOffsetAt(selection.getEndPosition())
            },
            isDirty: false,
            lastSaved: null
          })
          stateChangeTimeout = null
        }, 100) // Throttle to 100ms
      }
    })

    // Add custom key bindings
    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Handle save - you can emit a custom event or call a callback
      const event = new CustomEvent('editor-save', { detail: { content: value } })
      window.dispatchEvent(event)
    })

    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      insertTextAtCursor('\\textbf{', '}')
    })

    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      insertTextAtCursor('\\textit{', '}')
    })
  }

  // Configure LaTeX language support
  function configureLaTeXLanguage(monaco: Monaco) {
    // Register LaTeX language if not already registered
    const languages = monaco.languages.getLanguages()
    if (!languages.find(lang => lang.id === 'latex')) {
      monaco.languages.register({ id: 'latex' })
    }

    // Set language configuration
    monaco.languages.setLanguageConfiguration('latex', {
      comments: {
        lineComment: '%'
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '`', close: '`' },
        { open: '$', close: '$' }
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '`', close: '`' },
        { open: '$', close: '$' }
      ]
    })

    // Set tokenization rules
    monaco.languages.setMonarchTokensProvider('latex', {
      tokenizer: {
        root: [
          // Comments
          [/%.*$/, 'comment'],
          
          // Math mode
          [/\$\$/, 'string', '@mathMode'],
          [/\$/, 'string', '@inlineMath'],
          
          // Commands
          [/\\[a-zA-Z]+\*?/, 'keyword'],
          
          // Environments
          [/\\begin\{[^}]+\}/, 'tag'],
          [/\\end\{[^}]+\}/, 'tag'],
          
          // Braces
          [/[{}]/, 'delimiter.bracket'],
          [/[\[\]]/, 'delimiter.square'],
          
          // Special characters
          [/[&%$#_{}~^\\]/, 'keyword.operator']
        ],
        
        mathMode: [
          [/\$\$/, 'string', '@pop'],
          [/[^$]+/, 'variable.name']
        ],
        
        inlineMath: [
          [/\$/, 'string', '@pop'],
          [/[^$]+/, 'variable.name']
        ]
      }
    })

    // Set theme
    const customTheme = theme === 'dark' ? 'latex-dark' : 'latex-light'
    
    monaco.editor.defineTheme(customTheme, {
      base: theme === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: theme === 'dark' ? '569cd6' : '0000ff' },
        { token: 'tag', foreground: theme === 'dark' ? 'ce9178' : '8b0000' },
        { token: 'string', foreground: theme === 'dark' ? 'ce9178' : '008000' },
        { token: 'variable.name', foreground: theme === 'dark' ? 'dcdcaa' : '000080' },
        { token: 'keyword.operator', foreground: theme === 'dark' ? 'd4d4d4' : '000000' }
      ],
      colors: {
        'editor.background': theme === 'dark' ? '#1e1e1e' : '#ffffff',
        'editor.foreground': theme === 'dark' ? '#d4d4d4' : '#000000'
      }
    })

    monaco.editor.setTheme(customTheme)
  }

  // Insert text at cursor position
  function insertTextAtCursor(before: string, after: string = '') {
    if (!editorRef.current) return

    const editor = editorRef.current
    const selection = editor.getSelection()
    const model = editor.getModel()
    
    if (selection.isEmpty()) {
      // No selection - insert at cursor
      const position = selection.getStartPosition()
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      }
      
      editor.executeEdits('insert-text', [{
        range: range,
        text: before + after
      }])
      
      // Move cursor between before and after
      const newPosition: MonacoPosition = {
        lineNumber: position.lineNumber,
        column: position.column + before.length
      }
      editor.setPosition(newPosition)
    } else {
      // Has selection - wrap it
      const selectedText = model.getValueInRange(selection)
      editor.executeEdits('wrap-text', [{
        range: selection,
        text: before + selectedText + after
      }])
    }
    
    editor.focus()
  }

  // Auto-completion provider
  useEffect(() => {
    if (!isReady || !monacoRef.current) return

    const disposable = monacoRef.current.languages.registerCompletionItemProvider('latex', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        return {
          suggestions: [
            // Document structure
            {
              label: '\\documentclass',
              kind: monacoRef.current!.languages.CompletionItemKind.Keyword,
              insertText: '\\documentclass{${1:article}}',
              insertTextRules: monacoRef.current!.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            },
            {
              label: '\\begin{document}',
              kind: monacoRef.current!.languages.CompletionItemKind.Snippet,
              insertText: '\\begin{document}\n${1}\n\\end{document}',
              insertTextRules: monacoRef.current!.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            },
            
            // Formatting
            {
              label: '\\textbf',
              kind: monacoRef.current!.languages.CompletionItemKind.Function,
              insertText: '\\textbf{${1:text}}',
              insertTextRules: monacoRef.current!.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            },
            {
              label: '\\textit',
              kind: monacoRef.current!.languages.CompletionItemKind.Function,
              insertText: '\\textit{${1:text}}',
              insertTextRules: monacoRef.current!.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            },
            
            // Sections
            {
              label: '\\section',
              kind: monacoRef.current!.languages.CompletionItemKind.Function,
              insertText: '\\section{${1:title}}',
              insertTextRules: monacoRef.current!.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            },
            {
              label: '\\subsection',
              kind: monacoRef.current!.languages.CompletionItemKind.Function,
              insertText: '\\subsection{${1:title}}',
              insertTextRules: monacoRef.current!.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            },
            
            // Lists
            {
              label: '\\begin{itemize}',
              kind: monacoRef.current!.languages.CompletionItemKind.Snippet,
              insertText: '\\begin{itemize}\n\\item ${1:item}\n\\end{itemize}',
              insertTextRules: monacoRef.current!.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            },
            {
              label: '\\item',
              kind: monacoRef.current!.languages.CompletionItemKind.Function,
              insertText: '\\item ${1:text}',
              insertTextRules: monacoRef.current!.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            }
          ]
        }
      }
    })

    return () => disposable.dispose()
  }, [isReady])

  return (
    <div className={cn('h-full w-full', className)}>
      <Editor
        height="100%"
        defaultLanguage="latex"
        value={value}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        options={{
          fontSize,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          wordWrap,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
          lineNumbers: 'on',
          folding: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: 'selection',
          cursorBlinking: 'blink',
          smoothScrolling: true,
          contextmenu: true,
          mouseWheelZoom: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on'
        }}
      />
    </div>
  )
}
