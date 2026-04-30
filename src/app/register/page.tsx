'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { GlowCard, FadeInUp, PulseGlow } from '@/lib/mac-effects'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [matricola, setMatricola] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const callbackUrl = new URL(`${location.origin}/auth/callback`)
    if (matricola) callbackUrl.searchParams.set('matricola', matricola)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callbackUrl.toString() }
    })

    if (error) {
      setMessage('Errore: ' + error.message)
    } else if (data.user && data.user.identities?.length === 0) {
      setMessage('Utente già registrato. Controlla la tua email.')
    } else {
      setMessage('Registrazione completata! Controlla la tua email per confermare.')
    }
    setLoading(false)
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
    >
      <PulseGlow className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px]" glowColor="#ffe500" />

      <FadeInUp>
        <GlowCard glowColor="#ffe500" className="w-full max-w-sm">
          <Card className="bg-background/80 backdrop-blur-xl border border-border/50 overflow-hidden">
            {/* Header section */}
            <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-border/40 bg-gradient-to-b from-yellow-500/5 to-transparent">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.15 }}
                className="mb-4"
              >
                <Image
                  src="/logo_ufficiale.png"
                  alt="Lions Club"
                  width={56}
                  height={56}
                  className="drop-shadow-md"
                />
              </motion.div>
              <motion.h1
                className="text-2xl font-bold bg-gradient-to-r from-primary via-[#0055ff] to-[#ffe500] bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                Registrati
              </motion.h1>
              <motion.p
                className="text-xs text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ServiceScore · Distretto 108 LA
              </motion.p>
            </div>

            <CardContent className="px-6 py-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-1.5"
                >
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@esempio.com"
                    required
                    autoComplete="email"
                    className="bg-background/50"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-1.5"
                >
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 caratteri"
                    minLength={6}
                    required
                    autoComplete="new-password"
                    className="bg-background/50"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-1.5"
                >
                  <label className="text-sm font-medium">
                    Matricola Socio{' '}
                    <span className="text-muted-foreground font-normal text-xs">(opzionale)</span>
                  </label>
                  <Input
                    type="text"
                    value={matricola}
                    onChange={(e) => setMatricola(e.target.value)}
                    placeholder="Es: 12345"
                    autoComplete="off"
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Inserisci la tua matricola per associare l'account al socio
                  </p>
                </motion.div>

                {message && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm px-3 py-2 rounded-lg ${
                      message.includes('completata') || message.includes('confermata')
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}
                  >
                    {message}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-[#0055ff] hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : 'Registrati'}
                  </Button>
                </motion.div>
              </form>

              <motion.p
                className="text-center text-sm mt-5 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Hai già un account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Accedi
                </Link>
              </motion.p>
            </CardContent>
          </Card>
        </GlowCard>
      </FadeInUp>
    </motion.main>
  )
}
