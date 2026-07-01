'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, ShieldCheck, FileSpreadsheet } from 'lucide-react'
import { exportToExcel, todayStamp } from '@/lib/excel-export'
import { getAnnoSocialeRange, getRecentAnniSociali } from '@/lib/anno-sociale'

export default function QuadroIncarichiClubPage() {
  const [officer, setOfficer] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [titoli, setTitoli] = useState<string[]>([])
  const [clubs, setClubs] = useState<string[]>([])
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [filtroTitolo, setFiltroTitolo] = useState<string[]>([])
  const [filtroClub, setFiltroClub] = useState<string[]>([])
  const [filtroZona, setFiltroZona] = useState<string[]>([])
  const [filtroCirc, setFiltroCirc] = useState<string[]>([])
  const [filtroDistretto, setFiltroDistretto] = useState<string[]>([])
  const anniOpzioni = useMemo(() => getRecentAnniSociali(8), [])
  const [anniSociali, setAnniSociali] = useState<number[]>([])
  const [soloAttivi, setSoloAttivi] = useState(false)
  const [groupByTitolo, setGroupByTitolo] = useState(true)
  const DISTRETTI = ['108 LA']

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient) return
    loadOfficer()
  }, [isClient, filtroTitolo, filtroClub, filtroZona, filtroCirc, filtroDistretto, anniSociali, soloAttivi])

  async function loadFilterOptions() {
    // Club/Zona/Circ dalla tabella club (completa), titoli dalla view officer.
    const [titoliRes, clubTab] = await Promise.all([
      supabase.from('vista_officer_ricerca').select('titolo_ufficiale').not('titolo_ufficiale', 'is', null).range(0, 9999),
      supabase.from('club').select('nome_club, zona, circoscrizione').range(0, 9999),
    ])
    if (titoliRes.data) setTitoli([...new Set(titoliRes.data.map((t: any) => t.titolo_ufficiale))].filter(Boolean).sort() as string[])
    if (clubTab.data) {
      setClubs([...new Set(clubTab.data.map((c: any) => c.nome_club))].filter(Boolean).sort() as string[])
      setZone([...new Set(clubTab.data.map((c: any) => c.zona))].filter(Boolean).sort() as string[])
      setCircoscrizioni([...new Set(clubTab.data.map((c: any) => c.circoscrizione))].filter(Boolean).sort() as string[])
    }
  }

  async function loadOfficer() {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('vista_officer_ricerca')
      .select('id_incarico, titolo_ufficiale, nome_club, club_zona, club_circoscrizione, nome, cognome, data_inizio, data_conclusione')
    if (filtroTitolo.length) query = query.in('titolo_ufficiale', filtroTitolo)
    if (filtroClub.length) query = query.in('nome_club', filtroClub)
    if (filtroZona.length) query = query.in('club_zona', filtroZona)
    if (filtroCirc.length) query = query.in('club_circoscrizione', filtroCirc)
    // distretto: oggi unico, no-op a livello query
    // Anno sociale multi-selezione: unione (OR) degli intervalli 1 lug → 30 giu sulla data inizio incarico
    if (anniSociali.length) {
      const orExpr = anniSociali.map((y) => { const { from, to } = getAnnoSocialeRange(y); return `and(data_inizio.gte.${from},data_inizio.lte.${to})` }).join(',')
      query = query.or(orExpr)
    }
    if (soloAttivi) {
      const d = new Date()
      const oggi = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      query = query
        .or(`data_inizio.is.null,data_inizio.lte.${oggi}`)
        .or(`data_conclusione.is.null,data_conclusione.gte.${oggi}`)
    }
    const { data, error } = await query
      .order('titolo_ufficiale', { ascending: true, nullsFirst: false })
      .order('nome_club', { ascending: true, nullsFirst: false })
      .order('cognome', { ascending: true, nullsFirst: false })
      .range(0, 9999)
    if (error) setError('Errore nel caricamento. Riprova.')
    else setOfficer(data || [])
    setLoading(false)
  }

  // Raggruppa per titolo se richiesto
  const grouped = useMemo(() => {
    if (!groupByTitolo) return null
    const map = new Map<string, any[]>()
    for (const o of officer) {
      const t = o.titolo_ufficiale ?? '—'
      if (!map.has(t)) map.set(t, [])
      map.get(t)!.push(o)
    }
    return Array.from(map.entries())
  }, [officer, groupByTitolo])

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 print-hide gap-2 flex-wrap">
        <Link href="/officer">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Officer
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportToExcel(
              officer,
              [
                { header: 'Titolo ufficiale', accessor: (o: any) => o.titolo_ufficiale },
                { header: 'Club', accessor: (o: any) => o.nome_club },
                { header: 'Zona', accessor: (o: any) => o.club_zona },
                { header: 'Circoscrizione', accessor: (o: any) => o.club_circoscrizione },
                { header: 'Cognome', accessor: (o: any) => o.cognome },
                { header: 'Nome', accessor: (o: any) => o.nome },
              ],
              `officer_incarichi_${todayStamp()}`,
              'Incarichi'
            )}
            size="sm"
            className="text-xs gap-1.5"
            disabled={officer.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
          </Button>
        </div>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Classificazione degli Incarichi con le Nomine dai Club
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6 print:text-black">
        Distretto Lions 108 LA · {officer.length} incarichi
        {soloAttivi && ' attivi (in corso oggi)'}
        {filtroZona.length > 0 && ` · Zone: ${filtroZona.join(', ')}`}
        {filtroCirc.length > 0 && ` · Circoscrizioni: ${filtroCirc.join(', ')}`}
        · Ordinati per titolo ufficiale e club
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <MultiSelect options={clubs} selected={filtroClub} onChange={setFiltroClub} placeholder="Club" />
              <MultiSelect options={zone} selected={filtroZona} onChange={setFiltroZona} placeholder="Zona" />
              <MultiSelect options={circoscrizioni} selected={filtroCirc} onChange={setFiltroCirc} placeholder="Circoscrizione" />
              <MultiSelect options={DISTRETTI} selected={filtroDistretto} onChange={setFiltroDistretto} placeholder="Distretto" />
              <MultiSelect
                options={anniOpzioni.map((a) => a.label)}
                selected={[...anniSociali].sort((a, b) => b - a).map((y) => getAnnoSocialeRange(y).label)}
                onChange={(labels) => setAnniSociali(labels.map((l) => anniOpzioni.find((a) => a.label === l)!.value))}
                placeholder="Anno sociale"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MultiSelect options={titoli} selected={filtroTitolo} onChange={setFiltroTitolo} placeholder="Titolo ufficiale" />
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soloAttivi}
                  onChange={(e) => setSoloAttivi(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">Solo incarichi attivi (in corso oggi)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={groupByTitolo}
                  onChange={(e) => setGroupByTitolo(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">Raggruppa per titolo</span>
              </label>
              {(filtroTitolo.length + filtroClub.length + filtroZona.length + filtroCirc.length + filtroDistretto.length + anniSociali.length) > 0 && (
                <Button variant="outline" size="sm" onClick={() => { setFiltroTitolo([]); setFiltroClub([]); setFiltroZona([]); setFiltroCirc([]); setFiltroDistretto([]); setAnniSociali([]) }} className="text-xs">Cancella filtri</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
          <CardHeader className="pb-3 print-hide">
            <CardTitle className="text-base font-semibold">Elenco Incarichi ({officer.length})</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0">
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : officer.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <ShieldCheck className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessun incarico trovato</span>
              </div>
            ) : groupByTitolo && grouped ? (
              <div className="space-y-6">
                {grouped.map(([titolo, list]) => (
                  <div key={titolo} className="overflow-x-auto">
                    <h2 className="text-sm font-bold mb-2 pb-1 border-b border-border/50 print:text-black print:border-black">
                      {titolo} <span className="text-muted-foreground font-normal print:text-black">· {list.length} nomine</span>
                    </h2>
                    <table className="w-full text-sm cv-table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome Club</TableHead>
                          <TableHead className="whitespace-nowrap">Zona</TableHead>
                          <TableHead className="whitespace-nowrap">Circ.</TableHead>
                          <TableHead>Cognome</TableHead>
                          <TableHead>Nome</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((o: any) => (
                          <TableRow key={o.id_incarico} className="cv-row hover:bg-muted/40 print:hover:bg-transparent">
                            <TableCell className="whitespace-nowrap">{o.nome_club}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{o.club_zona}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{o.club_circoscrizione}</TableCell>
                            <TableCell className="font-medium whitespace-nowrap">{o.cognome}</TableCell>
                            <TableCell className="whitespace-nowrap">{o.nome}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm cv-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titolo Ufficiale</TableHead>
                      <TableHead>Nome Club</TableHead>
                      <TableHead className="whitespace-nowrap">Zona</TableHead>
                      <TableHead className="whitespace-nowrap">Circ.</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead>Nome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {officer.map((o: any) => (
                      <TableRow key={o.id_incarico} className="cv-row hover:bg-muted/40 print:hover:bg-transparent">
                        <TableCell className="font-medium">{o.titolo_ufficiale}</TableCell>
                        <TableCell className="whitespace-nowrap">{o.nome_club}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{o.club_zona}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{o.club_circoscrizione}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{o.cognome}</TableCell>
                        <TableCell className="whitespace-nowrap">{o.nome}</TableCell>
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
