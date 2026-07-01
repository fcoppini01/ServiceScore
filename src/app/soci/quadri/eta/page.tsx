'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, Users, FileSpreadsheet } from 'lucide-react'
import { exportToExcel, todayStamp, fmtDateIT } from '@/lib/excel-export'

const FASCE = ['Under 30', '31-40', '41-50', '51-60', '61-70', 'Over 70']

export default function QuadroEtaPage() {
  const [soci, setSoci] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [etaMin, setEtaMin] = useState('')
  const [etaMax, setEtaMax] = useState('')
  const [fasce, setFasce] = useState<string[]>([])
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [clubs, setClubs] = useState<string[]>([])
  const [filtroZona, setFiltroZona] = useState<string[]>([])
  const [filtroCirc, setFiltroCirc] = useState<string[]>([])
  const [filtroClub, setFiltroClub] = useState<string[]>([])

  useEffect(() => {
    setIsClient(true)
    // carica opzioni filtri territoriali
    Promise.all([
      supabase.from('club').select('zona').not('zona', 'is', null),
      supabase.from('club').select('circoscrizione').not('circoscrizione', 'is', null),
      supabase.from('club').select('nome_club').not('nome_club', 'is', null),
    ]).then(([zoneRes, circRes, clubRes]) => {
      if (zoneRes.data) setZone([...new Set(zoneRes.data.map(z => z.zona))].filter(Boolean).sort() as string[])
      if (circRes.data) setCircoscrizioni([...new Set(circRes.data.map(c => c.circoscrizione))].filter(Boolean).sort() as string[])
      if (clubRes.data) setClubs([...new Set(clubRes.data.map(c => c.nome_club))].filter(Boolean).sort() as string[])
    })
  }, [])

  useEffect(() => {
    if (!isClient) return
    loadSoci()
  }, [isClient, etaMin, etaMax, fasce, filtroZona, filtroCirc, filtroClub])

  async function loadSoci() {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('vista_soci_ricerca')
      .select('matricola_socio, titolo, nome, cognome, data_nascita, eta, fascia_eta, club_zona, club_circoscrizione, nome_club')
      .not('eta', 'is', null)
    if (etaMin) query = query.gte('eta', parseInt(etaMin))
    if (etaMax) query = query.lte('eta', parseInt(etaMax))
    if (fasce.length) query = query.in('fascia_eta', fasce)
    if (filtroZona.length) query = query.in('club_zona', filtroZona)
    if (filtroCirc.length) query = query.in('club_circoscrizione', filtroCirc)
    if (filtroClub.length) query = query.in('nome_club', filtroClub)
    const { data, error } = await query.order('eta', { ascending: false, nullsFirst: false }).range(0, 9999)
    if (error) setError('Errore nel caricamento. Riprova.')
    else setSoci(data || [])
    setLoading(false)
  }

  if (!isClient) return null

  const formatDate = (d: string | null) => {
    if (!d) return ''
    const date = new Date(d)
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

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
                { header: 'Matricola', accessor: (s: any) => s.matricola_socio },
                { header: 'Titolo', accessor: (s: any) => s.titolo ?? '' },
                { header: 'Nome', accessor: (s: any) => s.nome },
                { header: 'Cognome', accessor: (s: any) => s.cognome },
                { header: 'Club', accessor: (s: any) => s.nome_club },
                { header: 'Zona', accessor: (s: any) => s.club_zona },
                { header: 'Circoscrizione', accessor: (s: any) => s.club_circoscrizione },
                { header: 'Data nascita', accessor: (s: any) => fmtDateIT(s.data_nascita) },
                { header: 'Età', accessor: (s: any) => s.eta },
                { header: "Fascia d'età", accessor: (s: any) => s.fascia_eta },
              ],
              `soci_fasce_eta_${todayStamp()}`,
              'Soci per età'
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
        Classificazione Soci per Fasce di Età
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6 print:text-black">
        Distretto Lions 108 LA · {soci.length} soci · Ordinati per età decrescente
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end mb-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Fasce di età</p>
                <MultiSelect options={FASCE} selected={fasce} onChange={setFasce} placeholder="Tutte le fasce" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure intervallo personalizzato (anni)</p>
                <div className="flex items-center gap-1.5">
                  <Input type="number" min="0" max="120" placeholder="Da" value={etaMin} onChange={(e) => setEtaMin(e.target.value)} className="text-sm bg-background/50" />
                  <span className="text-xs text-muted-foreground shrink-0">—</span>
                  <Input type="number" min="0" max="120" placeholder="A" value={etaMax} onChange={(e) => setEtaMax(e.target.value)} className="text-sm bg-background/50" />
                </div>
              </div>
            </div>
            {/* Filtri territoriali — ordine fisso Club, Zona, Circoscrizione, Distretto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Club</p>
                <MultiSelect options={clubs} selected={filtroClub} onChange={setFiltroClub} placeholder="Tutti i club" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Zona</p>
                <MultiSelect options={zone} selected={filtroZona} onChange={setFiltroZona} placeholder="Tutte le zone" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Circoscrizione</p>
                <MultiSelect options={circoscrizioni} selected={filtroCirc} onChange={setFiltroCirc} placeholder="Tutte le circoscrizioni" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Distretto</p>
                <MultiSelect options={['108 LA']} selected={[]} onChange={() => {}} placeholder="108 LA" />
              </div>
            </div>
            {(etaMin || etaMax || fasce.length > 0 || filtroZona.length > 0 || filtroCirc.length > 0 || filtroClub.length > 0) && (
              <Button variant="outline" size="sm" onClick={() => { setEtaMin(''); setEtaMax(''); setFasce([]); setFiltroZona([]); setFiltroCirc([]); setFiltroClub([]) }} className="text-xs">Cancella filtri</Button>
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
                      <TableHead className="whitespace-nowrap">Matricola</TableHead>
                      <TableHead className="whitespace-nowrap">Titolo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead className="whitespace-nowrap">Compleanno</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Età</TableHead>
                      <TableHead className="whitespace-nowrap">Fascia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soci.map((s: any) => (
                      <TableRow key={s.matricola_socio} className="cv-row hover:bg-muted/40 print:hover:bg-transparent">
                        <TableCell className="font-mono text-xs whitespace-nowrap">{s.matricola_socio}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{s.titolo ?? ''}</TableCell>
                        <TableCell className="whitespace-nowrap">{s.nome}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{s.cognome}</TableCell>
                        <TableCell className="text-xs">{s.nome_club}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{formatDate(s.data_nascita)}</TableCell>
                        <TableCell className="tabular-nums text-right whitespace-nowrap">{s.eta}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{s.fascia_eta}</TableCell>
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
