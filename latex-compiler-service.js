const express = require('express')
const cors = require('cors')
const fs = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.text({ limit: '10mb' }))

// Create temp directory
const TEMP_DIR = '/tmp/latex-compilation'
fs.ensureDirSync(TEMP_DIR)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Compile LaTeX to PDF
app.post('/compile', async (req, res) => {
  const startTime = Date.now()
  let tempDir = null

  try {
    const { content, options = {} } = req.body

    if (!content) {
      return res.status(400).json({
        success: false,
        errors: ['No LaTeX content provided']
      })
    }

    // Create unique temp directory
    const sessionId = `latex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    tempDir = path.join(TEMP_DIR, sessionId)
    await fs.ensureDir(tempDir)

    // Write LaTeX content to file
    const texFile = path.join(tempDir, 'document.tex')
    await fs.writeFile(texFile, content, 'utf8')

    console.log(`[${sessionId}] Starting compilation...`)

    // Compile with pdflatex
    const compileCommand = [
      'pdflatex',
      '-interaction=nonstopmode',
      '-halt-on-error',
      '-output-directory',
      tempDir,
      texFile
    ].join(' ')

    try {
      // First pass
      const { stdout: stdout1, stderr: stderr1 } = await execAsync(compileCommand, {
        cwd: tempDir,
        timeout: 30000 // 30 second timeout
      })

      // Second pass for references, bibliography, etc.
      try {
        await execAsync(compileCommand, {
          cwd: tempDir,
          timeout: 30000
        })
      } catch (secondPassError) {
        // Second pass errors are usually non-critical
        console.log(`[${sessionId}] Second pass warning:`, secondPassError.message)
      }

      // Check if PDF was generated
      const pdfFile = path.join(tempDir, 'document.pdf')
      const pdfExists = await fs.pathExists(pdfFile)

      if (!pdfExists) {
        // Try to read log file for errors
        const logFile = path.join(tempDir, 'document.log')
        let logContent = ''
        try {
          logContent = await fs.readFile(logFile, 'utf8')
        } catch (logError) {
          console.log(`[${sessionId}] Could not read log file`)
        }

        return res.json({
          success: false,
          errors: ['PDF generation failed'],
          logs: [logContent],
          compilationTime: Date.now() - startTime
        })
      }

      // Read PDF file
      const pdfBuffer = await fs.readFile(pdfFile)

      // Read log file for warnings
      const logFile = path.join(tempDir, 'document.log')
      let warnings = []
      try {
        const logContent = await fs.readFile(logFile, 'utf8')
        warnings = extractWarningsFromLog(logContent)
      } catch (logError) {
        console.log(`[${sessionId}] Could not read log file for warnings`)
      }

      console.log(`[${sessionId}] Compilation successful (${Date.now() - startTime}ms)`)

      res.json({
        success: true,
        pdfBuffer: Array.from(pdfBuffer),
        warnings,
        logs: [`Compilation completed in ${Date.now() - startTime}ms`],
        compilationTime: Date.now() - startTime
      })

    } catch (compileError) {
      console.error(`[${sessionId}] Compilation error:`, compileError.message)

      // Try to extract meaningful error from log
      const logFile = path.join(tempDir, 'document.log')
      let errorDetails = compileError.message
      try {
        const logContent = await fs.readFile(logFile, 'utf8')
        const extractedErrors = extractErrorsFromLog(logContent)
        if (extractedErrors.length > 0) {
          errorDetails = extractedErrors.join('\n')
        }
      } catch (logError) {
        console.log(`[${sessionId}] Could not read log file for errors`)
      }

      res.json({
        success: false,
        errors: [errorDetails],
        logs: [compileError.stdout || '', compileError.stderr || ''],
        compilationTime: Date.now() - startTime
      })
    }

  } catch (error) {
    console.error('Server error:', error)
    res.status(500).json({
      success: false,
      errors: ['Internal server error during compilation'],
      compilationTime: Date.now() - startTime
    })
  } finally {
    // Clean up temp directory
    if (tempDir) {
      try {
        await fs.remove(tempDir)
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
    }
  }
})

// Extract errors from LaTeX log
function extractErrorsFromLog(logContent) {
  const errors = []
  const lines = logContent.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Look for error indicators
    if (line.includes('! ') || line.includes('Error:')) {
      let errorMessage = line
      
      // Try to get more context
      if (i + 1 < lines.length) {
        errorMessage += '\n' + lines[i + 1]
      }
      
      errors.push(errorMessage.trim())
    }
    
    // Look for "Undefined control sequence" errors
    if (line.includes('Undefined control sequence')) {
      errors.push(`Undefined control sequence: ${line.trim()}`)
    }
  }
  
  return errors.slice(0, 5) // Limit to first 5 errors
}

// Extract warnings from LaTeX log
function extractWarningsFromLog(logContent) {
  const warnings = []
  const lines = logContent.split('\n')
  
  for (const line of lines) {
    if (line.includes('Warning:') || line.includes('warning:')) {
      warnings.push(line.trim())
    }
  }
  
  return warnings.slice(0, 10) // Limit to first 10 warnings
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  process.exit(0)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LaTeX Compiler Service running on port ${PORT}`)
  console.log(`Temp directory: ${TEMP_DIR}`)
})
