'use client'

import { useState } from 'react'
import { ResumeEditor } from '@/components/ResumeEditor'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { User, LogOut, Plus } from 'lucide-react'

function Header() {
  const { user, profile, signOut, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-neutral-900">Resume Pilot</h1>
            <div className="hidden md:flex items-center space-x-2 text-sm text-neutral-600">
              <span>Ctrl+S to save</span>
              <span>•</span>
              <span>Ctrl+E to export</span>
            </div>
          </div>
          
          {/* Auth section */}
          {loading ? (
            <div className="animate-pulse bg-neutral-200 rounded h-8 w-24"></div>
          ) : user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-neutral-500" />
                <span className="text-sm text-neutral-700">
                  {profile?.full_name || user.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Get Started
              </Button>
            </div>
          )}
        </div>
      </header>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </>
  )
}

export default function Home() {
  const handleSave = async (content: string) => {
    console.log('Saving content:', content)
    localStorage.setItem('resume-content', content)
  }

  const handleExport = (pdfData: ArrayBuffer | Uint8Array) => {
    const blob = new Blob([pdfData], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume-${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="h-[calc(100vh-64px)]">
        <ResumeEditor
          onSave={handleSave}
          onExport={handleExport}
        />
      </main>
    </div>
  )
}
