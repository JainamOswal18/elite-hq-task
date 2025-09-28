import { TemplateType, ResumeData } from '@/types'

// Template metadata
export const TEMPLATES = {
  modern: {
    id: 'modern' as TemplateType,
    name: 'Modern Professional',
    description: 'Clean, contemporary design perfect for tech and business professionals',
    preview: '/templates/modern-preview.png',
    features: ['ATS-friendly', 'Clean layout', 'Professional styling', 'Contact links']
  },
  academic: {
    id: 'academic' as TemplateType,
    name: 'Academic Classic',
    description: 'Traditional academic format ideal for researchers and educators',
    preview: '/templates/academic-preview.png',
    features: ['Publications section', 'Research focus', 'Traditional layout', 'Citation ready']
  },
  creative: {
    id: 'creative' as TemplateType,
    name: 'Creative Minimal',
    description: 'Stylish, modern design with visual elements for creative professionals',
    preview: '/templates/creative-preview.png',
    features: ['Visual elements', 'Color accents', 'Modern typography', 'Portfolio ready']
  }
}

// Load template content
export async function getTemplateContent(templateType: TemplateType): Promise<string> {
  try {
    const response = await fetch(`/api/templates/${templateType}`)
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`)
    }
    return await response.text()
  } catch (error) {
    console.error('Error loading template:', error)
    throw error
  }
}

// Simple template engine (Handlebars-like)
export function compileTemplate(template: string, data: Partial<ResumeData>): string {
  let compiled = template

  // Handle conditional blocks {{#if condition}}...{{/if}}
  compiled = compiled.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match: string, condition: string, content: string) => {
    const value = getNestedProperty(data, condition.trim())
    return value && (Array.isArray(value) ? value.length > 0 : true) ? content : ''
  })

  // Handle each loops {{#each array}}...{{/each}}
  compiled = compiled.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match: string, arrayPath: string, content: string) => {
    const array = getNestedProperty(data, arrayPath.trim())
    if (!Array.isArray(array)) return ''
    
    return array.map((item, index) => {
      let itemContent = content
      
      // Replace {{this}} with primitive values
      itemContent = itemContent.replace(/\{\{this\}\}/g, String(item))
      
      // Replace {{@index}} with current index
      itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index))
      
      // Replace {{@last}} with boolean
      itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === array.length - 1))
      
      // Handle nested properties within each loop
      itemContent = itemContent.replace(/\{\{([^}]+)\}\}/g, (propMatch: string, prop: string) => {
        if (prop.startsWith('@')) return propMatch // Skip special variables
        const value = getNestedProperty(item, prop.trim())
        return value !== undefined ? String(value) : ''
      })
      
      return itemContent
    }).join('')
  })

  // Handle unless blocks {{#unless condition}}...{{/unless}}
  compiled = compiled.replace(/\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match: string, condition: string, content: string) => {
    const value = getNestedProperty(data, condition.trim())
    return !value || (Array.isArray(value) && value.length === 0) ? content : ''
  })

  // Handle simple variable replacements {{variable}}
  compiled = compiled.replace(/\{\{([^}#/]+)\}\}/g, (match: string, path: string) => {
    const value = getNestedProperty(data, path.trim())
    return value !== undefined ? String(value) : ''
  })

  return compiled
}

// Helper function to get nested properties
function getNestedProperty(obj: unknown, path: string): unknown {
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current && typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }
  
  return current
}

// Generate sample data for template preview
export function generateSampleData(): ResumeData {
  return {
    personalInfo: {
      fullName: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      website: 'johndoe.dev',
      linkedin: 'johndoe',
      github: 'johndoe'
    },
    summary: 'Experienced software engineer with 5+ years of expertise in full-stack development, cloud architecture, and team leadership. Passionate about building scalable solutions and mentoring junior developers.',
    experience: [
      {
        id: '1',
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        startDate: '2022-01',
        endDate: '',
        current: true,
        description: [
          'Led development of microservices architecture serving 1M+ users',
          'Mentored team of 5 junior developers and improved code review process',
          'Implemented CI/CD pipeline reducing deployment time by 60%'
        ]
      },
      {
        id: '2',
        company: 'StartupXYZ',
        position: 'Full Stack Developer',
        location: 'Remote',
        startDate: '2020-03',
        endDate: '2021-12',
        current: false,
        description: [
          'Built responsive web applications using React and Node.js',
          'Designed and implemented RESTful APIs with 99.9% uptime',
          'Collaborated with design team to improve user experience'
        ]
      }
    ],
    education: [
      {
        id: '1',
        institution: 'University of California',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'Berkeley, CA',
        startDate: '2016-08',
        endDate: '2020-05',
        gpa: '3.8',
        honors: ['Summa Cum Laude', 'Dean\'s List']
      }
    ],
    skills: [
      {
        id: '1',
        category: 'Programming Languages',
        items: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go']
      },
      {
        id: '2',
        category: 'Frameworks & Libraries',
        items: ['React', 'Next.js', 'Node.js', 'Express', 'Django']
      },
      {
        id: '3',
        category: 'Tools & Technologies',
        items: ['Docker', 'AWS', 'PostgreSQL', 'Redis', 'Git']
      }
    ],
    projects: [
      {
        id: '1',
        name: 'E-commerce Platform',
        description: 'Full-stack e-commerce solution with real-time inventory management',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
        url: 'https://ecommerce-demo.com',
        github: 'https://github.com/johndoe/ecommerce',
        startDate: '2023-01',
        endDate: '2023-06'
      }
    ],
    certifications: [
      {
        id: '1',
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2023-03',
        url: 'https://aws.amazon.com/certification/'
      }
    ],
    publications: []
  }
}

// Validate template compilation
export function validateTemplate(template: string, data: Partial<ResumeData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  try {
    const compiled = compileTemplate(template, data)
    
    // Check for unresolved placeholders
    const unresolvedMatches = compiled.match(/\{\{[^}]+\}\}/g)
    if (unresolvedMatches) {
      errors.push(`Unresolved placeholders: ${unresolvedMatches.join(', ')}`)
    }
    
    // Basic LaTeX validation
    const openBraces = (compiled.match(/\{/g) || []).length
    const closeBraces = (compiled.match(/\}/g) || []).length
    
    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${Math.abs(openBraces - closeBraces)} unmatched`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    errors.push(`Template compilation error: ${error}`)
    return {
      isValid: false,
      errors
    }
  }
}
