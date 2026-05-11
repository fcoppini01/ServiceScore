'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, Users } from 'lucide-react'

export default function QuadroCaratteristichePage() {
  const [soci, setSoci] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [tipiAssoc, setTipiAssoc] = useState<string[]>([])
  const [categorie, setCategorie] = useState<string[]>([])
  const [programmi, setProgrammi] = useState<string[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string[]>([])
  const [filtroCat, setFiltroCat] = useState<string[]>([])
  const [filtroProg, setFiltroProg] = useState<string[]>([])

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient) return
    loadSoci()
  }, [isClient, filtroTipo, filtroCat, filtroProg])

  async function loadFilterOptions() {
    const [tipiRes, catRes, progRes] = await Promise.all([
      supabase.from('soci').select('tipo_associazione_intera').not('tipo_associazione_intera', 'is', null),
      supabase.from('soci').select('categoria_associativa').not('categoria_associativa', 'is', null),
      supabase.from('soci').select('programma').not('programma', 'is', null),
    ])
    if (tipiRes.data) setTipiAssoc([...new Set(tipiRes.data.map((t: any) => t.tipo_associazione_intera))].filter(Boolean).sort() as string[])
    if (catRes.data) setCategorie([...new Set(catRes.data.map((c: any) => c.categoria_associativa))].filter(Boolean).sort() as string[])
    if (progRes.data) setProgrammi([...new Set(progRes.data.map((p: any) => p.programma))].filter(Boolean).sort() as string[])
  }

  async function loadSoci() {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('vista_soci_ricerca')
      .select('matricola_socio, cognome, nome, tipo_associazione_intera, categoria_associativa, programma')
    if (filtroTipo.length) query = query.in('tipo_associazione_intera', filtroTipo)
    if (filtroCat.length) query = query.in('categoria_associativa', filtroCat)
    if (filtroProg.length) query = query.in('programma', filtroProg)
    const { data, error } = await query.order('cognome', { ascending: true, nullsFirst: false }).range(0, 9999)
    if (error) setError('Errore nel caricamento. Riprova.')
    else setSoci(data || [])
    setLoading(false)
  }

  if (!isClient) return null

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
        Quadro dei Soci con Indicazione delle Caratteristiche Associative
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6 print:text-black">
        Distretto Lions 108 LA · {soci.length} soci · Ordinati per cognome
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MultiSelect options={tipiAssoc} selected={filtroTipo} onChange={setFiltroTipo} placeholder="Tipo associazione" />
              <MultiSelect options={categorie} selected={filtroCat} onChange={setFiltroCat} placeholder="Categoria associativa" />
              <MultiSelect options={programmi} selected={filtroProg} onChange={setFiltroProg} placeholder="Programma" />
            </div>
            {(filtroTipo.length + filtroCat.length + filtroProg.length) > 0 && (
              <Button variant="outline" size="sm" onClick={() => { setFiltroTipo([]); setFiltroCat([]); setFiltroProg([]) }} className="text-xs mt-3">Cancella filtri</Button>
            )}
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
                      <TableHead>Tipo Associazione</TableHead>
                      <TableHead>Categoria Associativa</TableHead>
                      <TableHead>Programma</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead>Nome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soci.map((s: any) => (
                      <TableRow key={s.matricola_socio} className="hover:bg-muted/40 print:hover:bg-transparent">
                        <TableCell className="text-xs">{s.tipo_associazione_intera ?? ''}</TableCell>
                        <TableCell className="text-xs">{s.categoria_associativa ?? ''}</TableCell>
                        <TableCell className="text-xs">{s.programma ?? ''}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{s.cognome}</TableCell>
                        <TableCell className="whitespace-nowrap">{s.nome}</TableCell>
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
