import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { TemplateType, ResumeData } from '@/types'
import { getTemplateContent, compileTemplate } from '@/lib/templates'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { resumeData, templateType, customInstructions } = await request.json()

    if (!resumeData) {
      return NextResponse.json(
        { success: false, error: 'Resume data is required' },
        { status: 400 }
      )
    }

    // Get the AI model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Create the prompt for resume generation
    const prompt = createResumePrompt(resumeData, templateType, customInstructions)

    try {
      // Generate content with Gemini
      const result = await model.generateContent(prompt)
      const response = await result.response
      const generatedContent = response.text()

      // Parse the AI response to extract resume data
      const enhancedResumeData = parseAIResponse(generatedContent, resumeData)

      // Get the template and compile it
      const templateContent = await getTemplateContent(templateType || 'modern')
      const compiledLatex = compileTemplate(templateContent, enhancedResumeData)

      return NextResponse.json({
        success: true,
        resumeData: enhancedResumeData,
        latexContent: compiledLatex,
        aiSuggestions: extractSuggestions(generatedContent)
      })

    } catch (aiError) {
      console.error('AI generation error:', aiError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to generate resume content with AI',
          details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Resume generation API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during resume generation' 
      },
      { status: 500 }
    )
  }
}

function createResumePrompt(
  resumeData: Partial<ResumeData>, 
  templateType: TemplateType = 'modern',
  customInstructions?: string
): string {
  const templateDescriptions = {
    modern: 'a clean, contemporary design perfect for tech and business professionals with ATS-friendly formatting',
    academic: 'a traditional academic format ideal for researchers and educators with publication sections',
    creative: 'a stylish, modern design with visual elements for creative professionals'
  }

  return `You are a professional resume writer and career coach. Help enhance and optimize the following resume data for ${templateDescriptions[templateType]}.

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

TEMPLATE TYPE: ${templateType}

CUSTOM INSTRUCTIONS: ${customInstructions || 'None'}

Please provide enhanced resume content following these guidelines:

1. **Personal Information**: Keep existing contact details but suggest improvements to professional summary/title if needed.

2. **Professional Summary**: Create a compelling 2-3 sentence summary that highlights key strengths, years of experience, and career focus. Make it specific and impactful.

3. **Experience**: 
   - Enhance job descriptions with strong action verbs
   - Quantify achievements with specific metrics where possible
   - Focus on results and impact, not just duties
   - Use the STAR method (Situation, Task, Action, Result) for bullet points
   - Tailor content to be relevant for the target role

4. **Skills**: 
   - Organize technical skills by category (Programming Languages, Frameworks, Tools, etc.)
   - Include both hard and soft skills relevant to the field
   - Prioritize skills based on industry demand and relevance

5. **Education**: 
   - Include relevant coursework, honors, and achievements
   - Add GPA if 3.5 or higher
   - Include relevant certifications

6. **Projects** (if applicable):
   - Focus on projects that demonstrate relevant skills
   - Include technologies used and quantifiable results
   - Provide brief but compelling descriptions

7. **Additional Sections**: Suggest relevant additional sections like certifications, publications, volunteer work, or languages if appropriate.

IMPORTANT: Return your response in the following JSON format:

\`\`\`json
{
  "personalInfo": {
    "fullName": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "website": "...",
    "linkedin": "...",
    "github": "..."
  },
  "summary": "Enhanced professional summary here...",
  "experience": [
    {
      "id": "1",
      "company": "...",
      "position": "...",
      "location": "...",
      "startDate": "...",
      "endDate": "...",
      "current": false,
      "description": [
        "Enhanced bullet point 1 with metrics",
        "Enhanced bullet point 2 with impact",
        "Enhanced bullet point 3 with results"
      ]
    }
  ],
  "education": [...],
  "skills": [...],
  "projects": [...],
  "certifications": [...],
  "suggestions": [
    "Specific suggestion 1 for improvement",
    "Specific suggestion 2 for optimization",
    "Specific suggestion 3 for enhancement"
  ]
}
\`\`\`

Focus on making the resume compelling, professional, and tailored for the ${templateType} template style. Ensure all content is truthful and based on the provided information, only enhancing the presentation and impact of existing experiences.`
}

function parseAIResponse(aiResponse: string, originalData: Partial<ResumeData>): ResumeData {
  try {
    // Extract JSON from the AI response
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[1])
      
      // Merge with original data, prioritizing AI enhancements
      return {
        personalInfo: { ...originalData.personalInfo, ...parsedData.personalInfo },
        summary: parsedData.summary || originalData.summary || '',
        experience: parsedData.experience || originalData.experience || [],
        education: parsedData.education || originalData.education || [],
        skills: parsedData.skills || originalData.skills || [],
        projects: parsedData.projects || originalData.projects || [],
        certifications: parsedData.certifications || originalData.certifications || [],
        publications: originalData.publications || []
      }
    }
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError)
  }

  // Fallback to original data if parsing fails
  return {
    personalInfo: originalData.personalInfo || {
      fullName: '',
      email: '',
      phone: '',
      location: ''
    },
    summary: originalData.summary || '',
    experience: originalData.experience || [],
    education: originalData.education || [],
    skills: originalData.skills || [],
    projects: originalData.projects || [],
    certifications: originalData.certifications || [],
    publications: originalData.publications || []
  }
}

function extractSuggestions(aiResponse: string): string[] {
  try {
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[1])
      return parsedData.suggestions || []
    }
  } catch (error) {
    console.error('Failed to extract suggestions:', error)
  }

  // Fallback: extract suggestions from text
  const suggestions: string[] = []
  const lines = aiResponse.split('\n')
  
  for (const line of lines) {
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      suggestions.push(line.trim().substring(2))
    }
  }

  return suggestions.slice(0, 5) // Limit to 5 suggestions
}
