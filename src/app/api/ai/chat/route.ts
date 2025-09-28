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

    // Get Gemini 2.5 Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
- Use \\section{}, \\textbf{}, \\hfill for formatting

LATEX TEMPLATE STRUCTURE (ARTICLE CLASS):
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

% Header - ONLY if user provided name
% \\begin{center}
% {\\LARGE\\textbf{User Provided Name}}\\\\[4pt]
% {\\large User Provided Title}\\\\[8pt]
% Email: user@email.com $\\mid$ Phone: +1 (555) 123-4567
% \\end{center}

% Sections only if user provided content:
% \\section{Professional Summary}
% \\section{Education}
% \\section{Experience}
% \\section{Technical Skills}
% \\section{Projects}

\\end{document}

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
