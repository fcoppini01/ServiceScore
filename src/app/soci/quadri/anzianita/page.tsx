'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, Users } from 'lucide-react'

export default function QuadroAnzianitaPage() {
  const [soci, setSoci] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [anzMin, setAnzMin] = useState('')
  const [anzMax, setAnzMax] = useState('')

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    loadSoci()
  }, [isClient, anzMin, anzMax])

  async function loadSoci() {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('vista_soci_ricerca')
      .select('matricola_socio, nome, cognome, data_ingresso, anzianita_lionistica')
      .not('anzianita_lionistica', 'is', null)
    if (anzMin) query = query.gte('anzianita_lionistica', parseInt(anzMin))
    if (anzMax) query = query.lte('anzianita_lionistica', parseInt(anzMax))
    const { data, error } = await query.order('anzianita_lionistica', { ascending: false, nullsFirst: false }).range(0, 9999)
    if (error) setError('Errore nel caricamento. Riprova.')
    else setSoci(data || [])
    setLoading(false)
  }

  if (!isClient) return null

  const formatDate = (d: string | null) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 print-hide gap-2 flex-wrap">
        <Link href="/soci">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Soci
          </Button>
        </Link>
        <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5">
          <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
        </Button>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Quadro di Riordino Soci per Anzianità Lionistica
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6 print:text-black">
        Distretto Lions 108 LA · {soci.length} soci · Ordinati per anzianità decrescente
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Anzianità minima (anni)</p>
                <Input type="number" min="0" placeholder="Da" value={anzMin} onChange={(e) => setAnzMin(e.target.value)} className="text-sm bg-background/50" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Anzianità massima (anni)</p>
                <Input type="number" min="0" placeholder="A" value={anzMax} onChange={(e) => setAnzMax(e.target.value)} className="text-sm bg-background/50" />
              </div>
              <Button variant="outline" size="sm" onClick={() => { setAnzMin(''); setAnzMax('') }} className="text-xs">Cancella filtro</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
          <CardHeader className="pb-3 print-hide">
            <CardTitle className="text-base font-semibold">Elenco Soci ({soci.length})</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0">
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : soci.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Users className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessun socio trovato</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead className="whitespace-nowrap">Data di Ingresso</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Anni di Anzianità Lionistica</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soci.map((s: any) => (
                      <TableRow key={s.matricola_socio} className="hover:bg-muted/40 print:hover:bg-transparent">
                        <TableCell className="whitespace-nowrap">{s.nome}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{s.cognome}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{formatDate(s.data_ingresso)}</TableCell>
                        <TableCell className="tabular-nums text-right whitespace-nowrap">{s.anzianita_lionistica}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
