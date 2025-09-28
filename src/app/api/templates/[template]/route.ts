import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { TemplateType } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ template: string }> }
) {
  try {
    const { template } = await params
    
    // For AI integration focus, only return modern template for now
    // Template switching temporarily disabled
    const templateType = 'modern' // Force modern template
    
    // Validate template exists (keeping validation for future flexibility)
    if (!['modern', 'academic', 'creative'].includes(template as TemplateType)) {
      console.log(`Requested template: ${template}, serving modern template instead`)
    }

    // Read template file
    const templatePath = join(process.cwd(), 'src', 'templates', `${templateType}-professional.tex`)
    try {
      const content = await readFile(templatePath, 'utf-8')
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    } catch {
      // Fallback to inline template if file doesn't exist
      const fallbackContent = getFallbackTemplate(templateType)
      return new NextResponse(fallbackContent, {
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    }
  } catch (error) {
    console.error('Template API error:', error)
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    )
  }
}

function getFallbackTemplate(template: TemplateType): string {
  const templates = {
    modern: `% Modern Professional Resume Template
\\documentclass[11pt,a4paper,sans]{moderncv}

\\moderncvstyle{banking}
\\moderncvcolor{blue}

\\usepackage[utf8]{inputenc}
\\usepackage[scale=0.85]{geometry}

\\name{{{personalInfo.fullName}}}{}
\\title{{{personalInfo.title}}}
\\address{{{personalInfo.location}}}
\\phone[mobile]{{{personalInfo.phone}}}
\\email{{{personalInfo.email}}}
{{#if personalInfo.website}}
\\homepage{{{personalInfo.website}}}
{{/if}}
{{#if personalInfo.linkedin}}
\\social[linkedin]{{{personalInfo.linkedin}}}
{{/if}}
{{#if personalInfo.github}}
\\social[github]{{{personalInfo.github}}}
{{/if}}

\\begin{document}

\\makecvtitle

{{#if summary}}
\\section{Professional Summary}
\\cvitem{}{{{summary}}}
{{/if}}

{{#if experience}}
\\section{Professional Experience}
{{#each experience}}
\\cventry{{{startDate}}{{#unless current}}--{{endDate}}{{/unless}}{{#if current}}--Present{{/if}}}{{{position}}}{{{company}}}{{{location}}}{}
{
{{#each description}}
\\begin{itemize}
\\item {{this}}
\\end{itemize}
{{/each}}
}
{{/each}}
{{/if}}

{{#if education}}
\\section{Education}
{{#each education}}
\\cventry{{{startDate}}--{{endDate}}}{{{degree}} in {{field}}}{{{institution}}}{{{location}}}{{#if gpa}}{GPA: {{gpa}}}{{/if}}{}
{{#if honors}}
{
\\begin{itemize}
{{#each honors}}
\\item {{this}}
{{/each}}
\\end{itemize}
}
{{/if}}
{{/each}}
{{/if}}

{{#if skills}}
\\section{Technical Skills}
{{#each skills}}
\\cvitem{{{category}}}{{{items}}}
{{/each}}
{{/if}}

\\end{document}`,

    academic: `% Academic Classic Resume Template
\\documentclass[11pt,letterpaper]{article}

\\usepackage[left=0.75in,top=0.6in,right=0.75in,bottom=0.6in]{geometry}
\\usepackage{enumitem}
\\usepackage{fancyhdr}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{multicol}

\\definecolor{darkblue}{RGB}{0,100,200}
\\definecolor{lightgray}{RGB}{230,230,230}

\\hypersetup{
    colorlinks=true,
    linkcolor=darkblue,
    filecolor=darkblue,
    urlcolor=darkblue,
    citecolor=darkblue
}

\\titleformat{\\section}{\\Large\\bfseries\\color{darkblue}}{}{0em}{}[\\titlerule]
\\titleformat{\\subsection}{\\large\\bfseries}{}{0em}{}

\\pagestyle{empty}

\\newcommand{\\resitem}[1]{\\item #1 \\vspace{-2pt}}
\\newcommand{\\ressubheading}[4]{
\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
		\\textbf{#1} & #2 \\\\
		\\textit{#3} & \\textit{#4} \\\\
\\end{tabular*}\\vspace{-6pt}}

\\begin{document}

\\begin{center}
{\\LARGE \\textbf{{{personalInfo.fullName}}}}\\\\
\\vspace{5pt}
{{#if personalInfo.title}}
{\\large {{personalInfo.title}}}\\\\
\\vspace{3pt}
{{/if}}
{{personalInfo.location}} \\textbullet{} {{personalInfo.phone}} \\textbullet{} \\href{mailto:{{personalInfo.email}}}{{{personalInfo.email}}}\\\\
{{#if personalInfo.website}}
\\href{{{personalInfo.website}}}{{{personalInfo.website}}}{{#if personalInfo.linkedin}} \\textbullet{} {{/if}}
{{/if}}
{{#if personalInfo.linkedin}}
\\href{https://linkedin.com/in/{{personalInfo.linkedin}}}{LinkedIn: {{personalInfo.linkedin}}}
{{/if}}
\\end{center}

\\vspace{10pt}

{{#if summary}}
\\section{Research Interests}
{{summary}}
{{/if}}

{{#if education}}
\\section{Education}
{{#each education}}
\\ressubheading{{{institution}}}{{{location}}}{{{degree}} in {{field}}}{{{startDate}} -- {{endDate}}}
{{#if gpa}}
\\begin{itemize}
\\resitem{GPA: {{gpa}}}
{{#each honors}}
\\resitem{{{this}}}
{{/each}}
\\end{itemize}
{{else}}
{{#if honors}}
\\begin{itemize}
{{#each honors}}
\\resitem{{{this}}}
{{/each}}
\\end{itemize}
{{/if}}
{{/if}}
\\vspace{5pt}
{{/each}}
{{/if}}

{{#if experience}}
\\section{Research Experience}
{{#each experience}}
\\ressubheading{{{position}}}{{{startDate}}{{#unless current}} -- {{endDate}}{{/unless}}{{#if current}} -- Present{{/if}}}{{{company}}}{{{location}}}
\\begin{itemize}
{{#each description}}
\\resitem{{{this}}}
{{/each}}
\\end{itemize}
\\vspace{5pt}
{{/each}}
{{/if}}

{{#if skills}}
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0pt, itemindent=0pt]
{{#each skills}}
\\item \\textbf{{{category}}}: {{#each items}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}
\\end{itemize}
{{/if}}

{{#if projects}}
\\section{Projects}
{{#each projects}}
\\ressubheading{{{name}}}{{{startDate}}{{#if endDate}} -- {{endDate}}{{/if}}}{{{technologies}}}{{{url}}}
\\begin{itemize}
\\resitem{{{description}}}
\\end{itemize}
\\vspace{5pt}
{{/each}}
{{/if}}

\\end{document}`,

    creative: `% Creative Minimal Resume Template
\\documentclass[10pt,a4paper]{article}

\\usepackage[top=0.7in, bottom=0.7in, left=0.55in, right=0.85in]{geometry}
\\usepackage{graphicx}
\\usepackage{url}
\\usepackage{palatino}
\\usepackage{tabularx}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage[hidelinks]{hyperref}

\\definecolor{primary}{HTML}{14B8A6}
\\definecolor{secondary}{HTML}{64748B}
\\definecolor{accent}{HTML}{0EA5E9}
\\definecolor{text}{HTML}{1E293B}

\\pagenumbering{gobble}

\\newcommand{\\cvsection}[1]{%
  \\vspace{8pt}%
  {\\color{primary}\\Large\\bfseries #1}%
  \\vspace{2pt}%
  {\\color{primary}\\hrule height 1pt}%
  \\vspace{6pt}%
}

\\newcommand{\\cventry}[5]{%
  \\textbf{\\color{text}#1} \\hfill {\\color{secondary}\\small #2}\\\\%
  {\\color{accent}\\textit{#3}} \\hfill {\\color{secondary}\\small #4}\\\\%
  \\vspace{2pt}%
  #5%
  \\vspace{8pt}%
}

\\renewcommand{\\labelitemi}{{\\color{primary}\\textbullet}}

\\begin{document}

\\begin{center}
  {\\Huge\\bfseries\\color{text}{{personalInfo.fullName}}}\\\\[5pt]
  {{#if personalInfo.title}}
  {\\Large\\color{secondary}{{personalInfo.title}}}\\\\[8pt]
  {{/if}}
  
  {{personalInfo.phone}} \\textbullet{} 
  \\href{mailto:{{personalInfo.email}}}{{{personalInfo.email}}} \\textbullet{} 
  {{personalInfo.location}}\\\\[3pt]
  
  {{#if personalInfo.website}}
  \\href{{{personalInfo.website}}}{{{personalInfo.website}}}
  {{/if}}
  {{#if personalInfo.linkedin}}
  {{#if personalInfo.website}} \\textbullet{} {{/if}}
  \\href{https://linkedin.com/in/{{personalInfo.linkedin}}}{{{personalInfo.linkedin}}}
  {{/if}}
  {{#if personalInfo.github}}
  {{#if personalInfo.linkedin}} \\textbullet{} {{/if}}
  \\href{https://github.com/{{personalInfo.github}}}{{{personalInfo.github}}}
  {{/if}}
\\end{center}

\\vspace{15pt}

{{#if summary}}
\\cvsection{Profile}
{\\color{text}{{summary}}}
\\vspace{10pt}
{{/if}}

{{#if experience}}
\\cvsection{Experience}
{{#each experience}}
\\cventry{{{position}}}{{{startDate}}{{#unless current}} -- {{endDate}}{{/unless}}{{#if current}} -- Present{{/if}}}{{{company}}}{{{location}}}{}
{
\\begin{itemize}[leftmargin=15pt, itemsep=2pt]
{{#each description}}
\\item {\\color{text}{{this}}}
{{/each}}
\\end{itemize}
}
{{/each}}
{{/if}}

{{#if education}}
\\cvsection{Education}
{{#each education}}
\\cventry{{{degree}} in {{field}}}{{{startDate}} -- {{endDate}}}{{{institution}}}{{{location}}}{}
{
{{#if gpa}}GPA: {{gpa}}{{#if honors}}\\\\{{/if}}{{/if}}
{{#if honors}}
\\begin{itemize}[leftmargin=15pt, itemsep=2pt]
{{#each honors}}
\\item {\\color{text}{{this}}}
{{/each}}
\\end{itemize}
{{/if}}
}
{{/each}}
{{/if}}

{{#if skills}}
\\cvsection{Technical Skills}
\\begin{itemize}[leftmargin=0pt, itemindent=0pt, itemsep=2pt]
{{#each skills}}
\\item \\textbf{\\color{text}{{category}}}: {\\color{secondary}{{#each items}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}}
{{/each}}
\\end{itemize}
{{/if}}

{{#if projects}}
\\cvsection{Projects}
{{#each projects}}
\\cventry{{{name}}}{{{startDate}}{{#if endDate}} -- {{endDate}}{{/if}}}{{{technologies}}}{{{url}}}{}
{
{\\color{text}{{description}}}
}
{{/each}}
{{/if}}

\\end{document}`
  }

  return templates[template] || templates.modern
}