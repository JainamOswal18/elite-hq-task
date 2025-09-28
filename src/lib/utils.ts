import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function validateLatex(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Basic LaTeX validation
  const openBraces = (content.match(/\{/g) || []).length
  const closeBraces = (content.match(/\}/g) || []).length
  
  if (openBraces !== closeBraces) {
    errors.push('Mismatched braces: ' + Math.abs(openBraces - closeBraces) + ' unmatched')
  }
  
  // Check for required document structure
  if (!content.includes('\\documentclass')) {
    errors.push('Missing \\documentclass declaration')
  }
  
  if (!content.includes('\\begin{document}')) {
    errors.push('Missing \\begin{document}')
  }
  
  if (!content.includes('\\end{document}')) {
    errors.push('Missing \\end{document}')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
