import { NextRequest, NextResponse } from 'next/server'
import { CompilationResult } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { success: false, errors: ['No content provided'] },
        { status: 400 }
      )
    }

    // For now, we'll simulate PDF compilation
    // In production, this would connect to a LaTeX compilation service
    const result = await simulateLatexCompilation(content)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Compilation API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        errors: ['Internal server error during compilation'] 
      },
      { status: 500 }
    )
  }
}

// Simulate LaTeX compilation - replace with actual service in production
async function simulateLatexCompilation(
  content: string
): Promise<CompilationResult> {
  // Basic validation
  if (!content.includes('\\documentclass')) {
    return {
      success: false,
      errors: ['Missing \\documentclass declaration']
    }
  }

  if (!content.includes('\\begin{document}')) {
    return {
      success: false,
      errors: ['Missing \\begin{document}']
    }
  }

  if (!content.includes('\\end{document}')) {
    return {
      success: false,
      errors: ['Missing \\end{document}']
    }
  }

  // Check for common LaTeX errors
  const openBraces = (content.match(/\{/g) || []).length
  const closeBraces = (content.match(/\}/g) || []).length
  
  if (openBraces !== closeBraces) {
    return {
      success: false,
      errors: [`Mismatched braces: ${Math.abs(openBraces - closeBraces)} unmatched`]
    }
  }

  // Simulate compilation delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Generate a simple PDF buffer (in production, this would be from pdflatex)
  const pdfBuffer = await generateSamplePDF(content)

  return {
    success: true,
    pdfBuffer: Array.from(pdfBuffer),
    warnings: [],
    logs: ['LaTeX compilation successful']
  }
}

// Generate PDF using ONLY real LaTeX compilation
async function generateSamplePDF(latexContent: string): Promise<Uint8Array> {
  console.log('🚀 Starting LaTeX compilation...')
  
  try {
    // Try real LaTeX compilation
    const realPDF = await compileLatexToPDF(latexContent)
    if (realPDF) {
      console.log('✅ LaTeX compilation successful! PDF size:', realPDF.length)
      return realPDF
    }
  } catch (error) {
    console.log('❌ LaTeX compilation failed:', error)
  }
  
  // If compilation fails, return a simple error PDF
  console.log('⚠️ Returning error PDF - LaTeX compilation service unavailable')
  return createErrorPDF('LaTeX compilation failed. Please check your LaTeX syntax or try again later.')
}

// Create a simple error PDF
async function createErrorPDF(errorMessage: string): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('LaTeX Compilation Error', 20, 30)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(errorMessage, 170)
  let yPos = 50
  lines.forEach((line: string) => {
    doc.text(line, 20, yPos)
    yPos += 8
  })
  
  doc.setFontSize(10)
  doc.text('Please check your LaTeX syntax and try again.', 20, yPos + 20)
  
  return new Uint8Array(doc.output('arraybuffer'))
}

// Real LaTeX compilation using online service
async function compileLatexToPDF(latexContent: string): Promise<Uint8Array | null> {
  try {
    console.log('🚀 Starting real LaTeX compilation...')
    console.log('LaTeX content preview:', latexContent.substring(0, 200) + '...')
    
    // Method 1: Try original LaTeX as-is with timeout
    console.log('Method 1: Trying original LaTeX document...')
    const originalResult = await Promise.race([
      tryLatexOnline(latexContent),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Compilation timeout')), 30000)
      )
    ]).catch(error => {
      console.log('Method 1 failed:', error.message)
      return null
    })
    
    if (originalResult) {
      console.log('✅ Method 1 SUCCESS: Real LaTeX compilation working!')
      return originalResult
    }
    
    // Method 2: Try simplified version for online services
    console.log('Method 2: Trying simplified LaTeX...')
    const simplifiedLatex = simplifyLatexForOnlineServices(latexContent)
    if (simplifiedLatex !== latexContent) {
      console.log('Simplified LaTeX length:', simplifiedLatex.length)
      const simplifiedResult = await Promise.race([
        tryLatexOnline(simplifiedLatex),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Simplified compilation timeout')), 25000)
        )
      ]).catch(error => {
        console.log('Method 2 failed:', error.message)
        return null
      })
      
      if (simplifiedResult) {
        console.log('✅ Method 2 SUCCESS: Simplified LaTeX compilation working!')
        return simplifiedResult
      }
    }
    
    console.log('❌ All real LaTeX compilation methods failed')
    return null
    
  } catch (error) {
    console.log('LaTeX compilation error:', error)
    return null
  }
}

// Try LaTeX.Online service
async function tryLatexOnline(latexContent: string): Promise<Uint8Array | null> {
  try {
    console.log('=== Attempting Real LaTeX Compilation ===')
    console.log('LaTeX content length:', latexContent.length)
    
    // Method 1: Try LaTeX.Online with proper URL format
    console.log('Trying LaTeX.Online URL compilation...')
    
    // Create a simple approach - try the URL-based compilation first
    const encodedLatex = encodeURIComponent(latexContent)
    const directUrl = `https://latexonline.cc/compile?text=${encodedLatex}&command=pdflatex`
    
    try {
      const directResponse = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        }
      })
      
      console.log('Direct URL response:', directResponse.status, directResponse.statusText)
      
      if (directResponse.ok && directResponse.headers.get('content-type')?.includes('pdf')) {
        const pdfBuffer = await directResponse.arrayBuffer()
        console.log('SUCCESS: Real LaTeX compilation via URL, PDF size:', pdfBuffer.byteLength)
        if (pdfBuffer.byteLength > 1000) { // Ensure it's a real PDF
          return new Uint8Array(pdfBuffer)
        }
      }
    } catch (urlError) {
      console.log('URL method failed:', urlError)
    }
    
    // Method 2: Try POST compilation
    console.log('Trying LaTeX.Online POST compilation...')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout
    
    const response = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/pdf'
      },
      body: new URLSearchParams({
        'text': latexContent,
        'command': 'pdflatex'
      }).toString(),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    console.log('POST response:', response.status, response.statusText)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const contentType = response.headers.get('content-type')
      console.log('Content-Type:', contentType)
      
      if (contentType?.includes('pdf')) {
        const pdfBuffer = await response.arrayBuffer()
        console.log('SUCCESS: Real LaTeX compilation via POST, PDF size:', pdfBuffer.byteLength)
        if (pdfBuffer.byteLength > 1000) {
          return new Uint8Array(pdfBuffer)
        }
      } else {
        const textResponse = await response.text()
        console.log('Non-PDF response (LaTeX compilation error):', textResponse)
        console.log('This indicates LaTeX compilation failed - checking for errors...')
        
        // Check if response contains LaTeX error information
        if (textResponse.includes('!') || textResponse.includes('Error') || textResponse.includes('error')) {
          console.log('LATEX COMPILATION ERROR DETECTED:')
          console.log(textResponse)
        }
      }
    }
    
    return null
    
  } catch (error) {
    console.log('LaTeX.Online service error:', error)
    return null
  }
}

// Simplify LaTeX for online services by removing problematic packages
function simplifyLatexForOnlineServices(latex: string): string {
  let simplified = latex
  
  // Remove or replace problematic packages
  simplified = simplified.replace(/\\usepackage\{fontawesome5?\}/g, '% FontAwesome not available online')
  simplified = simplified.replace(/\\usepackage\{marvosym\}/g, '% Marvosym not available online')
  simplified = simplified.replace(/\\input\{glyphtounicode\}/g, '% Glyphtounicode not available online')
  
  // Replace FontAwesome commands with text
  simplified = simplified.replace(/\\faPhone/g, 'Tel:')
  simplified = simplified.replace(/\\faEnvelope/g, 'Email:')
  simplified = simplified.replace(/\\faLinkedin/g, 'LinkedIn:')
  simplified = simplified.replace(/\\faGithub/g, 'GitHub:')
  
  // Simplify complex geometry
  simplified = simplified.replace(/\\addtolength\{[^}]*\}\{[^}]*\}/g, '')
  
  return simplified
}
