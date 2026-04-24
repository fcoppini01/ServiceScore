'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loading } from "@/components/loading"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Session checked, stop loading (regardless of session state)
      setLoading(false)
    }).catch((error) => {
      console.error("Session check failed:", error)
      // Even on error, stop loading to avoid infinite loop
      setLoading(false)
    })

    // Listen for auth changes - but don't change loading state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      // We could update some user state here if needed
      // but we don't touch loading state to avoid infinite loading
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Loading />

  return <>{children}</>
}
