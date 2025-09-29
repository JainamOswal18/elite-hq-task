import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface ChatRequest {
  message: string
  chatHistory: ChatMessage[]
  currentLatexContent?: string
  resumeData?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory, currentLatexContent, resumeData }: ChatRequest = await request.json()

    // Get Gemini 2.5 Pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    // Build comprehensive context for the LLM
    const systemPrompt = `You are an expert LaTeX resume assistant. Your job is to:

1. ANALYZE user input and generate professional LaTeX resume code
2. REMEMBER conversation context and build upon previous information
3. ONLY include information the user actually provides (NO placeholder data)
4. Generate modern, professional LaTeX using moderncv class
5. Provide helpful, contextual responses to guide the user

CURRENT CONTEXT:
- Chat History: ${chatHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}
- Current LaTeX Content: ${currentLatexContent ? 'EXISTS' : 'NONE'}
- Resume Data: ${resumeData ? JSON.stringify(resumeData) : 'NONE'}

USER GUIDELINES:
- Extract ONLY real information provided by the user (names, skills, experience, etc.)
- NEVER include placeholder values like "FirstName", "email@domain.com", "phone-number"
- If user says "hey" or greetings, provide helpful guidance
- If insufficient information, ask for specific details
- Generate LaTeX using ARTICLE CLASS (not moderncv) for better compatibility
- STRICTLY follow the exact format patterns shown below - NO VARIATIONS ALLOWED

MANDATORY LATEX FORMAT - FOLLOW EXACTLY:
You MUST use these EXACT patterns for consistent parsing:

DOCUMENT STRUCTURE (REQUIRED):
\\documentclass[11pt,a4paper]{article}
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

HEADER FORMAT (if user provided name and contact):
\\begin{center}
{\\LARGE\\textbf{Full Name}}\\\\[4pt]
{\\large Job Title or Student Status}\\\\[8pt]
Email: user@email.com $\\mid$ Phone: +1 (555) 123-4567
\\end{center}

EDUCATION FORMAT (MUST use \\textbf{} \\hfill with \\\\ line breaks):
\\section{Education}
\\textbf{Degree Name} \\hfill Year Range\\\\
Institution Name, City, State\\\\
GPA: X.X (if provided)
\\begin{itemize}[leftmargin=20pt, topsep=0pt]
\\item Relevant coursework and achievements (if any details provided)
\\end{itemize}

SKILLS FORMAT (MUST use \\textbf{Category:} with \\\\ line breaks):
\\section{Technical Skills}
\\textbf{Programming:} React, Node.js, Express.js\\\\
\\textbf{Databases:} PostgreSQL, Supabase\\\\
\\textbf{Tools:} Git, Docker, AWS (if mentioned)

EXPERIENCE FORMAT (MUST use \\textbf{Title} \\hfill Dates\\\\):
\\section{Experience}
\\textbf{Job Title} \\hfill Date Range\\\\
Company Name, City, State
\\begin{itemize}[leftmargin=20pt, topsep=0pt]
\\item Achievement or responsibility description
\\item Another achievement with specific details
\\end{itemize}

PROJECTS FORMAT (MUST use \\begin{itemize}[leftmargin=20pt, topsep=0pt]):
\\section{Projects}
\\textbf{Project Name} \\hfill Date or Tech Stack\\\\
Brief project description
\\begin{itemize}[leftmargin=20pt, topsep=0pt]
\\item Specific achievement or technology used
\\item Impact or result achieved
\\end{itemize}

ACHIEVEMENTS FORMAT (same pattern as projects):
\\section{Achievements}
\\textbf{Achievement Title} \\hfill Date\\\\
Organization or Event Name
\\begin{itemize}[leftmargin=20pt, topsep=0pt]
\\item Specific details about the achievement
\\item Impact or recognition received
\\end{itemize}

\\end{document}

CRITICAL FORMAT REQUIREMENTS:
1. ALWAYS use \\textbf{Title} \\hfill Dates\\\\ format with proper line breaks
2. ALWAYS use \\textbf{Category:} with \\\\ line breaks for skills
3. ALWAYS use \\begin{itemize}[leftmargin=20pt, topsep=0pt] for all lists
4. ALWAYS include proper spacing with \\\\[4pt], \\\\[8pt] in headers
5. ALWAYS use $\\mid$ for separating contact information
6. NEVER use moderncv commands like \\cventry, \\cvitem, \\name{}, \\title{}
7. NEVER use different formatting patterns - match the sample format exactly

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object in this exact format:
{
  "aiResponse": "Your conversational response to the user (no code blocks or formatting)",
  "latexCode": "Complete LaTeX code (only if generating/updating resume)",
  "suggestions": ["Array of helpful suggestions for what to add next"],
  "extractedInfo": {
    "name": "extracted name or null",
    "email": "extracted email or null",
    "skills": ["array of skills mentioned"],
    "experience": "extracted experience or null"
  }
}

CRITICAL REQUIREMENTS:
- Do NOT wrap the JSON in markdown code blocks
- Do NOT include any text before or after the JSON
- Ensure all strings are properly escaped
- The aiResponse should be plain text without LaTeX code snippets
- NEVER INCLUDE PLACEHOLDER VALUES like "FirstName", "email@domain.com", "phone-number"
- ONLY generate LaTeX sections for information the user actually provided
- Use ARTICLE CLASS format, not moderncv
- If user hasn't provided name/contact, leave header section empty or commented out

ABSOLUTE FORMAT ENFORCEMENT:
- You MUST NEVER deviate from the exact LaTeX patterns shown above
- Use ONLY the specified \\textbf{}, \\hfill, and \\begin{itemize}[leftmargin=*] patterns
- Any variation in format will cause parsing failures
- Always use the exact same document structure, package imports, and formatting commands
- Double-check your LaTeX output matches the mandatory patterns exactly before responding

Current user message: "${message}"`

    // Generate response
    const result = await model.generateContent(systemPrompt)
    const responseText = result.response.text()

    // Try to parse as JSON, fallback to text response
    let parsedResponse
    try {
      // Clean the response text to extract JSON if wrapped
      let cleanedResponse = responseText.trim()
      
      // If response contains ```json, extract the JSON part
      const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        cleanedResponse = jsonMatch[1]
      }
      
      parsedResponse = JSON.parse(cleanedResponse)
    } catch (error) {
      console.log('Failed to parse AI response as JSON:', error)
      console.log('Raw response:', responseText)
      
      // If not JSON, create a structured response
      parsedResponse = {
        aiResponse: responseText,
        latexCode: null,
        suggestions: [],
        extractedInfo: {}
      }
    }

    return NextResponse.json(parsedResponse)

  } catch (error) {
    console.error('AI Chat Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process AI request',
        aiResponse: "I'm having trouble processing your request. Please try again or be more specific about what you'd like to add to your resume.",
        latexCode: null,
        suggestions: ["Try saying something like 'I'm a software engineer with React experience'"],
        extractedInfo: {}
      },
      { status: 500 }
    )
  }
}
