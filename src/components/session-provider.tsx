'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loading } from "@/components/loading"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Loading />

  return <>{children}</>
}
