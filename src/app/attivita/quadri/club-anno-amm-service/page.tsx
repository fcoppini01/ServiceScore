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
import { ArrowLeft, Printer, Activity } from 'lucide-react'
import { getCurrentAnnoSocialeStart, getAnnoSocialeRange, getRecentAnniSociali } from '@/lib/anno-sociale'

const AMMINISTRAZIONE_CAUSA = 'Amministrazione'

type Totali = { persone: number; volontari: number; ore: number; donati: number; raccolti: number }

function sumTotali(rows: any[]): Totali {
  return rows.reduce((acc, a) => ({
    persone: acc.persone + (Number(a.persone_servite_limite) || 0),
    volontari: acc.volontari + (Number(a.totale_volontari) || 0),
    ore: acc.ore + (Number(a.totale_ore_servizio_capped) || 0),
    donati: acc.donati + (Number(a.fondi_donati_usd_capped) || 0),
    raccolti: acc.raccolti + (Number(a.fondi_raccolti_usd_capped) || 0),
  }), { persone: 0, volontari: 0, ore: 0, donati: 0, raccolti: 0 })
}

const fmt = (n: number, digits = 0) => n.toLocaleString('it-IT', { maximumFractionDigits: digits })
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''

function AttivitaTable({ rows, label, color }: { rows: any[]; label: string; color: string }) {
  const totali = sumTotali(rows)
  if (rows.length === 0) {
    return (
      <div>
        <h2 className={`text-sm font-bold mb-2 pb-1 border-b-2 ${color} print:text-black print:border-black`}>
          {label} <span className="text-muted-foreground font-normal print:text-black">· 0 attività</span>
        </h2>
        <p className="text-xs text-muted-foreground italic py-3">Nessuna attività</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <h2 className={`text-sm font-bold mb-2 pb-1 border-b-2 ${color} print:text-black print:border-black`}>
        {label} <span className="text-muted-foreground font-normal print:text-black">· {rows.length} attività</span>
      </h2>
      <table className="w-full text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Data inizio</TableHead>
            <TableHead className="whitespace-nowrap">Stato</TableHead>
            <TableHead>Titolo</TableHead>
            <TableHead className="whitespace-nowrap">Causa</TableHead>
            <TableHead className="whitespace-nowrap">Tipo progetto</TableHead>
            <TableHead className="whitespace-nowrap text-right">Persone (limite max)</TableHead>
            <TableHead className="whitespace-nowrap text-right">Volontari</TableHead>
            <TableHead className="whitespace-nowrap text-right">Ore capped</TableHead>
            <TableHead className="whitespace-nowrap text-right">Donati USD capped</TableHead>
            <TableHead>Org. beneficiata</TableHead>
            <TableHead className="whitespace-nowrap text-right">Raccolti USD capped</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a: any) => (
            <TableRow key={a.id_attivita} className="hover:bg-muted/40 print:hover:bg-transparent">
              <TableCell className="whitespace-nowrap">{formatDate(a.data_inizio)}</TableCell>
              <TableCell className="whitespace-nowrap">{a.stato}</TableCell>
              <TableCell className="font-medium">{a.titolo}</TableCell>
              <TableCell className="whitespace-nowrap">{a.causa}</TableCell>
              <TableCell className="whitespace-nowrap">{a.tipo_progetto}</TableCell>
              <TableCell className="tabular-nums text-right">{fmt(Number(a.persone_servite_limite) || 0)}</TableCell>
              <TableCell className="tabular-nums text-right">{fmt(Number(a.totale_volontari) || 0)}</TableCell>
              <TableCell className="tabular-nums text-right">{fmt(Number(a.totale_ore_servizio_capped) || 0)}</TableCell>
              <TableCell className="tabular-nums text-right">{fmt(Number(a.fondi_donati_usd_capped) || 0)}</TableCell>
              <TableCell>{a.organizzazione_beneficiata ?? ''}</TableCell>
              <TableCell className="tabular-nums text-right">{fmt(Number(a.fondi_raccolti_usd_capped) || 0)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted/40 print:bg-transparent print:border-t-2 print:border-black">
            <TableCell colSpan={5} className="text-right">SUBTOTALE {label}</TableCell>
            <TableCell className="tabular-nums text-right">{fmt(totali.persone)}</TableCell>
            <TableCell className="tabular-nums text-right">{fmt(totali.volontari)}</TableCell>
            <TableCell className="tabular-nums text-right">{fmt(totali.ore)}</TableCell>
            <TableCell className="tabular-nums text-right">{fmt(totali.donati)}</TableCell>
            <TableCell></TableCell>
            <TableCell className="tabular-nums text-right">{fmt(totali.raccolti)}</TableCell>
          </TableRow>
        </TableBody>
      </table>
    </div>
  )
}

export default function QuadroClubAnnoAmmServicePage() {
  const [club, setClub] = useState<string[]>([])
  const [annoSociale, setAnnoSociale] = useState<number>(getCurrentAnnoSocialeStart())
  const [clubs, setClubs] = useState<string[]>([])
  const [zone, setZone] = useState<string[]>([])
  const [filtroZona, setFiltroZona] = useState<string[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient || (club.length === 0 && filtroZona.length === 0)) { setActivities([]); return }
    loadActivities()
  }, [isClient, club, filtroZona, annoSociale])

  async function loadFilterOptions() {
    const [clubsRes, zoneRes] = await Promise.all([
      supabase.from('vista_report_ricerca').select('sponsor_nome_account').not('sponsor_nome_account', 'is', null).range(0, 9999),
      supabase.from('vista_report_ricerca').select('sponsor_zona').not('sponsor_zona', 'is', null).range(0, 9999),
    ])
    if (clubsRes.data) setClubs([...new Set(clubsRes.data.map((c: any) => c.sponsor_nome_account))].filter(Boolean).sort() as string[])
    if (zoneRes.data) setZone([...new Set(zoneRes.data.map((z: any) => z.sponsor_zona))].filter(Boolean).sort() as string[])
  }

  async function loadActivities() {
    setLoading(true)
    setError(null)
    const { from, to } = getAnnoSocialeRange(annoSociale)
    let q = supabase
      .from('vista_report_ricerca')
      .select('id_attivita, data_inizio, stato, titolo, causa, tipo_progetto, persone_servite_limite, totale_volontari, totale_ore_servizio_capped, fondi_donati_usd_capped, organizzazione_beneficiata, fondi_raccolti_usd_capped, sponsor_nome_account, sponsor_zona')
      .gte('data_inizio', from)
      .lte('data_inizio', to)
    if (club.length) q = q.in('sponsor_nome_account', club)
    if (filtroZona.length) q = q.in('sponsor_zona', filtroZona)
    const { data, error } = await q.order('data_inizio', { ascending: true }).range(0, 9999)
    if (error) setError('Errore nel caricamento. Riprova.')
    else setActivities(data || [])
    setLoading(false)
  }

  const amministrazione = useMemo(() => activities.filter(a => a.causa === AMMINISTRAZIONE_CAUSA), [activities])
  const service = useMemo(() => activities.filter(a => a.causa !== AMMINISTRAZIONE_CAUSA), [activities])
  const totaliComplessivi = useMemo(() => sumTotali(activities), [activities])

  const annoLabel = getAnnoSocialeRange(annoSociale).label

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area print-landscape">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 print-hide gap-2 flex-wrap">
        <Link href="/attivita">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna ad Attività
          </Button>
        </Link>
        <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={activities.length === 0}>
          <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
        </Button>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Quadro delle Attività del Club con Evidenza di Amministrazione e Service
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6 print:text-black">
        {club.length > 0 || filtroZona.length > 0 ? (
          <><strong className="text-foreground print:text-black">
            {club.length > 0 ? `${club.length} club selezionati` : `Zone: ${filtroZona.join(', ')}`}
          </strong> · Anno sociale <strong className="text-foreground print:text-black">{annoLabel}</strong> · {activities.length} attività ({amministrazione.length} Amministrazione, {service.length} Service)</>
        ) : 'Seleziona uno o più club (oppure una o più zone) per visualizzare le attività'}
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Club (selezione multipla)</p>
                <MultiSelect options={clubs} selected={club} onChange={setClub} placeholder="Seleziona club…" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Zone (in alternativa)</p>
                <MultiSelect options={zone} selected={filtroZona} onChange={setFiltroZona} placeholder="Tutte le zone" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Anno sociale</p>
                <select
                  value={annoSociale}
                  onChange={(e) => setAnnoSociale(parseInt(e.target.value))}
                  className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background/50 outline-none focus:ring-1 focus:ring-ring"
                >
                  {getRecentAnniSociali(8).map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Puoi selezionare uno o più Club, oppure scegliere una o più Zone per includere tutti i loro club.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
          <CardContent className="print:p-0 space-y-8">
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : club.length === 0 && filtroZona.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Seleziona uno o più club, oppure una o più zone</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessuna attività trovata per la selezione · anno {annoLabel}</span>
              </div>
            ) : (
              <>
                <AttivitaTable rows={service} label="SERVICE" color="text-blue-700 border-blue-600/40" />
                <AttivitaTable rows={amministrazione} label="AMMINISTRAZIONE" color="text-amber-700 border-amber-600/40" />

                {/* Totali complessivi */}
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-3 print:border-black print:bg-transparent">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2 print:text-black">Totali complessivi (Service + Amministrazione)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div><span className="text-muted-foreground print:text-black">Persone (limite max)</span><br /><span className="font-bold tabular-nums">{fmt(totaliComplessivi.persone)}</span></div>
                    <div><span className="text-muted-foreground print:text-black">Volontari</span><br /><span className="font-bold tabular-nums">{fmt(totaliComplessivi.volontari)}</span></div>
                    <div><span className="text-muted-foreground print:text-black">Ore capped</span><br /><span className="font-bold tabular-nums">{fmt(totaliComplessivi.ore)}</span></div>
                    <div><span className="text-muted-foreground print:text-black">Donati USD capped</span><br /><span className="font-bold tabular-nums">{fmt(totaliComplessivi.donati)}</span></div>
                    <div><span className="text-muted-foreground print:text-black">Raccolti USD capped</span><br /><span className="font-bold tabular-nums">{fmt(totaliComplessivi.raccolti)}</span></div>
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
