'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, Users, FileSpreadsheet } from 'lucide-react'
import { exportToExcel, todayStamp } from '@/lib/excel-export'

// Prospetto "Composizione del Club" (spostato dalla Dashboard).
// Mostra la composizione anagrafica dei soci selezionati per fasce d'età e
// anzianità lionistica. Filtri territoriali come nei rapporti Attività:
// Club · Zona · Circoscrizione · Distretto (108 LA = tutti i soci).

// Bucket specifici richiesti dal Direttivo (diversi dal filtro globale soci).
const FASCE_ETA = [
  { label: 'Under 50', test: (e: number) => e < 50 },
  { label: '50-60',    test: (e: number) => e >= 50 && e <= 60 },
  { label: '60-70',    test: (e: number) => e > 60 && e <= 70 },
  { label: 'Over 70',  test: (e: number) => e > 70 },
]

const FASCE_ANZ = [
  { label: 'Under 2', test: (a: number) => a < 2 },
  { label: '2-5',     test: (a: number) => a >= 2 && a <= 5 },
  { label: '5-10',    test: (a: number) => a > 5 && a <= 10 },
  { label: '10-15',   test: (a: number) => a > 10 && a <= 15 },
  { label: '15-20',   test: (a: number) => a > 15 && a <= 20 },
  { label: 'Over 20', test: (a: number) => a > 20 },
]

// Fasce di genere (diversità di genere richiesta dal Direttivo).
// Tutto ciò che non è Maschio/Femmina (es. "Preferisco non rispondere" o vuoto)
// confluisce in "Altro / N.D." per non perdere il socio dal totale.
const FASCE_SESSO = [
  { label: 'Uomini',      test: (s: string) => s === 'Maschio' },
  { label: 'Donne',       test: (s: string) => s === 'Femmina' },
  { label: 'Altro / N.D.', test: (s: string) => s !== 'Maschio' && s !== 'Femmina' },
]

type Socio = { eta: number | null; anzianita_lionistica: number | null; sesso: string | null }

export default function QuadroComposizionePage() {
  const [clubs, setClubs] = useState<string[]>([])
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [filtroClub, setFiltroClub] = useState<string[]>([])
  const [filtroZona, setFiltroZona] = useState<string[]>([])
  const [filtroCirc, setFiltroCirc] = useState<string[]>([])
  const [filtroDistretto, setFiltroDistretto] = useState<string[]>([])
  const [soci, setSoci] = useState<Socio[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient) return
    // Senza filtri territoriali si carica la composizione di TUTTO il Distretto.
    loadSoci()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, filtroClub, filtroZona, filtroCirc, filtroDistretto])

  async function loadFilterOptions() {
    const { data } = await supabase.from('club').select('nome_club, zona, circoscrizione').range(0, 9999)
    if (data) {
      setClubs([...new Set(data.map((c: any) => c.nome_club))].filter(Boolean).sort() as string[])
      setZone([...new Set(data.map((c: any) => c.zona))].filter(Boolean).sort() as string[])
      setCircoscrizioni([...new Set(data.map((c: any) => c.circoscrizione))].filter(Boolean).sort() as string[])
    }
  }

  async function loadSoci() {
    setLoading(true)
    setError(null)
    let q = supabase
      .from('vista_soci_ricerca')
      .select('eta, anzianita_lionistica, sesso, nome_club, club_zona, club_circoscrizione')
    // Distretto selezionato = tutti i soci (nessun filtro territoriale)
    if (filtroDistretto.length === 0) {
      if (filtroClub.length) q = q.in('nome_club', filtroClub)
      if (filtroZona.length) q = q.in('club_zona', filtroZona)
      if (filtroCirc.length) q = q.in('club_circoscrizione', filtroCirc)
    }
    const { data, error } = await q.range(0, 49999)
    if (error) setError('Errore nel caricamento. Riprova.')
    else setSoci((data ?? []) as Socio[])
    setLoading(false)
  }

  const distEta = useMemo(() => FASCE_ETA.map(f => ({
    label: f.label,
    count: soci.filter(s => s.eta != null && f.test(Number(s.eta))).length,
  })), [soci])
  const totEta = distEta.reduce((s, f) => s + f.count, 0)

  const distAnz = useMemo(() => FASCE_ANZ.map(f => ({
    label: f.label,
    count: soci.filter(s => s.anzianita_lionistica != null && f.test(Number(s.anzianita_lionistica))).length,
  })), [soci])
  const totAnz = distAnz.reduce((s, f) => s + f.count, 0)

  // Composizione per genere: il totale coincide sempre con i soci caricati
  // (i valori mancanti finiscono in "Altro / N.D.").
  const distSesso = useMemo(() => FASCE_SESSO.map(f => ({
    label: f.label,
    count: soci.filter(s => f.test((s.sesso ?? '').trim())).length,
  })), [soci])
  const totSesso = distSesso.reduce((s, f) => s + f.count, 0)

  const totSoci = soci.length

  const ambitoLabel = filtroDistretto.length > 0
    ? 'Tutto il Distretto 108 LA'
    : filtroClub.length > 0
      ? (filtroClub.length === 1 ? filtroClub[0] : `${filtroClub.length} club selezionati`)
      : filtroZona.length > 0
        ? `Zone: ${filtroZona.join(', ')}`
        : filtroCirc.length > 0
          ? `Circoscrizioni: ${filtroCirc.join(', ')}`
          : 'Tutto il Distretto 108 LA'

  function esportaExcel() {
    const rows = [
      ...distEta.map(f => ({ tipo: "Fasce d'Età", fascia: f.label, q: f.count, pct: totEta > 0 ? `${((f.count / totEta) * 100).toFixed(1)}%` : '—' })),
      { tipo: "Fasce d'Età", fascia: 'Totale', q: totEta, pct: '100%' },
      ...distAnz.map(f => ({ tipo: 'Anzianità Lionistica', fascia: f.label, q: f.count, pct: totAnz > 0 ? `${((f.count / totAnz) * 100).toFixed(1)}%` : '—' })),
      { tipo: 'Anzianità Lionistica', fascia: 'Totale', q: totAnz, pct: '100%' },
      ...distSesso.map(f => ({ tipo: 'Genere', fascia: f.label, q: f.count, pct: totSesso > 0 ? `${((f.count / totSesso) * 100).toFixed(1)}%` : '—' })),
      { tipo: 'Genere', fascia: 'Totale', q: totSesso, pct: '100%' },
    ]
    exportToExcel(
      rows,
      [
        { header: 'Composizione', accessor: (r: any) => r.tipo },
        { header: 'Fascia', accessor: (r: any) => r.fascia },
        { header: 'Quantità', accessor: (r: any) => r.q },
        { header: 'Percentuale', accessor: (r: any) => r.pct },
      ],
      `composizione_club_${todayStamp()}`,
      'Composizione'
    )
  }

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area">
      <motion.div variants={itemVariants} className="flex items-center mb-4 print-hide gap-2 flex-wrap">
        <Link href="/soci/rapporti">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Rapporti Soci
          </Button>
        </Link>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Composizione del Club per Età e Anzianità
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-4 print:text-black">
        <><strong className="text-foreground print:text-black">{ambitoLabel}</strong> · {totSoci} soci</>
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2 flex-wrap print-hide">
        <Button variant="outline" onClick={esportaExcel} size="sm" className="text-xs gap-1.5" disabled={totSoci === 0}>
          <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
        </Button>
        <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={totSoci === 0}>
          <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            {/* Filtri territoriali — ordine fisso Club, Zona, Circoscrizione, Distretto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Club (selezione multipla)</p>
                <MultiSelect options={clubs} selected={filtroClub} onChange={setFiltroClub} placeholder="Seleziona club…" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Zone (in alternativa)</p>
                <MultiSelect options={zone} selected={filtroZona} onChange={setFiltroZona} placeholder="Tutte le zone" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Circoscrizioni</p>
                <MultiSelect options={circoscrizioni} selected={filtroCirc} onChange={setFiltroCirc} placeholder="Tutte le circoscrizioni" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure tutto il Distretto</p>
                <MultiSelect options={['108 LA']} selected={filtroDistretto} onChange={setFiltroDistretto} placeholder="108 LA" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Puoi selezionare uno o più Club, oppure scegliere una o più Zone/Circoscrizioni per includere tutti i loro soci, oppure l’intero Distretto.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
          <CardHeader className="pb-3 print-hide">
            <CardTitle className="text-base font-semibold">Composizione · {totSoci} soci</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0 space-y-6">
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : totSoci === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Users className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessun socio trovato per la selezione</span>
              </div>
            ) : (
              <>
                {/* Tabella 1: Fasce d'età */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="inline-block w-1 h-4 bg-emerald-500 rounded-full" />
                    Composizione per Fasce d&apos;Età
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40">
                          <th className="text-left px-3 py-2 font-semibold text-xs uppercase text-muted-foreground border-r border-border/50">Fascia</th>
                          {distEta.map(f => (
                            <th key={f.label} className="px-3 py-2 font-semibold text-xs uppercase text-muted-foreground text-center border-r border-border/50 last:border-r-0">{f.label}</th>
                          ))}
                          <th className="px-3 py-2 font-semibold text-xs uppercase text-emerald-700 dark:text-emerald-400 text-center bg-emerald-500/5">Totale</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border/50">
                          <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">Quantità</td>
                          {distEta.map(f => (
                            <td key={f.label} className="px-3 py-2 text-center tabular-nums font-semibold border-r border-border/50 last:border-r-0">{f.count}</td>
                          ))}
                          <td className="px-3 py-2 text-center tabular-nums font-bold bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">{totEta}</td>
                        </tr>
                        <tr className="border-t border-border/50 bg-muted/20">
                          <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">%</td>
                          {distEta.map(f => (
                            <td key={f.label} className="px-3 py-2 text-center tabular-nums text-xs text-muted-foreground border-r border-border/50 last:border-r-0">
                              {totEta > 0 ? `${((f.count / totEta) * 100).toFixed(1)}%` : '—'}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center tabular-nums text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {totEta < totSoci && (
                    <p className="text-[10px] text-muted-foreground italic mt-1">
                      Nota: {totSoci - totEta} {totSoci - totEta === 1 ? 'socio non ha' : 'soci non hanno'} la data di nascita registrata
                    </p>
                  )}
                </div>

                {/* Tabella 2: Anzianità lionistica */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="inline-block w-1 h-4 bg-blue-500 rounded-full" />
                    Composizione per Anzianità Lionistica (anni)
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40">
                          <th className="text-left px-3 py-2 font-semibold text-xs uppercase text-muted-foreground border-r border-border/50">Fascia</th>
                          {distAnz.map(f => (
                            <th key={f.label} className="px-3 py-2 font-semibold text-xs uppercase text-muted-foreground text-center border-r border-border/50 last:border-r-0">{f.label}</th>
                          ))}
                          <th className="px-3 py-2 font-semibold text-xs uppercase text-blue-700 dark:text-blue-400 text-center bg-blue-500/5">Totale</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border/50">
                          <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">Quantità</td>
                          {distAnz.map(f => (
                            <td key={f.label} className="px-3 py-2 text-center tabular-nums font-semibold border-r border-border/50 last:border-r-0">{f.count}</td>
                          ))}
                          <td className="px-3 py-2 text-center tabular-nums font-bold bg-blue-500/5 text-blue-700 dark:text-blue-400">{totAnz}</td>
                        </tr>
                        <tr className="border-t border-border/50 bg-muted/20">
                          <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">%</td>
                          {distAnz.map(f => (
                            <td key={f.label} className="px-3 py-2 text-center tabular-nums text-xs text-muted-foreground border-r border-border/50 last:border-r-0">
                              {totAnz > 0 ? `${((f.count / totAnz) * 100).toFixed(1)}%` : '—'}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center tabular-nums text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {totAnz < totSoci && (
                    <p className="text-[10px] text-muted-foreground italic mt-1">
                      Nota: {totSoci - totAnz} {totSoci - totAnz === 1 ? 'socio non ha' : 'soci non hanno'} la data di ingresso registrata
                    </p>
                  )}
                </div>

                {/* Tabella 3: Composizione per genere */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="inline-block w-1 h-4 bg-purple-500 rounded-full" />
                    Composizione per Sesso
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40">
                          <th className="text-left px-3 py-2 font-semibold text-xs uppercase text-muted-foreground border-r border-border/50">Fascia</th>
                          {distSesso.map(f => (
                            <th key={f.label} className="px-3 py-2 font-semibold text-xs uppercase text-muted-foreground text-center border-r border-border/50 last:border-r-0">{f.label}</th>
                          ))}
                          <th className="px-3 py-2 font-semibold text-xs uppercase text-purple-700 dark:text-purple-400 text-center bg-purple-500/5">Totale</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border/50">
                          <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">Quantità</td>
                          {distSesso.map(f => (
                            <td key={f.label} className="px-3 py-2 text-center tabular-nums font-semibold border-r border-border/50 last:border-r-0">{f.count}</td>
                          ))}
                          <td className="px-3 py-2 text-center tabular-nums font-bold bg-purple-500/5 text-purple-700 dark:text-purple-400">{totSesso}</td>
                        </tr>
                        <tr className="border-t border-border/50 bg-muted/20">
                          <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">%</td>
                          {distSesso.map(f => (
                            <td key={f.label} className="px-3 py-2 text-center tabular-nums text-xs text-muted-foreground border-r border-border/50 last:border-r-0">
                              {totSesso > 0 ? `${((f.count / totSesso) * 100).toFixed(1)}%` : '—'}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center tabular-nums text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
