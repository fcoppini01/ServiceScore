'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, Activity, FileSpreadsheet } from 'lucide-react'
import { exportToExcel, todayStamp } from '@/lib/excel-export'
import { getCurrentAnnoSocialeStart, getAnnoSocialeRange, getAnniSociali } from '@/lib/anno-sociale'

// "Struttura Dati Donazioni e Attività per Club": per lo scope scelto (club/zona/
// circoscrizione/distretto) mostra i Totali Generali in testa e poi un blocco per
// ogni club (ordine alfabetico) con dati finanziari + ripartizione attività in
// Totale / Amministrazione / Service. Ogni valore riporta la % sul Totale Generale.

const AMM = 'Amministrazione'

type Agg = { att: number; pers: number; vol: number; ore: number; donati: number; raccolti: number }
const zero = (): Agg => ({ att: 0, pers: 0, vol: 0, ore: 0, donati: 0, raccolti: 0 })
function add(a: Agg, r: any) {
  a.att += 1
  a.pers += Number(r.persone_servite_limite) || 0
  a.vol += Number(r.totale_volontari) || 0
  a.ore += Number(r.totale_ore_servizio_capped) || 0
  a.donati += Number(r.fondi_donati_usd_capped) || 0
  a.raccolti += Number(r.fondi_raccolti_usd_capped) || 0
}

const fmt = (n: number) => Math.round(n).toLocaleString('it-IT')
const pct = (v: number, den: number) => (den > 0 ? Math.round((v / den) * 100) : 0)
const ratio = (racc: number, don: number) => (don > 0 ? (racc / don) * 100 : 0)

type YearBlock = { year: number; label: string; tot: Agg; amm: Agg; srv: Agg }
type ClubBlock = { nome: string; tot: Agg; amm: Agg; srv: Agg; perYear: YearBlock[] }

// Anno sociale (1 lug → 30 giu) a cui appartiene una data attività.
function annoStartOf(d: string | null): number | null {
  if (!d) return null
  const y = parseInt(d.slice(0, 4), 10)
  const m = parseInt(d.slice(5, 7), 10)
  if (!y) return null
  return m >= 7 ? y : y - 1
}

export default function QuadroDonazioniAttivitaPage() {
  const [club, setClub] = useState<string[]>([])
  const anniOpzioni = useMemo(() => getAnniSociali(), [])
  const [anniSociali, setAnniSociali] = useState<number[]>([getCurrentAnnoSocialeStart()])
  const [clubs, setClubs] = useState<string[]>([])
  const [zone, setZone] = useState<string[]>([])
  const [filtroZona, setFiltroZona] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [filtroCircoscrizione, setFiltroCircoscrizione] = useState<string[]>([])
  const [filtroDistretto, setFiltroDistretto] = useState<string[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => { setIsClient(true); loadFilterOptions() }, [])
  useEffect(() => {
    if (!isClient || (club.length === 0 && filtroZona.length === 0 && filtroCircoscrizione.length === 0 && filtroDistretto.length === 0)) { setActivities([]); return }
    loadActivities()
  }, [isClient, club, filtroZona, filtroCircoscrizione, filtroDistretto, anniSociali])

  async function loadFilterOptions() {
    const { data } = await supabase.from('club').select('nome_club, zona, circoscrizione').range(0, 9999)
    if (data) {
      setClubs([...new Set(data.map((c: any) => c.nome_club))].filter(Boolean).sort() as string[])
      setZone([...new Set(data.map((c: any) => c.zona))].filter(Boolean).sort() as string[])
      setCircoscrizioni([...new Set(data.map((c: any) => c.circoscrizione))].filter(Boolean).sort() as string[])
    }
  }

  async function loadActivities() {
    setLoading(true); setError(null)
    let q = supabase
      .from('vista_report_ricerca')
      .select('causa, persone_servite_limite, totale_volontari, totale_ore_servizio_capped, fondi_donati_usd_capped, fondi_raccolti_usd_capped, sponsor_nome_account, sponsor_zona, sponsor_circoscrizione, data_inizio')
    if (anniSociali.length) {
      const orExpr = anniSociali.map((y) => { const { from, to } = getAnnoSocialeRange(y); return `and(data_inizio.gte.${from},data_inizio.lte.${to})` }).join(',')
      q = q.or(orExpr)
    }
    if (filtroDistretto.length === 0) {
      if (club.length) q = q.in('sponsor_nome_account', club)
      if (filtroZona.length) q = q.in('sponsor_zona', filtroZona)
      if (filtroCircoscrizione.length) q = q.in('sponsor_circoscrizione', filtroCircoscrizione)
    }
    const { data, error } = await q.range(0, 49999)
    if (error) setError('Errore nel caricamento. Riprova.')
    else setActivities(data || [])
    setLoading(false)
  }

  // Raggruppa per club → Totale/Amm/Service (somma anni) + ripartizione per singolo
  // anno sociale. Ordinato alfabeticamente per nome club.
  const { blocks, grand } = useMemo(() => {
    type Acc = ClubBlock & { years: Map<number, { tot: Agg; amm: Agg; srv: Agg }> }
    const map = new Map<string, Acc>()
    const grand = { tot: zero(), amm: zero(), srv: zero() }
    for (const a of activities) {
      const nome = a.sponsor_nome_account || '—'
      if (!map.has(nome)) map.set(nome, { nome, tot: zero(), amm: zero(), srv: zero(), perYear: [], years: new Map() })
      const b = map.get(nome)!
      const isAmm = a.causa === AMM
      add(b.tot, a); add(isAmm ? b.amm : b.srv, a)
      add(grand.tot, a); add(isAmm ? grand.amm : grand.srv, a)
      const ay = annoStartOf(a.data_inizio)
      if (ay != null) {
        if (!b.years.has(ay)) b.years.set(ay, { tot: zero(), amm: zero(), srv: zero() })
        const yb = b.years.get(ay)!
        add(yb.tot, a); add(isAmm ? yb.amm : yb.srv, a)
      }
    }
    const blocks: ClubBlock[] = [...map.values()]
      .sort((x, y) => x.nome.localeCompare(y.nome, 'it'))
      .map((b) => ({
        nome: b.nome, tot: b.tot, amm: b.amm, srv: b.srv,
        perYear: [...b.years.entries()]
          .sort((a, c) => a[0] - c[0])
          .map(([year, v]) => ({ year, label: getAnnoSocialeRange(year).label, tot: v.tot, amm: v.amm, srv: v.srv })),
      }))
    return { blocks, grand }
  }, [activities])

  const annoLabel = anniSociali.length
    ? [...anniSociali].sort((a, b) => a - b).map((y) => getAnnoSocialeRange(y).label).join(', ')
    : 'tutti gli anni'
  const haSelezione = club.length > 0 || filtroZona.length > 0 || filtroCircoscrizione.length > 0 || filtroDistretto.length > 0

  function esportaExcel() {
    const rows: any[] = []
    const push = (area: string, sez: string, a: Agg) => rows.push({
      area, sez,
      att: a.att, att_pct: pct(a.att, grand.tot.att),
      pers: Math.round(a.pers), pers_pct: pct(a.pers, grand.tot.pers),
      vol: Math.round(a.vol), vol_pct: pct(a.vol, grand.tot.vol),
      ore: Math.round(a.ore), ore_pct: pct(a.ore, grand.tot.ore),
      donati: Math.round(a.donati), raccolti: Math.round(a.raccolti),
      racc_don: sez === 'Totale' ? Math.round(ratio(a.raccolti, a.donati)) : '',
    })
    push('TOTALI GENERALI', 'Totale', grand.tot); push('TOTALI GENERALI', 'Amministrazione', grand.amm); push('TOTALI GENERALI', 'Service', grand.srv)
    blocks.forEach((b) => {
      push(b.nome, 'Totale', b.tot); push(b.nome, 'Amministrazione', b.amm); push(b.nome, 'Service', b.srv)
      if (anniSociali.length > 1 && b.perYear.length > 1) {
        b.perYear.forEach((y) => {
          const area = `${b.nome} · ${y.label}`
          push(area, 'Totale', y.tot); push(area, 'Amministrazione', y.amm); push(area, 'Service', y.srv)
        })
      }
    })
    exportToExcel(rows, [
      { header: 'Area / Club', accessor: (r: any) => r.area },
      { header: 'Sezione', accessor: (r: any) => r.sez },
      { header: 'Attività', accessor: (r: any) => r.att },
      { header: '% Att.', accessor: (r: any) => r.att_pct + '%' },
      { header: 'Persone servite', accessor: (r: any) => r.pers },
      { header: '% Pers.', accessor: (r: any) => r.pers_pct + '%' },
      { header: 'Volontari', accessor: (r: any) => r.vol },
      { header: '% Vol.', accessor: (r: any) => r.vol_pct + '%' },
      { header: 'Ore volontari', accessor: (r: any) => r.ore },
      { header: '% Ore', accessor: (r: any) => r.ore_pct + '%' },
      { header: 'Fondi donati (USD)', accessor: (r: any) => r.donati },
      { header: 'Fondi raccolti (USD)', accessor: (r: any) => r.raccolti },
      { header: '% Racc./Don.', accessor: (r: any) => (r.racc_don === '' ? '' : r.racc_don + '%') },
    ], `donazioni_attivita_${todayStamp()}`, 'Donazioni e attività')
  }

  if (!isClient) return null

  // Blocco (Totali generali o singolo club): finanziario + tabella attività
  function AreaBlock({ nome, tot, amm, srv, head = false, sub = false }: { nome: string; tot: Agg; amm: Agg; srv: Agg; head?: boolean; sub?: boolean }) {
    const cell = (v: number, den: number) => `${fmt(v)} (${pct(v, den)}%)`
    const g = grand.tot
    const R = (label: string, a: Agg) => (
      <TableRow className="cv-row print:hover:bg-transparent">
        <TableCell className="font-medium whitespace-nowrap">{label}</TableCell>
        <TableCell className="tabular-nums text-right whitespace-nowrap">{cell(a.att, g.att)}</TableCell>
        <TableCell className="tabular-nums text-right whitespace-nowrap">{cell(a.pers, g.pers)}</TableCell>
        <TableCell className="tabular-nums text-right whitespace-nowrap">{cell(a.vol, g.vol)}</TableCell>
        <TableCell className="tabular-nums text-right whitespace-nowrap">{cell(a.ore, g.ore)}</TableCell>
      </TableRow>
    )
    return (
      <div className={`rounded-lg px-4 py-3 ${head ? 'border-2 border-primary/30 bg-primary/5' : sub ? 'border border-border/40 bg-background/40' : 'border border-border/60 bg-muted/20'} print:border-black print:bg-transparent`}>
        <p className={`font-bold uppercase tracking-wide mb-2 print:text-black ${head ? 'text-primary text-sm' : sub ? 'text-foreground text-xs' : 'text-foreground text-sm'}`}>
          {head ? 'Totali Generali' : nome}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-2">
          <span><span className="text-muted-foreground print:text-black">Fondi donati </span><span className="font-bold tabular-nums">$ {fmt(tot.donati)}</span></span>
          <span><span className="text-muted-foreground print:text-black">Fondi raccolti </span><span className="font-bold tabular-nums">$ {fmt(tot.raccolti)}</span></span>
          <span><span className="text-muted-foreground print:text-black">Racc./Don. </span><span className="font-bold tabular-nums">{ratio(tot.raccolti, tot.donati).toFixed(2)}%</span></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs cv-table">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Sezione</TableHead>
                <TableHead className="text-right whitespace-nowrap">Attività</TableHead>
                <TableHead className="text-right whitespace-nowrap">Persone servite</TableHead>
                <TableHead className="text-right whitespace-nowrap">Totale volontari</TableHead>
                <TableHead className="text-right whitespace-nowrap">Totale ore volontari</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {R('Totale', tot)}
              {R('Amministrazione', amm)}
              {R('Service', srv)}
            </TableBody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area print-landscape">
      <motion.div variants={itemVariants} className="mb-4 print-hide">
        <Link href="/attivita/rapporti">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Rapporti Attività
          </Button>
        </Link>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Struttura Dati Donazioni e Attività per Club
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6 print:text-black">
        {haSelezione
          ? <>{filtroDistretto.length > 0 ? 'Tutto il Distretto 108 LA' : club.length > 0 ? `${club.length} club` : filtroZona.length > 0 ? `Zone: ${filtroZona.join(', ')}` : `Circoscrizioni: ${filtroCircoscrizione.join(', ')}`} · Anno sociale <strong className="text-foreground print:text-black">{annoLabel}</strong> · {blocks.length} club · {activities.length} attività · <span className="italic">le percentuali sono sul Totale Generale</span></>
          : 'Seleziona un club, una zona, una circoscrizione o l’intero Distretto per generare il prospetto'}
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2 flex-wrap print-hide">
        <Button variant="outline" onClick={esportaExcel} size="sm" className="text-xs gap-1.5" disabled={activities.length === 0}>
          <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
        </Button>
        <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={activities.length === 0}>
          <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Club (selezione multipla)</p>
                <MultiSelect options={clubs} selected={club} onChange={setClub} placeholder="Seleziona club…" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Zone</p>
                <MultiSelect options={zone} selected={filtroZona} onChange={setFiltroZona} placeholder="Tutte le zone" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Circoscrizioni</p>
                <MultiSelect options={circoscrizioni} selected={filtroCircoscrizione} onChange={setFiltroCircoscrizione} placeholder="Tutte le circoscrizioni" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure tutto il Distretto</p>
                <MultiSelect options={['108 LA']} selected={filtroDistretto} onChange={setFiltroDistretto} placeholder="108 LA" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Anno sociale (uno o più)</p>
                <MultiSelect
                  options={anniOpzioni.map((a) => a.label)}
                  selected={[...anniSociali].sort((a, b) => b - a).map((y) => getAnnoSocialeRange(y).label)}
                  onChange={(labels) => setAnniSociali(labels.map((l) => anniOpzioni.find((a) => a.label === l)!.value))}
                  placeholder="Anno sociale"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Blocchi per club in ordine alfabetico, con i Totali Generali in testa. Importi in USD (valori capped LCI).
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
          <CardContent className="print:p-0 space-y-4">
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : !haSelezione ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Seleziona un club, una zona, una circoscrizione o l&apos;intero Distretto</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessuna attività trovata per la selezione · anno {annoLabel}</span>
              </div>
            ) : (
              <>
                <AreaBlock nome="Totali Generali" tot={grand.tot} amm={grand.amm} srv={grand.srv} head />
                {blocks.map((b) => (
                  <div key={b.nome} className="space-y-2">
                    <AreaBlock nome={b.nome} tot={b.tot} amm={b.amm} srv={b.srv} />
                    {anniSociali.length > 1 && b.perYear.length > 1 && (
                      <div className="ml-3 sm:ml-6 pl-3 border-l-2 border-primary/20 space-y-2">
                        {b.perYear.map((y) => (
                          <AreaBlock key={y.year} nome={`${b.nome} · ${y.label}`} tot={y.tot} amm={y.amm} srv={y.srv} sub />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
