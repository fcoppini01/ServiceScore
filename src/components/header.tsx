'use client'

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg text-primary">
            01ServiceScore
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/soci" className="text-sm font-medium transition-colors hover:text-primary">
                Soci
              </Link>
              <Link href="/attivita" className="text-sm font-medium transition-colors hover:text-primary">
                Attività
              </Link>
              <Link href="/officer" className="text-sm font-medium transition-colors hover:text-primary">
                Officer
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            user ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Esci
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm">Accedi</Button>
              </Link>
            )
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
