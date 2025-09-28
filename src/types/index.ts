export type TemplateType = 'modern' | 'academic' | 'creative'

export interface Resume {
  id: string
  user_id: string
  title: string
  template_type: TemplateType
  latex_content: string
  pdf_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ResumeData {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    website?: string
    linkedin?: string
    github?: string
  }
  summary: string
  experience: Array<{
    id: string
    company: string
    position: string
    location: string
    startDate: string
    endDate: string
    current: boolean
    description: string[]
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    field: string
    location: string
    startDate: string
    endDate: string
    gpa?: string
    honors?: string[]
  }>
  skills: Array<{
    id: string
    category: string
    items: string[]
  }>
  projects: Array<{
    id: string
    name: string
    description: string
    technologies: string[]
    url?: string
    github?: string
    startDate: string
    endDate?: string
  }>
  certifications: Array<{
    id: string
    name: string
    issuer: string
    date: string
    url?: string
  }>
  publications: Array<{
    id: string
    title: string
    authors: string[]
    venue: string
    date: string
    url?: string
  }>
}

export interface CompilationResult {
  success: boolean
  pdfBuffer?: number[]
  errors?: string[]
  warnings?: string[]
  logs?: string[]
}

export interface AIGenerationRequest {
  resumeData: Partial<ResumeData>
  templateType: TemplateType
  customInstructions?: string
}

export interface EditorState {
  content: string
  cursorPosition: number
  selection: {
    start: number
    end: number
  }
  isDirty: boolean
  lastSaved: string | null
}

export interface PDFViewerState {
  scale: number
  pageNumber: number
  totalPages: number
  isLoading: boolean
  error: string | null
}
