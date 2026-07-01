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
import { ArrowLeft, Printer, Users, FileSpreadsheet } from 'lucide-react'
import { exportToExcel, todayStamp } from '@/lib/excel-export'

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

  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [clubs, setClubs] = useState<string[]>([])
  const [filtroZona, setFiltroZona] = useState<string[]>([])
  const [filtroCirc, setFiltroCirc] = useState<string[]>([])
  const [filtroClub, setFiltroClub] = useState<string[]>([])

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient) return
    loadSoci()
  }, [isClient, filtroTipo, filtroCat, filtroProg, filtroZona, filtroCirc, filtroClub])

  async function loadFilterOptions() {
    const [tipiRes, catRes, progRes, zoneRes, circRes, clubRes] = await Promise.all([
      supabase.from('soci').select('tipo_associazione_intera').not('tipo_associazione_intera', 'is', null),
      supabase.from('soci').select('categoria_associativa').not('categoria_associativa', 'is', null),
      supabase.from('soci').select('programma').not('programma', 'is', null),
      supabase.from('club').select('zona').not('zona', 'is', null),
      supabase.from('club').select('circoscrizione').not('circoscrizione', 'is', null),
      supabase.from('club').select('nome_club').not('nome_club', 'is', null),
    ])
    if (tipiRes.data) setTipiAssoc([...new Set(tipiRes.data.map((t: any) => t.tipo_associazione_intera))].filter(Boolean).sort() as string[])
    if (catRes.data) setCategorie([...new Set(catRes.data.map((c: any) => c.categoria_associativa))].filter(Boolean).sort() as string[])
    if (progRes.data) setProgrammi([...new Set(progRes.data.map((p: any) => p.programma))].filter(Boolean).sort() as string[])
    if (zoneRes.data) setZone([...new Set(zoneRes.data.map((z: any) => z.zona))].filter(Boolean).sort() as string[])
    if (circRes.data) setCircoscrizioni([...new Set(circRes.data.map((c: any) => c.circoscrizione))].filter(Boolean).sort() as string[])
    if (clubRes.data) setClubs([...new Set(clubRes.data.map((c: any) => c.nome_club))].filter(Boolean).sort() as string[])
  }

  async function loadSoci() {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('vista_soci_ricerca')
      .select('matricola_socio, cognome, nome, tipo_associazione_intera, categoria_associativa, programma, nome_club, club_zona, club_circoscrizione')
    if (filtroTipo.length) query = query.in('tipo_associazione_intera', filtroTipo)
    if (filtroCat.length) query = query.in('categoria_associativa', filtroCat)
    if (filtroProg.length) query = query.in('programma', filtroProg)
    if (filtroZona.length) query = query.in('club_zona', filtroZona)
    if (filtroCirc.length) query = query.in('club_circoscrizione', filtroCirc)
    if (filtroClub.length) query = query.in('nome_club', filtroClub)
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportToExcel(
              soci,
              [
                { header: 'Tipo associazione', accessor: (s: any) => s.tipo_associazione_intera ?? '' },
                { header: 'Categoria associativa', accessor: (s: any) => s.categoria_associativa ?? '' },
                { header: 'Programma', accessor: (s: any) => s.programma ?? '' },
                { header: 'Club', accessor: (s: any) => s.nome_club ?? '' },
                { header: 'Zona', accessor: (s: any) => s.club_zona ?? '' },
                { header: 'Circoscrizione', accessor: (s: any) => s.club_circoscrizione ?? '' },
                { header: 'Cognome', accessor: (s: any) => s.cognome },
                { header: 'Nome', accessor: (s: any) => s.nome },
              ],
              `soci_caratteristiche_${todayStamp()}`,
              'Caratteristiche'
            )}
            size="sm"
            className="text-xs gap-1.5"
            disabled={soci.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
          </Button>
        </div>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Classificazione dei Soci con Indicazione delle Caratteristiche Associative
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6 print:text-black">
        Distretto Lions 108 LA · {soci.length} soci · Ordinati per cognome
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MultiSelect options={tipiAssoc} selected={filtroTipo} onChange={setFiltroTipo} placeholder="Tipo associazione" />
              <MultiSelect options={categorie} selected={filtroCat} onChange={setFiltroCat} placeholder="Categoria associativa" />
              <MultiSelect options={programmi} selected={filtroProg} onChange={setFiltroProg} placeholder="Programma" />
            </div>
            {/* Filtri territoriali — ordine fisso Club, Zona, Circoscrizione, Distretto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MultiSelect options={clubs} selected={filtroClub} onChange={setFiltroClub} placeholder="Club" />
              <MultiSelect options={zone} selected={filtroZona} onChange={setFiltroZona} placeholder="Zona" />
              <MultiSelect options={circoscrizioni} selected={filtroCirc} onChange={setFiltroCirc} placeholder="Circoscrizione" />
              <MultiSelect options={['108 LA']} selected={[]} onChange={() => {}} placeholder="Distretto: 108 LA" />
            </div>
            {(filtroTipo.length + filtroCat.length + filtroProg.length + filtroZona.length + filtroCirc.length + filtroClub.length) > 0 && (
              <Button variant="outline" size="sm" onClick={() => { setFiltroTipo([]); setFiltroCat([]); setFiltroProg([]); setFiltroZona([]); setFiltroCirc([]); setFiltroClub([]) }} className="text-xs">Cancella filtri</Button>
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
                <table className="w-full text-sm cv-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo Associazione</TableHead>
                      <TableHead>Categoria Associativa</TableHead>
                      <TableHead>Programma</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead>Nome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soci.map((s: any) => (
                      <TableRow key={s.matricola_socio} className="cv-row hover:bg-muted/40 print:hover:bg-transparent">
                        <TableCell className="text-xs">{s.tipo_associazione_intera ?? ''}</TableCell>
                        <TableCell className="text-xs">{s.categoria_associativa ?? ''}</TableCell>
                        <TableCell className="text-xs">{s.programma ?? ''}</TableCell>
                        <TableCell className="text-xs">{s.nome_club ?? ''}</TableCell>
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
