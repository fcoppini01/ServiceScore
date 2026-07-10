'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, Activity, FileSpreadsheet } from 'lucide-react'
import { exportToExcel, todayStamp } from '@/lib/excel-export'
import { getCurrentAnnoSocialeStart, getAnnoSocialeRange, getAnniSociali } from '@/lib/anno-sociale'

// Versione TOTALIZZATA di "Amministrazione vs Service": mostra SOLO i totali
// complessivi + i subtotali Service e Amministrazione, senza l'elenco delle attività.

const AMMINISTRAZIONE_CAUSA = 'Amministrazione'

type Totali = { attivita: number; persone: number; volontari: number; ore: number; donati: number; raccolti: number }

function sumTotali(rows: any[]): Totali {
  return rows.reduce((acc, a) => ({
    attivita: acc.attivita + 1,
    persone: acc.persone + (Number(a.persone_servite_limite) || 0),
    volontari: acc.volontari + (Number(a.totale_volontari) || 0),
    ore: acc.ore + (Number(a.totale_ore_servizio_capped) || 0),
    donati: acc.donati + (Number(a.fondi_donati_usd_capped) || 0),
    raccolti: acc.raccolti + (Number(a.fondi_raccolti_usd_capped) || 0),
  }), { attivita: 0, persone: 0, volontari: 0, ore: 0, donati: 0, raccolti: 0 })
}

const fmt = (n: number, digits = 0) => n.toLocaleString('it-IT', { maximumFractionDigits: digits })

function TotaliBox({ label, t, accent = false }: { label: string; t: Totali; accent?: boolean }) {
  return (
    <div className={`rounded-lg px-4 py-3 print:border-black print:bg-transparent ${accent ? 'border-2 border-primary/30 bg-primary/5' : 'border border-border/60 bg-muted/30'}`}>
      <p className={`text-xs font-bold uppercase tracking-wide mb-2 print:text-black ${accent ? 'text-primary' : 'text-foreground'}`}>{label} · {fmt(t.attivita)} attività</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div><span className="text-muted-foreground print:text-black">Persone (limite max)</span><br /><span className="font-bold tabular-nums">{fmt(t.persone)}</span></div>
        <div><span className="text-muted-foreground print:text-black">Volontari</span><br /><span className="font-bold tabular-nums">{fmt(t.volontari)}</span></div>
        <div><span className="text-muted-foreground print:text-black">Ore capped</span><br /><span className="font-bold tabular-nums">{fmt(t.ore)}</span></div>
        <div><span className="text-muted-foreground print:text-black">Donati (dollari)</span><br /><span className="font-bold tabular-nums">{fmt(t.donati)}</span></div>
        <div><span className="text-muted-foreground print:text-black">Raccolti (dollari)</span><br /><span className="font-bold tabular-nums">{fmt(t.raccolti)}</span></div>
      </div>
    </div>
  )
}

export default function QuadroAmmServiceTotaliPage() {
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

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

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
    setLoading(true)
    setError(null)
    // Servono solo causa + campi numerici per i totali (niente elenco righe)
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

  const amministrazione = useMemo(() => activities.filter(a => a.causa === AMMINISTRAZIONE_CAUSA), [activities])
  const service = useMemo(() => activities.filter(a => a.causa !== AMMINISTRAZIONE_CAUSA), [activities])
  const totService = useMemo(() => sumTotali(service), [service])
  const totAmm = useMemo(() => sumTotali(amministrazione), [amministrazione])
  const totComplessivi = useMemo(() => sumTotali(activities), [activities])

  const annoLabel = anniSociali.length
    ? [...anniSociali].sort((a, b) => a - b).map((y) => getAnnoSocialeRange(y).label).join(', ')
    : 'tutti gli anni'

  function esportaExcel() {
    const rows = [
      { sez: 'SERVICE', t: totService },
      { sez: 'AMMINISTRAZIONE', t: totAmm },
      { sez: 'TOTALE COMPLESSIVO', t: totComplessivi },
    ]
    exportToExcel(
      rows,
      [
        { header: 'Sezione', accessor: (r: any) => r.sez },
        { header: 'Attività', accessor: (r: any) => r.t.attivita },
        { header: 'Persone (limite max)', accessor: (r: any) => r.t.persone },
        { header: 'Volontari', accessor: (r: any) => r.t.volontari },
        { header: 'Ore capped', accessor: (r: any) => r.t.ore },
        { header: 'Donati (dollari)', accessor: (r: any) => r.t.donati },
        { header: 'Raccolti (dollari)', accessor: (r: any) => r.t.raccolti },
      ],
      `attivita_amm_service_totali_${todayStamp()}`,
      'Amm vs Service - Totali'
    )
  }

  if (!isClient) return null
  const haSelezione = club.length > 0 || filtroZona.length > 0 || filtroCircoscrizione.length > 0 || filtroDistretto.length > 0

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 print-hide gap-2 flex-wrap">
        <Link href="/attivita/rapporti">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Rapporti Attività
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={esportaExcel} size="sm" className="text-xs gap-1.5" disabled={activities.length === 0}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={activities.length === 0}>
            <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
          </Button>
        </div>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Classificazione Amministrazione vs Service — Totalizzato
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6 print:text-black">
        {haSelezione ? (
          <><strong className="text-foreground print:text-black">
            {filtroDistretto.length > 0
              ? 'Tutto il Distretto 108 LA'
              : club.length > 0
                ? `${club.length} club selezionati`
                : filtroZona.length > 0
                  ? `Zone: ${filtroZona.join(', ')}`
                  : `Circoscrizioni: ${filtroCircoscrizione.join(', ')}`}
          </strong> · Anno sociale <strong className="text-foreground print:text-black">{annoLabel}</strong> · {activities.length} attività ({amministrazione.length} Amministrazione, {service.length} Service)</>
        ) : 'Seleziona uno o più club (oppure zone, circoscrizioni o l’intero Distretto) per i totali'}
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Club (selezione multipla)</p>
                <MultiSelect options={clubs} selected={club} onChange={setClub} placeholder="Seleziona club…" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Zone (in alternativa)</p>
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
              Versione totalizzata: mostra solo totali complessivi e subtotali Service / Amministrazione (senza l&apos;elenco delle attività).
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
                <span className="text-sm">Seleziona uno o più club, oppure zone, circoscrizioni o l&apos;intero Distretto</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessuna attività trovata per la selezione · anno {annoLabel}</span>
              </div>
            ) : (
              <>
                <TotaliBox label="Totale complessivo (Service + Amministrazione)" t={totComplessivi} accent />
                <TotaliBox label="Subtotale SERVICE" t={totService} />
                <TotaliBox label="Subtotale AMMINISTRAZIONE" t={totAmm} />
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
