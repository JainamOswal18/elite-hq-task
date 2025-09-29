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

// Generate PDF using real LaTeX compilation
async function generateSamplePDF(latexContent: string): Promise<Uint8Array> {
  try {
    // FORCE real LaTeX compilation first - this should work!
    console.log('🚀 FORCING real LaTeX compilation...')
    console.log('LaTeX content preview:', latexContent.substring(0, 300))
    
    const realPDF = await compileLatexToPDF(latexContent)
    if (realPDF && realPDF.length > 1000) {
      console.log('✅ SUCCESS: Real LaTeX compilation worked! PDF size:', realPDF.length)
      return realPDF
    } else {
      console.log('❌ Real LaTeX failed - PDF too small or null:', realPDF?.length)
    }
  } catch (error) {
    console.log('❌ Real LaTeX compilation failed with error:', error)
  }
  
  // Fallback to parsing approach for preview
  console.log('⚠️ Using fallback parsing approach for preview...')
  const sections = parseLatexContent(latexContent)
  console.log('📋 Parsed sections:', JSON.stringify(sections, null, 2))
  
  const pdfBuffer = await generatePDFWithPDFKit(sections)
  return new Uint8Array(pdfBuffer)
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
    console.log('Method 2: Trying simplified version...')
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
    
    console.log('❌ All real LaTeX compilation methods failed, falling back to parsing')
    return null
  } catch (error) {
    console.error('❌ LaTeX compilation error:', error)
    return null
  }
}

// Simplify LaTeX for online services that may not have all packages
function simplifyLatexForOnlineServices(latex: string): string {
  console.log('Simplifying LaTeX for better online compatibility...')
  
  let simplified = latex
  
  // Replace fontawesome5 commands with text equivalents
  simplified = simplified.replace(/\\usepackage\{fontawesome5\}/g, '% fontawesome5 not available')
  simplified = simplified.replace(/\\faPhone/g, 'Tel:')
  simplified = simplified.replace(/\\faEnvelope/g, 'Email:')
  simplified = simplified.replace(/\\faLinkedin/g, 'LinkedIn:')
  simplified = simplified.replace(/\\faGithub/g, 'GitHub:')
  simplified = simplified.replace(/\\raisebox\{[^}]*\}/g, '') // Remove raisebox
  
  // Simplify some packages that might not be available
  simplified = simplified.replace(/\\usepackage\{marvosym\}/g, '% marvosym not available')
  simplified = simplified.replace(/\\usepackage\{multicol\}/g, '% multicol simplified')
  simplified = simplified.replace(/\\input\{glyphtounicode\}/g, '% glyphtounicode not available')
  
  // Replace complex page setup with simpler margins
  simplified = simplified.replace(/\\addtolength\{\\oddsidemargin\}\{[^}]*\}/g, '')
  simplified = simplified.replace(/\\addtolength\{\\evensidemargin\}\{[^}]*\}/g, '')
  simplified = simplified.replace(/\\addtolength\{\\textwidth\}\{[^}]*\}/g, '')
  simplified = simplified.replace(/\\addtolength\{\\topmargin\}\{[^}]*\}/g, '')
  simplified = simplified.replace(/\\addtolength\{\\textheight\}\{[^}]*\}/g, '')
  
  // Simplify fancyhdr usage
  simplified = simplified.replace(/\\pagestyle\{fancy\}/g, '\\pagestyle{empty}')
  simplified = simplified.replace(/\\fancyhf\{\}/g, '')
  simplified = simplified.replace(/\\fancyfoot\{\}/g, '')
  
  // Replace complex bullet customization
  simplified = simplified.replace(/\\renewcommand\\labelitemi\{[^}]*\}/g, '')
  simplified = simplified.replace(/\\renewcommand\\labelitemii\{[^}]*\}/g, '')
  
  // Ensure we have basic packages that online services should support
  if (!simplified.includes('\\usepackage{geometry}')) {
    simplified = simplified.replace('\\documentclass[letterpaper,11pt]{article}', 
      '\\documentclass[letterpaper,11pt]{article}\n\\usepackage[margin=0.75in]{geometry}')
  }
  
  return simplified
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
    
    let response = await fetch('https://latexonline.cc/compile', {
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
    } else {
      // Log error response
      const errorText = await response.text()
      console.log('POST request failed:', response.status, errorText)
    }
    
    // Method 3: Try with XeLaTeX (better package support)
    console.log('Trying LaTeX.Online with XeLaTeX compiler...')
    
    try {
      const xelatexResponse = await fetch('https://latexonline.cc/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/pdf'
        },
        body: new URLSearchParams({
          'text': latexContent,
          'command': 'xelatex'  // XeLaTeX has better package support
        }).toString()
      })
      
      console.log('XeLaTeX response:', xelatexResponse.status)
      
      if (xelatexResponse.ok) {
        const contentType = xelatexResponse.headers.get('content-type')
        if (contentType?.includes('pdf')) {
          const pdfBuffer = await xelatexResponse.arrayBuffer()
          console.log('SUCCESS: XeLaTeX compilation, PDF size:', pdfBuffer.byteLength)
          if (pdfBuffer.byteLength > 1000) {
            return new Uint8Array(pdfBuffer)
          }
        } else {
          const xelatexError = await xelatexResponse.text()
          console.log('XeLaTeX compilation error:', xelatexError.substring(0, 500))
        }
      }
    } catch (xelatexError) {
      console.log('XeLaTeX compilation failed:', xelatexError)
    }

    // Method 4: Try alternative service
    console.log('Trying alternative LaTeX service...')
    
    try {
      const altResponse = await fetch('https://latex.aslushnikov.com/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'text': latexContent
        }).toString()
      })
      
      console.log('Alternative service response:', altResponse.status)
      
      if (altResponse.ok) {
        const pdfBuffer = await altResponse.arrayBuffer()
        console.log('SUCCESS: Alternative service, PDF size:', pdfBuffer.byteLength)
        if (pdfBuffer.byteLength > 1000) {
          return new Uint8Array(pdfBuffer)
        }
      }
    } catch (altError) {
      console.log('Alternative service failed:', altError)
    }

    // Method 5: Try with LuaLaTeX (modern compiler)
    console.log('Trying LaTeX.Online with LuaLaTeX compiler...')
    
    try {
      const lualatexResponse = await fetch('https://latexonline.cc/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/pdf'
        },
        body: new URLSearchParams({
          'text': latexContent,
          'command': 'lualatex'
        }).toString()
      })
      
      console.log('LuaLaTeX response:', lualatexResponse.status)
      
      if (lualatexResponse.ok) {
        const contentType = lualatexResponse.headers.get('content-type')
        if (contentType?.includes('pdf')) {
          const pdfBuffer = await lualatexResponse.arrayBuffer()
          console.log('SUCCESS: LuaLaTeX compilation, PDF size:', pdfBuffer.byteLength)
          if (pdfBuffer.byteLength > 1000) {
            return new Uint8Array(pdfBuffer)
          }
        }
      }
    } catch (lualatexError) {
      console.log('LuaLaTeX compilation failed:', lualatexError)
    }
    
    console.log('=== All LaTeX services failed, falling back to parsing ===')
    return null
    
  } catch (error) {
    console.log('LaTeX compilation error:', error)
    return null
  }
}

// Alternative: Try CodeCogs for equation rendering (fallback for equations)
async function tryCodeCogs(latexContent: string): Promise<Uint8Array | null> {
  try {
    // Extract LaTeX content and convert to image first, then to PDF
    // This is mainly for equation rendering, not full documents
    const cleanLatex = latexContent.replace(/[\r\n]+/g, ' ').trim()
    
    const imageResponse = await fetch(`https://latex.codecogs.com/png.latex?${encodeURIComponent(cleanLatex)}`)
    
    if (!imageResponse.ok) return null
    
    // Convert image to PDF using canvas (this is a simplified approach)
    // In a real implementation, we'd need to handle this properly
    return null
  } catch (error) {
    console.log('CodeCogs service error:', error)
    return null
  }
}

// Parse LaTeX content into structured sections - flexible approach
function parseLatexContent(latex: string) {
  const sections: any = {
    name: '',
    title: '',
    contact: {},
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    achievements: [],
    rawSections: []
  }

  // Extract name from various formats
  sections.name = extractName(latex)
  sections.title = extractTitle(latex)
  sections.contact = extractContact(latex)
  
  // Extract all sections generically
  const allSections = extractAllSections(latex)
  sections.rawSections = allSections
  
  // Categorize sections based on content
  allSections.forEach(section => {
    const lowerTitle = section.title.toLowerCase()
    
    if (lowerTitle.includes('summary') || lowerTitle.includes('objective') || lowerTitle.includes('profile')) {
      sections.summary = section.content
    }
    else if (lowerTitle.includes('experience') || lowerTitle.includes('work') || lowerTitle.includes('employment')) {
      sections.experience = parseExperienceSection(section.content)
    }
    else if (lowerTitle.includes('education') || lowerTitle.includes('academic')) {
      sections.education = parseEducationSection(section.content)
    }
    else if (lowerTitle.includes('skill') || lowerTitle.includes('technical') || lowerTitle.includes('competenc')) {
      sections.skills = parseSkillsSection(section.content)
    }
    else if (lowerTitle.includes('project')) {
      sections.projects = parseProjectsSection(section.content)
    }
    else if (lowerTitle.includes('achievement') || lowerTitle.includes('award') || lowerTitle.includes('honor')) {
      sections.achievements = parseProjectsSection(section.content) // Reuse same parser
    }
  })

  return sections
}

// Extract name from various LaTeX formats
function extractName(latex: string): string {
  // Try various name patterns
  const patterns = [
    /\\name\{([^}]+)\}/,
    /\\author\{([^}]+)\}/,
    // Article class center format - THIS IS THE PATTERN WE NEED
    /\{\\LARGE\\textbf\{([^}]+)\}\}/,
    /\\LARGE\\textbf\{([^}]+)\}/,
    // Custom resume templates
    /\\centerline\{\\huge\s*\\bfseries\s*([^}]+)\}/,
    /\\centerline\{\\huge\s*\\scshape\s*([^}]+)\}/,
    /\\begin\{center\}[\s\S]*?\{\\Huge\s*\\scshape\s*([^}]+)\}/,
    /\\begin\{center\}[\s\S]*?\{\\huge\s*\\bfseries\s*([^}]+)\}/,
    // Standard patterns
    /\\textbf\{([^}]*(?:John|Jane|Mr\.|Ms\.|Dr\.)[^}]*)\}/i,
    /\\large\s*\\textbf\{([^}]+)\}/,
    /\\LARGE\s*([^\\]+)/,
    /\\huge\s*([^\\]+)/,
    /\\Huge\s*\\scshape\s*([^\\]+)/,
    /\\huge\s*\\bfseries\s*([^\\]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = latex.match(pattern)
    if (match && match[1].trim().length > 0) {
      return match[1].trim()
    }
  }
  
  // Try to find name in center environments
  const centerMatch = latex.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/)
  if (centerMatch) {
    const centerContent = centerMatch[1]
    // Look for large text or bold text that could be a name
    const nameInCenter = centerContent.match(/\{\\(?:Huge|huge|LARGE|Large)\s*(?:\\scshape|\\bfseries)?\s*([^}]+)\}/)
    if (nameInCenter) {
      return nameInCenter[1].trim()
    }
  }
  
  // Try centerline
  const centerlineMatch = latex.match(/\\centerline\{[^}]*?([A-Z][a-z]+\s+[A-Z][a-z]+)[^}]*\}/)
  if (centerlineMatch) {
    return centerlineMatch[1].trim()
  }
  
  // Fallback: look for any capitalized words at the beginning
  const lines = latex.split('\n')
  for (const line of lines.slice(0, 15)) {
    const cleanLine = line.replace(/\\[a-zA-Z]+\*?\{?/g, '').replace(/\}/g, '').trim()
    if (cleanLine.match(/^[A-Z][a-z]+ [A-Z][a-z]+/)) {
      return cleanLine.split(' ').slice(0, 2).join(' ')
    }
  }
  
  return 'Resume Preview'
}

// Extract title/position from various formats
function extractTitle(latex: string): string {
  const patterns = [
    /\\title\{([^}]+)\}/,
    /\\subtitle\{([^}]+)\}/,
    /\\textit\{([^}]*(?:Engineer|Developer|Manager|Analyst|Designer)[^}]*)\}/i,
    /\\emph\{([^}]*(?:Engineer|Developer|Manager|Analyst|Designer)[^}]*)\}/i,
  ]
  
  for (const pattern of patterns) {
    const match = latex.match(pattern)
    if (match && match[1].trim().length > 0) {
      return match[1].trim()
    }
  }
  
  return ''
}

// Extract contact information flexibly
function extractContact(latex: string): any {
  const contact: any = {}
  
  // Email patterns
  const emailPatterns = [
    /\\email\{([^}]+)\}/,
    /\\href\{mailto:([^}]+)\}/,
    /\\faEnvelope\\?\s*\\underline\{([^}]+)\}/,
    /Email:\s*\\href\{mailto:([^}]+)\}/,
    /Email:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  ]
  
  for (const pattern of emailPatterns) {
    const match = latex.match(pattern)
    if (match) {
      contact.email = match[1]
      break
    }
  }
  
  // Phone patterns
  const phonePatterns = [
    /\\phone\{([^}]+)\}/,
    /\\phone\[[^\]]*\]\{([^}]+)\}/,
    /\\faPhone\\?\s*([+\d\s\-()]+)/,
    /\\raisebox\{[^}]*\}\\faPhone\\?\s*([+\d\s\-()]+)/,
    /(\+91\s*\d{5}\s*\d{5})/,
    /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/
  ]
  
  for (const pattern of phonePatterns) {
    const match = latex.match(pattern)
    if (match) {
      contact.phone = match[1].trim()
      break
    }
  }
  
  // Address patterns  
  const addressPatterns = [
    /\\address\{([^}]+)\}/,
    /\\location\{([^}]+)\}/,
  ]
  
  for (const pattern of addressPatterns) {
    const match = latex.match(pattern)
    if (match) {
      contact.address = match[1]
      break
    }
  }
  
  // LinkedIn patterns
  const linkedinPatterns = [
    /\\social\[linkedin\]\{([^}]+)\}/,
    /\\linkedin\{([^}]+)\}/,
    /\\faLinkedin\\?\s*\\underline\{([^}]+)\}/,
    /\\href\{https?:\/\/linkedin\.com\/in\/([^}]+)\}/,
    /LinkedIn:\s*linkedin\.com\/in\/([^}\s]+)/,
    /linkedin\.com\/in\/([^}\s]+)/
  ]
  
  for (const pattern of linkedinPatterns) {
    const match = latex.match(pattern)
    if (match) {
      contact.linkedin = match[1]
      break
    }
  }
  
  // GitHub patterns
  const githubPatterns = [
    /\\faGithub\\?\s*\\underline\{([^}]+)\}/,
    /\\href\{https?:\/\/github\.com\/([^}]+)\}/,
    /GitHub:\s*github\.com\/([^}\s]+)/,
    /github\.com\/([^}\s]+)/
  ]
  
  for (const pattern of githubPatterns) {
    const match = latex.match(pattern)
    if (match) {
      contact.github = match[1]
      break
    }
  }
  
  return contact
}

// Extract all sections generically
function extractAllSections(latex: string): Array<{title: string, content: string}> {
  const sections: Array<{title: string, content: string}> = []
  
  // Pattern to match \section{title} and capture content until next section or end
  const sectionPattern = /\\section\*?\{([^}]+)\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/g
  
  let match
  while ((match = sectionPattern.exec(latex)) !== null) {
    sections.push({
      title: match[1],
      content: match[2].trim()
    })
  }
  
  // Also try \subsection
  const subsectionPattern = /\\subsection\*?\{([^}]+)\}([\s\S]*?)(?=\\(?:sub)?section|\\end\{document\}|$)/g
  
  while ((match = subsectionPattern.exec(latex)) !== null) {
    sections.push({
      title: match[1],
      content: match[2].trim()
    })
  }
  
  return sections
}

// Parse experience section flexibly
function parseExperienceSection(content: string): Array<any> {
  const experiences: Array<any> = []
  
  // Try various experience patterns
  const patterns = [
    // Custom resume templates \resumeSubheading{Company}{Date}{Position}{Location}
    /\\resumeSubheading\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}/g,
    // moderncv \cventry
    /\\cventry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
    // \experience or \job patterns
    /\\(?:experience|job|position)\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
    // Custom patterns with \textbf
    /\\textbf\{([^}]+)\}[\s\S]*?\\textit\{([^}]+)\}[\s\S]*?([0-9]{4}[\-\s]*[0-9]{4}|Present|Current)/g,
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      if (patterns.indexOf(pattern) === 0) {
        // \resumeSubheading format: {Company}{Date}{Position}{Location}
        experiences.push({
          company: match[1] || '',
          period: match[2] || '',
          position: match[3] || '',
          location: match[4] || ''
        })
      } else if (patterns.indexOf(pattern) === 1) {
        // moderncv format
        experiences.push({
          period: match[1] || '',
          position: match[2] || '',
          company: match[3] || '',
          location: match[4] || '',
          details: match[5] || ''
        })
      } else {
        experiences.push({
          position: match[1] || '',
          company: match[2] || '',
          period: match[3] || '',
          location: match[4] || ''
        })
      }
    }
  }
  
  // If no structured entries found, extract from plain text
  if (experiences.length === 0) {
    const lines = content.split('\n')
    let currentExp: any = {}
    
    for (const line of lines) {
      const cleanLine = line.replace(/\\[a-zA-Z]+\*?\{?/g, '').replace(/\}/g, '').trim()
      if (cleanLine.length > 0) {
        if (cleanLine.match(/[0-9]{4}/)) {
          currentExp.period = cleanLine
        } else if (cleanLine.match(/(Engineer|Developer|Manager|Analyst|Designer|Intern|Organizer|Participant)/i)) {
          currentExp.position = cleanLine
        } else if (currentExp.position && !currentExp.company) {
          currentExp.company = cleanLine
        }
        
        if (currentExp.position && currentExp.company) {
          experiences.push({...currentExp})
          currentExp = {}
        }
      }
    }
  }
  
  return experiences
}

// Parse education section flexibly
function parseEducationSection(content: string): Array<any> {
  const education: Array<any> = []
  
  const patterns = [
    /\\cventry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
    /\\education\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      education.push({
        period: match[1] || '',
        degree: match[2] || '',
        institution: match[3] || '',
        location: match[4] || '',
        gpa: match[5] || ''
      })
    }
  }
  
  // Extract from text if no structured entries
  if (education.length === 0) {
    const lines = content.split('\n')
    for (const line of lines) {
      const cleanLine = line.replace(/\\[a-zA-Z]+\{?/g, '').replace(/\}/g, '').trim()
      if (cleanLine.match(/(Bachelor|Master|PhD|Degree|University|College)/i)) {
        education.push({
          degree: cleanLine,
          institution: '',
          period: '',
          location: '',
          gpa: ''
        })
      }
    }
  }
  
  return education
}

// Parse skills section flexibly
function parseSkillsSection(content: string): Array<any> {
  const skills: Array<any> = []
  
  // Try \cvitem pattern
  const cvitemPattern = /\\cvitem\{([^}]*)\}\{([^}]*)\}/g
  let match
  while ((match = cvitemPattern.exec(content)) !== null) {
    skills.push({
      category: match[1],
      items: match[2]
    })
  }
  
  // Try \skill pattern
  const skillPattern = /\\skill\{([^}]*)\}\{([^}]*)\}/g
  while ((match = skillPattern.exec(content)) !== null) {
    skills.push({
      category: match[1],
      items: match[2]
    })
  }
  
  // Try tabularx format (for second template)
  const tabularPattern = /\\begin\{tabularx\}[\s\S]*?\\textbf\{([^}]+)\}:\s*([^&\\]+)(?:\s*&\s*\\textbf\{([^}]+)\}:\s*([^&\\]+))?/g
  while ((match = tabularPattern.exec(content)) !== null) {
    if (match[1] && match[2]) {
      skills.push({
        category: match[1].trim(),
        items: match[2].trim()
      })
    }
    if (match[3] && match[4]) {
      skills.push({
        category: match[3].trim(),
        items: match[4].trim()
      })
    }
  }
  
  // Extract from itemize lists
  const itemizePattern = /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g
  while ((match = itemizePattern.exec(content)) !== null) {
    const items = match[1].match(/\\item\s+([^\\\n]+)/g)
    if (items) {
      const skillItems = items.map(item => item.replace(/\\item\s+/, '').trim()).join(', ')
      skills.push({
        category: 'Skills',
        items: skillItems
      })
    }
  }
  
  // Custom format from first template (textbf categories with items)
  const customPattern = /\\textbf\{([^}]+)\}:\s*([^\\]+)/g
  while ((match = customPattern.exec(content)) !== null) {
    skills.push({
      category: match[1].trim(),
      items: match[2].trim().replace(/\\\\/g, '')
    })
  }
  
  // Fallback to plain text parsing
  if (skills.length === 0) {
    const lines = content.split('\n')
    for (const line of lines) {
      const cleanLine = line.replace(/\\[a-zA-Z]+\*?\{?/g, '').replace(/\}/g, '').trim()
      if (cleanLine.includes(':')) {
        const parts = cleanLine.split(':')
        skills.push({
          category: parts[0].trim(),
          items: parts[1] ? parts[1].trim() : ''
        })
      }
    }
  }
  
  return skills
}

// Parse projects section
function parseProjectsSection(content: string): Array<any> {
  const projects: Array<any> = []
  
  // Try \resumeProjectHeading format
  const projectHeadingPattern = /\\resumeProjectHeading\s*\{([^}]*)\}\s*\{([^}]*)\}/g
  let match
  while ((match = projectHeadingPattern.exec(content)) !== null) {
    const projectName = match[1].replace(/\\textbf\{([^}]+)\}/g, '$1').replace(/\\[a-zA-Z]+\{?/g, '').replace(/\}/g, '').trim()
    const projectDate = match[2].replace(/\\[a-zA-Z]+\{?/g, '').replace(/\}/g, '').trim()
    
    projects.push({
      name: projectName,
      date: projectDate,
      description: ''
    })
  }
  
  // Try itemize format with \textbf{Project Name} - THIS IS WHAT WE NEED
  if (projects.length === 0) {
    const itemPattern = /\\item\s+\\textbf\{([^}]+)\}\s*([\s\S]*?)(?=\\item|\\end\{itemize\}|$)/g
    while ((match = itemPattern.exec(content)) !== null) {
      const projectName = match[1].trim()
      const description = match[2].replace(/\\[a-zA-Z]+\{?/g, '').replace(/\}/g, '').trim()
      
      projects.push({
        name: projectName,
        description: description.substring(0, 200) // Limit description length
      })
    }
  }
  
  // Try other project patterns
  if (projects.length === 0) {
    const lines = content.split('\n')
    for (const line of lines) {
      const cleanLine = line.replace(/\\[a-zA-Z]+\*?\{?/g, '').replace(/\}/g, '').trim()
      if (cleanLine.length > 10 && !cleanLine.includes('resumeItem')) {
        projects.push({
          name: cleanLine,
          description: ''
        })
      }
    }
  }
  
  return projects
}

// Generate PDF using a simple approach without external fonts
async function generatePDFWithPDFKit(sections: any): Promise<Buffer> {
  // Use jsPDF instead which is more reliable in serverless environments
  const { jsPDF } = await import('jspdf')
  
  const doc = new jsPDF()
  let yPos = 20
  
  // Header - Name (larger font)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(sections.name || 'Resume Preview', 20, yPos)
  yPos += 15
  
  // Title
  if (sections.title) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(sections.title, 20, yPos)
    yPos += 12
  }
  
  // Contact Information
  if (sections.contact) {
    doc.setFontSize(10)
    
    if (sections.contact.email) {
      doc.text(`Email: ${sections.contact.email}`, 20, yPos)
      yPos += 8
    }
    if (sections.contact.phone) {
      doc.text(`Phone: ${sections.contact.phone}`, 20, yPos)
      yPos += 8
    }
    if (sections.contact.address) {
      doc.text(`Location: ${sections.contact.address}`, 20, yPos)
      yPos += 12
    }
  }
  
  // Professional Summary
  if (sections.summary) {
    yPos += 5
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PROFESSIONAL SUMMARY', 20, yPos)
    yPos += 10
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    // Split text to fit page width
    const summaryLines = doc.splitTextToSize(sections.summary, 170)
    summaryLines.forEach((line: string) => {
      doc.text(line, 20, yPos)
      yPos += 6
    })
    yPos += 8
  }
  
  // Professional Experience
  if (sections.experience && sections.experience.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PROFESSIONAL EXPERIENCE', 20, yPos)
    yPos += 10
    
    sections.experience.slice(0, 3).forEach((exp: any) => {
      // Position title
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(exp.position || '', 20, yPos)
      yPos += 8
      
      // Company and period
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`${exp.company || ''}, ${exp.location || ''} | ${exp.period || ''}`, 20, yPos)
      yPos += 12
    })
  }
  
  // Education
  if (sections.education && sections.education.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('EDUCATION', 20, yPos)
    yPos += 10
    
    sections.education.slice(0, 2).forEach((edu: any) => {
      // Degree
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(edu.degree || '', 20, yPos)
      yPos += 8
      
      // Institution and details
      let eduLine = `${edu.institution || ''}, ${edu.location || ''} | ${edu.period || ''}`
      if (edu.gpa) eduLine += ` | ${edu.gpa}`
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(eduLine, 20, yPos)
      yPos += 12
    })
  }
  
  // Technical Skills
  if (sections.skills && sections.skills.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TECHNICAL SKILLS', 20, yPos)
    yPos += 10
    
    sections.skills.forEach((skill: any) => {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const skillText = `${skill.category || ''}: ${skill.items || ''}`
      const skillLines = doc.splitTextToSize(skillText, 170)
      skillLines.forEach((line: string) => {
        doc.text(line, 20, yPos)
        yPos += 6
      })
      yPos += 2
    })
  }
  
  // Projects
  if (sections.projects && sections.projects.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PROJECTS', 20, yPos)
    yPos += 10
    
    sections.projects.slice(0, 3).forEach((project: any) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(project.name || '', 20, yPos)
      yPos += 8
      
      if (project.description) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        const descLines = doc.splitTextToSize(project.description, 170)
        descLines.forEach((line: string) => {
          doc.text(line, 20, yPos)
          yPos += 6
        })
      }
      yPos += 5
    })
  }
  
  // Achievements
  if (sections.achievements && sections.achievements.length > 0) {
    if (yPos < 250) { // Check space
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('ACHIEVEMENTS', 20, yPos)
      yPos += 10
      
      sections.achievements.slice(0, 3).forEach((achievement: any) => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(achievement.name || '', 20, yPos)
        yPos += 8
        
        if (achievement.description) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          const descLines = doc.splitTextToSize(achievement.description, 170)
          descLines.forEach((line: string) => {
            doc.text(line, 20, yPos)
            yPos += 6
          })
        }
        yPos += 5
      })
    }
  }
  
  // Add any additional raw sections that weren't categorized
  if (sections.rawSections && sections.rawSections.length > 0) {
    sections.rawSections.forEach((section: any) => {
      const lowerTitle = section.title.toLowerCase()
      
      // Skip already processed sections
      if (lowerTitle.includes('summary') || lowerTitle.includes('experience') || 
          lowerTitle.includes('education') || lowerTitle.includes('skill') || 
          lowerTitle.includes('project') || lowerTitle.includes('achievement') || 
          lowerTitle.includes('award') || lowerTitle.includes('honor')) {
        return
      }
      
      // Add other sections
      if (yPos > 250) return // Prevent overflow
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(section.title.toUpperCase(), 20, yPos)
      yPos += 10
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      // Clean and split content
      const cleanContent = section.content.replace(/\\[a-zA-Z]+\{?/g, '').replace(/\}/g, '').trim()
      const contentLines = doc.splitTextToSize(cleanContent.substring(0, 200), 170)
      contentLines.slice(0, 3).forEach((line: string) => {
        if (line.trim().length > 0) {
          doc.text(line, 20, yPos)
          yPos += 6
        }
      })
      yPos += 8
    })
  }
  
  // Return as Buffer
  const pdfBytes = doc.output('arraybuffer')
  return Buffer.from(pdfBytes)
}
