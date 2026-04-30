'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { GlowCard, FadeInUp, PulseGlow } from '@/lib/mac-effects'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setMessage('Credenziali non valide. Controlla email e password.')
      } else {
        setMessage(error.message)
      }
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background effects */}
      <PulseGlow className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]" />
      
      <FadeInUp>
        <GlowCard glowColor="#0055ff" className="w-full max-w-md">
          <Card className="bg-background/80 backdrop-blur-xl border border-border/50">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
                  Accedi
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@esempio.com"
                    required
                    autoComplete="email"
                    className="bg-background/50 backdrop-blur-sm"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="text-sm font-medium mb-1 block">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="bg-background/50 backdrop-blur-sm"
                  />
                </motion.div>

                {message && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm ${message.includes('effettuato') || message.includes('completata') ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {message}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-[#0055ff] hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : 'Accedi'}
                  </Button>
                </motion.div>
              </form>

              <motion.p 
                className="text-center text-sm mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Non hai un account?{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Registrati
                </Link>
              </motion.p>
            </CardContent>
          </Card>
        </GlowCard>
      </FadeInUp>
    </motion.main>
  )
}