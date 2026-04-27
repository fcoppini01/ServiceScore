'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [matricola, setMatricola] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  
  // Matricola is optional - if provided, user will be linked to socio after email confirmation

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback${matricola ? `?matricola=${encodeURIComponent(matricola)}` : ''}`,
        data: matricola ? { matricola_socio: matricola } : {}
      },
    })

    if (error) {
      // Mostra l'errore reale per debug
      setMessage('Errore: ' + error.message + ' (' + error.name + ')')
    } else if (data.user && data.user.identities?.length === 0) {
      setMessage('Utente già registrato ma non confermato. Controlla la tua email.')
    } else {
      setMessage('Registrazione completata! Controlla la tua email per confermare. ' + 
        (matricola ? `Dopo il login, verrai associato al socio ${matricola}` : 'Registrato come sviluppatore.'))
    }
    setLoading(false)
  }

  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8"
    >
      <Card className="w-full max-w-md border-2 hover:border-primary/30 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
            Registrati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 caratteri"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Matricola Socio <span className="text-muted-foreground">(opzionale)</span></label>
              <Input
                type="text"
                value={matricola}
                onChange={(e) => setMatricola(e.target.value)}
                placeholder="Es: 12345 - Lascia vuoto se non sei socio"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Inserisci la tua matricola per associare l'account al socio. Se sei sviluppatore, lascia vuoto.
              </p>
            </div>
            {message && (
              <p className={`text-sm ${message.includes('completata') || message.includes('confermata') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-[#0055ff] hover:from-[#0044cc] hover:to-[#0044cc]" disabled={loading}>
              {loading ? 'Registrazione...' : 'Registrati'}
            </Button>
          </form>
          <p className="text-center text-sm mt-4">
            Hai già un account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Accedi
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.main>
  )
}
