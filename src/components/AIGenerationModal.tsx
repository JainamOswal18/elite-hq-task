'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Send, Loader2, Bot, User } from 'lucide-react'
import { TemplateType, ResumeData } from '@/types'
import { cn } from '@/lib/utils'

interface AIGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (latexContent: string) => void
  currentResumeData?: Partial<ResumeData>
  currentTemplate: TemplateType
  currentLatexContent?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

export function AIGenerationModal({
  isOpen,
  onClose,
  onGenerate,
  currentResumeData,
  currentTemplate,
  currentLatexContent
}: AIGenerationModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "👋 Hi! I'm your AI resume assistant. I'll help you create a professional LaTeX resume by understanding what you tell me.\n\n**I can help with:**\n• Personal information (name, contact details)\n• Education and qualifications\n• Work experience and projects\n• Technical skills and achievements\n• Professional summary\n\n**Just tell me naturally** - like \"I'm John Smith, a software engineer with 3 years experience in React and Python\"\n\nI'll only include information you actually provide (no fake placeholder data). What would you like to start with?",
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isOpen) return null

  const handleSendMessage = async () => {
    const userMessage = inputText.trim()
    if (!userMessage || isGenerating) return

    // Add user message
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMessage])
    setInputText('')
    setIsGenerating(true)

    try {
      // Simulate AI processing for now (replace with actual AI API call)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate contextual LaTeX based on user input, current content, and chat history
      const latexContent = generateContextualLatexFromText(userMessage, currentLatexContent, messages)
      
      // Generate intelligent, contextual AI response
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateIntelligentResponse(userMessage, currentLatexContent, messages),
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiResponse])
      
      // Generate the LaTeX and send it to the editor
      onGenerate(latexContent)
    } catch (error) {
      console.error('AI generation error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, there was an error generating your resume. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClose = () => {
    setMessages([messages[0]]) // Keep only the initial message
    setInputText('')
    onClose()
  }

  // Generate intelligent, contextual AI responses
  const generateIntelligentResponse = (userMessage: string, currentContent: string | undefined, chatHistory: ChatMessage[]): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Handle greetings and casual messages
    if (lowerMessage.match(/^(hey|hi|hello|yo)$/)) {
      return "Hi there! I'm ready to help you create your resume. To get started, you can tell me:\n\n• Your name and current role/studies\n• Your skills and technologies\n• Your work experience or projects\n• Your education background\n\nWhat would you like to add first?"
    }
    
    if (lowerMessage.includes('who am i') || lowerMessage.includes('who are you')) {
      return "I'm your AI resume assistant! I help you create professional LaTeX resumes by understanding your background and generating tailored content. I can remember our conversation and build upon previous information you've shared. What would you like to add to your resume?"
    }
    
    // Handle questions about capabilities
    if (lowerMessage.includes('what can you do') || lowerMessage.includes('help')) {
      return "I can help you create a professional resume by:\n\n✅ Generating LaTeX code from your descriptions\n✅ Remembering our conversation context\n✅ Adding sections like education, skills, projects\n✅ Formatting your experience professionally\n✅ Only including information you actually provide\n\nJust tell me about yourself and I'll build your resume!"
    }
    
    // Analyze what the user provided
    const providedInfo = analyzeUserInput(userMessage)
    
    // Check if this is an update to existing content
    const isUpdate = currentContent && currentContent.trim()
    
    if (isUpdate) {
      return generateUpdateResponse(userMessage, providedInfo)
    } else {
      return generateNewContentResponse(userMessage, providedInfo)
    }
  }

  // Analyze what information the user provided
  const analyzeUserInput = (text: string) => {
    const lowerText = text.toLowerCase()
    const info = {
      name: !!extractName(text),
      email: !!extractEmailAddress(text),
      phone: !!extractPhone(text),
      education: extractEducation(text).length > 0,
      skills: extractSkills(text).length > 0,
      projects: extractProjects(text).length > 0,
      achievements: extractAchievements(text).length > 0,
      experience: lowerText.includes('experience') || lowerText.includes('worked') || lowerText.includes('job'),
      student: lowerText.includes('student') || lowerText.includes('b.tech') || lowerText.includes('bachelor')
    }
    return info
  }

  // Generate response for new content
  const generateNewContentResponse = (userMessage: string, providedInfo: any): string => {
    const addedSections = []
    if (providedInfo.name) addedSections.push('your name')
    if (providedInfo.education) addedSections.push('education details')
    if (providedInfo.skills) addedSections.push('technical skills')
    if (providedInfo.projects) addedSections.push('project experience')
    if (providedInfo.achievements) addedSections.push('achievements')
    if (providedInfo.email) addedSections.push('email contact')
    if (providedInfo.phone) addedSections.push('phone number')
    
    if (addedSections.length === 0) {
      return "I'd love to help, but I need more specific information about you. Could you tell me things like:\n\n• Your name and role\n• Your skills (e.g., \"I know React, Python\")\n• Your education or work experience\n• Projects you've worked on\n\nThe more details you provide, the better resume I can create!"
    }
    
    let response = `Great! I've created your resume with ${addedSections.join(', ')}. `
    
    // Suggest what to add next
    const suggestions = []
    if (!providedInfo.name) suggestions.push('your name')
    if (!providedInfo.skills) suggestions.push('technical skills')
    if (!providedInfo.education && !providedInfo.experience) suggestions.push('education or work experience')
    if (!providedInfo.email) suggestions.push('contact email')
    if (!providedInfo.projects) suggestions.push('projects you\'ve worked on')
    
    if (suggestions.length > 0) {
      response += `\n\nTo make it even better, you could add ${suggestions.slice(0, 2).join(' and ')}. What else would you like to include?`
    } else {
      response += `\n\nYour resume looks comprehensive! You can ask me to modify any section or add more details.`
    }
    
    return response
  }

  // Generate response for content updates
  const generateUpdateResponse = (userMessage: string, providedInfo: any): string => {
    const updatedSections = []
    if (providedInfo.skills) updatedSections.push('skills')
    if (providedInfo.projects) updatedSections.push('projects')
    if (providedInfo.education) updatedSections.push('education')
    if (providedInfo.email || providedInfo.phone) updatedSections.push('contact info')
    if (providedInfo.achievements) updatedSections.push('achievements')
    
    if (updatedSections.length > 0) {
      return `Perfect! I've updated your resume with the new ${updatedSections.join(' and ')} information. The changes should be visible in the editor now.\n\nAnything else you'd like to add or modify?`
    } else {
      return "I understand you want to make changes, but could you be more specific? For example:\n\n• \"Add my email: john@example.com\"\n• \"I also know JavaScript and Python\"\n• \"Add my project: AI Resume Builder\"\n\nWhat would you like to update?"
    }
  }

  // Enhanced contextual LaTeX generation function
  const generateContextualLatexFromText = (text: string, currentContent: string | undefined, chatHistory: ChatMessage[]): string => {
    // Extract information from user input and chat history
    const info = parseUserInputWithContext(text, currentContent, chatHistory)
    
    // If we have existing content, try to update it intelligently
    if (currentContent && currentContent.trim()) {
      return updateExistingLatexContent(currentContent, info, text)
    }
    
    // Generate new LaTeX document with only user-provided information
    return generateNewLatexDocument(info)
  }

  // Generate new LaTeX document with only mentioned information
  const generateNewLatexDocument = (info: any): string => {
    // If user provided nothing meaningful, return minimal template
    const hasAnyContent = info.firstName || info.education?.length > 0 || info.skills?.length > 0 || 
                         info.projects?.length > 0 || info.achievements?.length > 0 || 
                         info.email || info.phone || info.summary
    
    if (!hasAnyContent) {
      return `% Minimal LaTeX Template - Add your information
\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}
\\usepackage[scale=0.75]{geometry}

% Add your information here
% \\name{Your}{Name}
% \\email{your@email.com}
% \\phone[mobile]{your-phone}

\\begin{document}
% \\makecvtitle

% Add sections as you provide information

\\end{document}`
    }
    
    let latex = `% AI Generated Resume - Only User-Provided Content
\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}
\\usepackage[scale=0.75]{geometry}

`
    
    // Only include name if actually extracted (not placeholder)
    if (info.firstName && info.firstName !== 'Your' && info.firstName !== null) {
      const lastName = (info.lastName && info.lastName !== 'Name' && info.lastName !== null) ? info.lastName : ''
      latex += `\\name{${info.firstName}}{${lastName}}\n`
    }
    
    // Only include title if user provided meaningful title
    if (info.title && info.title !== 'IT Professional') {
      latex += `\\title{${info.title}}\n`
    }
    
    // Only include contact info that was actually mentioned by user
    if (info.address && info.address !== null) {
      const city = info.city || ''
      const country = info.country || ''
      latex += `\\address{${info.address}}{${city}}{${country}}\n`
    }
    if (info.phone && info.phone !== null) latex += `\\phone[mobile]{${info.phone}}\n`
    if (info.email && info.email !== null) latex += `\\email{${info.email}}\n`
    if (info.linkedin && info.linkedin !== null) latex += `\\social[linkedin]{${info.linkedin}}\n`
    if (info.github && info.github !== null) latex += `\\social[github]{${info.github}}\n`
    
    latex += `
\\begin{document}
\\makecvtitle

`
    
    // Only include sections that have actual content
    if (info.summary && info.summary !== null) {
      latex += `\\section{Professional Summary}
${info.summary}

`
    }
    
    if (info.education && info.education.length > 0) {
      latex += `\\section{Education}
${info.education.map((edu: any) => 
        `\\cventry{${edu.period || ''}}{${edu.degree || ''}}{${edu.institution || ''}}{${edu.location || ''}}{${edu.gpa || ''}}{${edu.details || ''}}`
      ).join('\n')}

`
    }
    
    if (info.experience && info.experience.length > 0) {
      latex += `\\section{Experience}
${info.experience.map((exp: any) => 
        `\\cventry{${exp.period || ''}}{${exp.position || ''}}{${exp.company || ''}}{${exp.location || ''}}{}{
\\begin{itemize}
${exp.achievements.map((achievement: string) => `\\item ${achievement}`).join('\n')}
\\end{itemize}}`
      ).join('\n\n')}

`
    }
    
    if (info.projects && info.projects.length > 0) {
      latex += `\\section{Projects}
${info.projects.map((project: any) => 
        `\\cventry{${project.period || ''}}{${project.name || ''}}{${project.tech || ''}}{}{}{
\\begin{itemize}
${project.achievements.map((achievement: string) => `\\item ${achievement}`).join('\n')}
\\end{itemize}}`
      ).join('\n\n')}

`
    }
    
    if (info.skills && info.skills.length > 0) {
      latex += `\\section{Technical Skills}
${info.skills.map((skillCategory: any) => 
        `\\cvitem{${skillCategory.category}}{${skillCategory.items.join(', ')}}`
      ).join('\n')}

`
    }
    
    if (info.achievements && info.achievements.length > 0) {
      latex += `\\section{Achievements \\& Hackathons}
${info.achievements.map((achievement: any) => `\\cvitem{${achievement.year}}{${achievement.description}}`).join('\n')}

`
    }
    
    latex += `\\end{document}`
    return latex
  }

  // Update existing LaTeX content based on user input
  const updateExistingLatexContent = (currentContent: string, info: any, userInput: string): string => {
    let updatedContent = currentContent
    
    // If user mentions new skills, add them
    if (info.skills && info.skills.length > 0) {
      const skillsSection = info.skills.map((skillCategory: any) => 
        `\\cvitem{${skillCategory.category}}{${skillCategory.items.join(', ')}}`
      ).join('\n')
      
      if (updatedContent.includes('\\section{Technical Skills}')) {
        // Update existing skills section
        updatedContent = updatedContent.replace(
          /\\section\{Technical Skills\}[\s\S]*?(?=\\section|\\end\{document\})/,
          `\\section{Technical Skills}\n${skillsSection}\n\n`
        )
      } else {
        // Add new skills section before \\end{document}
        updatedContent = updatedContent.replace(
          '\\end{document}',
          `\\section{Technical Skills}\n${skillsSection}\n\n\\end{document}`
        )
      }
    }
    
    // If user mentions new projects, add them
    if (info.projects && info.projects.length > 0) {
      const projectsSection = info.projects.map((project: any) => 
        `\\cventry{${project.period}}{${project.name}}{${project.tech}}{}{}{
\\begin{itemize}
${project.achievements.map((achievement: string) => `\\item ${achievement}`).join('\n')}
\\end{itemize}}`
      ).join('\n\n')
      
      if (updatedContent.includes('\\section{Projects}')) {
        // Update existing projects section
        updatedContent = updatedContent.replace(
          /\\section\{Projects\}[\s\S]*?(?=\\section|\\end\{document\})/,
          `\\section{Projects}\n${projectsSection}\n\n`
        )
      } else {
        // Add new projects section
        updatedContent = updatedContent.replace(
          '\\end{document}',
          `\\section{Projects}\n${projectsSection}\n\n\\end{document}`
        )
      }
    }
    
    // Update contact information if mentioned
    if (info.phone && info.phone !== '+91 XXXXX XXXXX') {
      if (updatedContent.includes('\\phone[mobile]')) {
        updatedContent = updatedContent.replace(/\\phone\[mobile\]\{[^}]*\}/, `\\phone[mobile]{${info.phone}}`)
      } else {
        updatedContent = updatedContent.replace('\\begin{document}', `\\phone[mobile]{${info.phone}}\n\n\\begin{document}`)
      }
    }
    
    if (info.email && info.email !== 'your.email@example.com') {
      if (updatedContent.includes('\\email')) {
        updatedContent = updatedContent.replace(/\\email\{[^}]*\}/, `\\email{${info.email}}`)
      } else {
        updatedContent = updatedContent.replace('\\begin{document}', `\\email{${info.email}}\n\n\\begin{document}`)
      }
    }
    
    return updatedContent
  }

  // Enhanced function to parse user input with context and chat history
  const parseUserInputWithContext = (text: string, currentContent: string | undefined, chatHistory: ChatMessage[]) => {
    // Combine current message with previous user messages for context
    const allUserMessages = chatHistory
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content)
      .join(' ')
    
    const combinedText = `${allUserMessages} ${text}`
    
    return parseUserInput(combinedText, currentContent)
  }

  // Function to intelligently parse user input (enhanced to avoid placeholder values)
  const parseUserInput = (text: string, currentContent?: string) => {
    const lowerText = text.toLowerCase()
    
    // Extract basic info
    const name = extractName(text) || { firstName: 'Your', lastName: 'Name' }
    const title = extractTitle(text)
    
    // Extract education
    const education = extractEducation(text)
    
    // Extract skills
    const skills = extractSkills(text)
    
    // Extract projects
    const projects = extractProjects(text)
    
    // Extract achievements/hackathons
    const achievements = extractAchievements(text)
    
    // Generate professional summary
    const summary = generateSummary(text, education, skills, achievements)
    
    return {
      firstName: name?.firstName && name.firstName !== 'Your' ? name.firstName : null,
      lastName: name?.lastName && name.lastName !== 'Name' ? name.lastName : null,
      title: title || null,
      address: extractAddress(text) || null,
      city: extractLocation(text) || null,
      country: extractCountry(text) || null,
      phone: extractPhone(text) || null, // Only include if actually found
      email: extractEmailAddress(text) || null, // Only include if actually found
      linkedin: extractLinkedIn(text) || null,
      github: extractGitHub(text) || null,
      summary: summary || null,
      education: education,
      experience: [] as Array<{
        period: string;
        position: string;
        company: string;
        location: string;
        achievements: string[];
      }>, // For students, focus on projects instead
      projects: projects,
      skills: skills,
      achievements: achievements
    }
  }

  // Helper functions for parsing
  const extractName = (text: string) => {
    // Try to extract name from common patterns
    const namePatterns = [
      /my name is (\w+)\s+(\w+)/i,
      /i am (\w+)\s+(\w+)/i,
      /i'm (\w+)\s+(\w+)/i
    ]
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern)
      if (match) {
        return { firstName: match[1], lastName: match[2] }
      }
    }
    return null
  }

  const extractTitle = (text: string) => {
    if (text.includes('student') || text.includes('B.Tech')) {
      return 'Information Technology Student'
    }
    if (text.includes('intern')) return 'Software Engineering Intern'
    if (text.includes('developer')) return 'Software Developer'
    if (text.includes('engineer')) return 'Software Engineer'
    return 'IT Professional'
  }

  const extractEducation = (text: string) => {
    const education = []
    
    // Look for B.Tech/degree information
    if (text.includes('B.Tech') || text.includes('Bachelor')) {
      const yearMatch = text.match(/(\w+)-year|year (\d+)|(\d{4})-(\d{4})/i)
      const collegeMatch = text.match(/at ([^.]+(?:college|university|institute)[^.]*)/i)
      const fieldMatch = text.match(/in ([^.]+)(?:at|from)/i) || text.match(/B\.Tech.*?in ([^.]+)/i)
      
      education.push({
        period: yearMatch ? (yearMatch[1] ? `${yearMatch[1]} Year` : `${yearMatch[2] || yearMatch[3]}-${yearMatch[4] || 'Present'}`) : '2023-2027',
        degree: 'Bachelor of Technology',
        institution: collegeMatch ? collegeMatch[1].trim() : 'Bharati Vidyapeeth College of Engineering',
        location: 'India',
        gpa: extractGPA(text),
        details: fieldMatch ? `Major: ${fieldMatch[1].trim()}` : 'Major: Information Technology'
      })
    }
    
    return education
  }

  const extractSkills = (text: string) => {
    const skillCategories: Array<{category: string, items: string[]}> = []
    
    // Programming languages and frameworks
    const programmingSkills: string[] = []
    const webSkills = ['React', 'Node.js', 'Express.js', 'HTML', 'CSS', 'JavaScript', 'TypeScript']
    const dbSkills = ['PostgreSQL', 'MySQL', 'MongoDB', 'Supabase']
    const otherSkills = ['Git', 'AWS', 'Docker', 'REST APIs']
    
    webSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        programmingSkills.push(skill)
      }
    })
    
    const databases: string[] = []
    dbSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        databases.push(skill)
      }
    })
    
    const tools: string[] = []
    otherSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        tools.push(skill)
      }
    })
    
    if (programmingSkills.length > 0) {
      skillCategories.push({ category: 'Programming \\& Frameworks', items: programmingSkills })
    }
    if (databases.length > 0) {
      skillCategories.push({ category: 'Databases', items: databases })
    }
    if (tools.length > 0) {
      skillCategories.push({ category: 'Tools \\& Technologies', items: tools })
    }
    
    return skillCategories
  }

  const extractProjects = (text: string) => {
    const projects = []
    
    // Look for mentioned projects
    if (text.includes('resume scoring')) {
      projects.push({
        name: 'AI-Powered Resume Scoring System',
        period: '2024',
        tech: 'React, Node.js, AI/ML',
        achievements: [
          'Developed intelligent resume analysis system using machine learning algorithms',
          'Implemented scoring metrics for skills matching and ATS optimization',
          'Built responsive frontend with React and secure backend with Node.js'
        ]
      })
    }
    
    if (text.includes('MediCheck') || text.includes('Chrome extension')) {
      projects.push({
        name: 'MediCheck - Healthcare Content Validator',
        period: '2024',
        tech: 'JavaScript, Chrome APIs, Web Scraping',
        achievements: [
          'Built Chrome extension for real-time healthcare content validation',
          'Implemented medical fact-checking algorithms with 90\\% accuracy',
          'Achieved 1000+ downloads with 4.5-star rating on Chrome Web Store'
        ]
      })
    }
    
    if (text.includes('BlogEasy') || text.includes('blogging platform')) {
      projects.push({
        name: 'BlogEasy - Modern Blogging Platform',
        period: '2024',
        tech: 'React, Node.js, PostgreSQL, Express.js',
        achievements: [
          'Developed full-stack blogging platform with user authentication',
          'Implemented rich text editor with markdown support and media uploads',
          'Optimized database queries resulting in 40\\% faster page load times'
        ]
      })
    }
    
    return projects
  }

  const extractAchievements = (text: string) => {
    const achievements = []
    
    if (text.includes('Smart India Hackathon')) {
      achievements.push({
        year: '2024',
        description: 'Participated in Smart India Hackathon 2024 - National level innovation competition'
      })
    }
    
    if (text.includes('100x Engineers') || text.includes('Buildathon')) {
      achievements.push({
        year: '2024',
        description: '100x Engineers Buildathon - Top 100 out of 3500+ participating teams'
      })
    }
    
    return achievements
  }

  const generateSummary = (text: string, education: any[], skills: any[], achievements: any[]) => {
    // Only generate summary if user provides substantial information
    const lowerText = text.toLowerCase()
    
    // Check if user actually provided meaningful content
    const hasEducation = education && education.length > 0
    const hasSkills = skills && skills.length > 0
    const hasAchievements = achievements && achievements.length > 0
    const hasExperience = lowerText.includes('experience') || lowerText.includes('worked') || lowerText.includes('developer') || lowerText.includes('engineer')
    
    // Only generate if user provided enough information
    if (!hasEducation && !hasSkills && !hasAchievements && !hasExperience) {
      return null // Don't generate generic summary
    }
    
    const isStudent = lowerText.includes('student') || lowerText.includes('b.tech') || lowerText.includes('bachelor')
    const targetCompanies = []
    
    if (lowerText.includes('amazon')) targetCompanies.push('Amazon')
    if (lowerText.includes('jpmorgan') || lowerText.includes('jp morgan')) targetCompanies.push('JPMorgan')
    if (lowerText.includes('google')) targetCompanies.push('Google')
    if (lowerText.includes('microsoft')) targetCompanies.push('Microsoft')
    
    let summary = ''
    
    if (isStudent && hasEducation) {
      summary = `Motivated ${education[0]?.degree || 'student'} with `
      if (hasSkills) {
        const mainSkills = skills.flatMap((cat: any) => cat.items).slice(0, 3).join(', ')
        summary += `experience in ${mainSkills}. `
      } else {
        summary += `strong academic background. `
      }
    } else if (hasExperience) {
      summary = 'Software professional with '
      if (hasSkills) {
        const mainSkills = skills.flatMap((cat: any) => cat.items).slice(0, 3).join(', ')
        summary += `expertise in ${mainSkills}. `
      } else {
        summary += 'proven technical experience. '
      }
    } else if (hasSkills) {
      const mainSkills = skills.flatMap((cat: any) => cat.items).slice(0, 3).join(', ')
      summary = `Technical professional proficient in ${mainSkills}. `
    } else {
      return null // Not enough info for meaningful summary
    }
    
    if (hasAchievements) {
      summary += `Demonstrated excellence through competitive programming and hackathon participation. `
    }
    
    if (targetCompanies.length > 0) {
      summary += `Seeking opportunities at ${targetCompanies.join(' or ')}.`
    }
    
    return summary.trim()
  }

  const extractAddress = (text: string) => {
    // Look for address patterns
    const addressPatterns = [
      /address:?\s*([^.]+)/i,
      /live in ([^.]+)/i,
      /based in ([^.]+)/i,
      /from ([^.]+)/i
    ]
    
    for (const pattern of addressPatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    return null
  }

  const extractPhone = (text: string) => {
    // Look for phone number patterns
    const phonePatterns = [
      /phone:?\s*([+\d\s\-()]+)/i,
      /mobile:?\s*([+\d\s\-()]+)/i,
      /contact:?\s*([+\d\s\-()]+)/i,
      /(\+91\s*\d{5}\s*\d{5})/i,
      /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/
    ]
    
    for (const pattern of phonePatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    return null
  }

  const extractEmailAddress = (text: string) => {
    // Look for email patterns
    const emailPatterns = [
      /email:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    ]
    
    for (const pattern of emailPatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    return null
  }

  const extractLocation = (text: string) => {
    // Look for city/location patterns
    const locationPatterns = [
      /city:?\s*([^.]+)/i,
      /location:?\s*([^.]+)/i,
      /based in ([^.]+)/i,
      /live in ([^.]+)/i
    ]
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    return null
  }

  const extractCountry = (text: string) => {
    if (text.includes('India') || text.includes('Indian')) return 'India'
    if (text.includes('USA') || text.includes('United States')) return 'USA'
    if (text.includes('Canada') || text.includes('Canadian')) return 'Canada'
    if (text.includes('UK') || text.includes('United Kingdom') || text.includes('Britain')) return 'UK'
    return null
  }

  const extractGPA = (text: string) => {
    const gpaMatch = text.match(/gpa:?\s*(\d+\.?\d*)/i) || text.match(/cgpa:?\s*(\d+\.?\d*)/i)
    return gpaMatch ? `CGPA: ${gpaMatch[1]}` : ''
  }

  const extractLinkedIn = (text: string) => {
    const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i)
    return linkedinMatch ? linkedinMatch[1] : null
  }

  const extractGitHub = (text: string) => {
    const githubMatch = text.match(/github\.com\/([a-zA-Z0-9-]+)/i)
    return githubMatch ? githubMatch[1] : null
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-neutral-200/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Resume Assistant
              </h2>
              <p className="text-sm text-neutral-600 font-medium">Chat with AI to generate your resume content</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-neutral-50/30 to-white">
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
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-neutral-600" />
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
                  'text-xs mt-2 flex items-center gap-1',
                  message.type === 'user' ? 'text-blue-100' : 'text-neutral-500'
                )}>
                  <span>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex gap-4 max-w-[85%] mr-auto animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200 flex items-center justify-center shadow-md">
                <Bot className="h-5 w-5 text-neutral-600" />
              </div>
              <div className="bg-white text-neutral-900 rounded-2xl p-4 border border-neutral-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-neutral-600 font-medium">AI is analyzing your input...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-neutral-100 bg-white rounded-b-2xl">
          <div className="p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Tell me about your experience, skills, or what you'd like on your resume..."
                  className="w-full resize-none border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-neutral-400 text-sm"
                  rows={3}
                  disabled={isGenerating}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isGenerating || !inputText.trim()}
                className={cn(
                  "px-4 py-3 rounded-xl transition-all shadow-md",
                  isGenerating || !inputText.trim() 
                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-200"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-neutral-500">
                Press Enter to send, Shift+Enter for new line
              </p>
              <div className="text-xs text-neutral-400">
                {inputText.length}/1000
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
