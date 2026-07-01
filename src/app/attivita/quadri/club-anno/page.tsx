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
import { ArrowLeft, Printer, Activity, FileSpreadsheet } from 'lucide-react'
import { exportToExcel, todayStamp, fmtDateIT } from '@/lib/excel-export'
import { getCurrentAnnoSocialeStart, getAnnoSocialeRange, getRecentAnniSociali } from '@/lib/anno-sociale'

export default function QuadroClubAnnoPage() {
  const [club, setClub] = useState<string[]>([])
  const anniOpzioni = useMemo(() => getRecentAnniSociali(8), [])
  const [anniSociali, setAnniSociali] = useState<number[]>([getCurrentAnnoSocialeStart()])
  const [clubs, setClubs] = useState<string[]>([])
  const [zone, setZone] = useState<string[]>([])
  const [filtroZona, setFiltroZona] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [filtroCircoscrizione, setFiltroCircoscrizione] = useState<string[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient || (club.length === 0 && filtroZona.length === 0 && filtroCircoscrizione.length === 0)) { setActivities([]); return }
    loadActivities()
  }, [isClient, club, filtroZona, filtroCircoscrizione, anniSociali])

  async function loadFilterOptions() {
    // Da tabella club (completa) per non dipendere dal volume di attività
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
    let q = supabase
      .from('vista_report_ricerca')
      .select('id_attivita, data_inizio, stato, titolo, causa, tipo_progetto, persone_servite_limite, totale_volontari, totale_ore_servizio_capped, fondi_donati_usd_capped, organizzazione_beneficiata, fondi_raccolti_usd_capped, sponsor_nome_account, sponsor_zona, sponsor_circoscrizione')
    // Anno sociale multi-selezione: unione (OR) degli intervalli 1 lug → 30 giu
    if (anniSociali.length) {
      const orExpr = anniSociali.map((y) => { const { from, to } = getAnnoSocialeRange(y); return `and(data_inizio.gte.${from},data_inizio.lte.${to})` }).join(',')
      q = q.or(orExpr)
    }
    if (club.length) q = q.in('sponsor_nome_account', club)
    if (filtroZona.length) q = q.in('sponsor_zona', filtroZona)
    if (filtroCircoscrizione.length) q = q.in('sponsor_circoscrizione', filtroCircoscrizione)
    const { data, error } = await q
      .order('sponsor_nome_account', { ascending: true })
      .order('data_inizio', { ascending: true })
      .range(0, 49999)
    if (error) setError('Errore nel caricamento. Riprova.')
    else setActivities(data || [])
    setLoading(false)
  }

  const totali = useMemo(() => activities.reduce((acc, a) => ({
    persone: acc.persone + (Number(a.persone_servite_limite) || 0),
    volontari: acc.volontari + (Number(a.totale_volontari) || 0),
    ore: acc.ore + (Number(a.totale_ore_servizio_capped) || 0),
    donati: acc.donati + (Number(a.fondi_donati_usd_capped) || 0),
    raccolti: acc.raccolti + (Number(a.fondi_raccolti_usd_capped) || 0),
  }), { persone: 0, volontari: 0, ore: 0, donati: 0, raccolti: 0 }), [activities])

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''
  const fmt = (n: number, digits = 0) => n.toLocaleString('it-IT', { maximumFractionDigits: digits })
  const annoLabel = anniSociali.length
    ? [...anniSociali].sort((a, b) => a - b).map((y) => getAnnoSocialeRange(y).label).join(', ')
    : 'tutti gli anni'

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area print-landscape">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 print-hide gap-2 flex-wrap">
        <Link href="/attivita">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna ad Attività
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportToExcel(
              activities,
              [
                { header: 'Club', accessor: (a: any) => a.sponsor_nome_account },
                { header: 'Circoscrizione', accessor: (a: any) => a.sponsor_circoscrizione ?? '' },
                { header: 'Data inizio', accessor: (a: any) => fmtDateIT(a.data_inizio) },
                { header: 'Stato', accessor: (a: any) => a.stato },
                { header: 'Titolo', accessor: (a: any) => a.titolo },
                { header: 'Causa', accessor: (a: any) => a.causa },
                { header: 'Tipo progetto', accessor: (a: any) => a.tipo_progetto },
                { header: 'Persone servite (cap)', accessor: (a: any) => Number(a.persone_servite_limite) || 0 },
                { header: 'Volontari', accessor: (a: any) => Number(a.totale_volontari) || 0 },
                { header: 'Ore (cap)', accessor: (a: any) => Number(a.totale_ore_servizio_capped) || 0 },
                { header: 'Donati USD (cap)', accessor: (a: any) => Number(a.fondi_donati_usd_capped) || 0 },
                { header: 'Org. beneficiata', accessor: (a: any) => a.organizzazione_beneficiata ?? '' },
                { header: 'Raccolti USD (cap)', accessor: (a: any) => Number(a.fondi_raccolti_usd_capped) || 0 },
              ],
              `attivita_club_anno_${todayStamp()}`,
              'Attività club'
            )}
            size="sm"
            className="text-xs gap-1.5"
            disabled={activities.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={activities.length === 0}>
            <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
          </Button>
        </div>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Classificazione delle Attività comunicate dal club nell&apos;anno sociale
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6 print:text-black">
        {club.length > 0 || filtroZona.length > 0 || filtroCircoscrizione.length > 0 ? (
          <><strong className="text-foreground print:text-black">
            {club.length > 0
              ? `${club.length} club selezionati`
              : filtroZona.length > 0
                ? `Zone: ${filtroZona.join(', ')}`
                : `Circoscrizioni: ${filtroCircoscrizione.join(', ')}`}
          </strong> · Anno sociale <strong className="text-foreground print:text-black">{annoLabel}</strong> · {activities.length} attività</>
        ) : 'Seleziona uno o più club (oppure una o più zone o circoscrizioni) per visualizzare le attività'}
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            {/* Filtri territoriali — ordine fisso Club, Zona, Circoscrizione, Distretto (+ Anno sociale) */}
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
                <p className="text-[10px] text-muted-foreground mb-1">Distretto</p>
                <MultiSelect options={['108 LA']} selected={[]} onChange={() => {}} placeholder="108 LA" />
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
              Puoi selezionare uno o più Club, oppure scegliere una o più Zone per includere tutti i loro club. I criteri si sommano (AND).
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
          <CardHeader className="pb-3 print-hide">
            <CardTitle className="text-base font-semibold">Elenco Attività ({activities.length})</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0">
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : club.length === 0 && filtroZona.length === 0 && filtroCircoscrizione.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Seleziona uno o più club, oppure una o più zone o circoscrizioni</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessuna attività trovata per la selezione · anno {annoLabel}</span>
              </div>
            ) : (
              <>
              {/* Complessivo in cima (richiesta Direttivo) */}
              <div className="mb-4 rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-3 print:border-black print:bg-transparent">
                <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2 print:text-black">Complessivo delle attività</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div><span className="text-muted-foreground print:text-black">Persone (limite max)</span><br /><span className="font-bold tabular-nums">{fmt(totali.persone)}</span></div>
                  <div><span className="text-muted-foreground print:text-black">Volontari</span><br /><span className="font-bold tabular-nums">{fmt(totali.volontari)}</span></div>
                  <div><span className="text-muted-foreground print:text-black">Ore capped</span><br /><span className="font-bold tabular-nums">{fmt(totali.ore)}</span></div>
                  <div><span className="text-muted-foreground print:text-black">Donati USD capped</span><br /><span className="font-bold tabular-nums">{fmt(totali.donati)}</span></div>
                  <div><span className="text-muted-foreground print:text-black">Raccolti USD capped</span><br /><span className="font-bold tabular-nums">{fmt(totali.raccolti)}</span></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs cv-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Club</TableHead>
                      <TableHead className="whitespace-nowrap">Circ.</TableHead>
                      <TableHead className="whitespace-nowrap">Data inizio</TableHead>
                      <TableHead className="whitespace-nowrap">Stato</TableHead>
                      <TableHead>Titolo</TableHead>
                      <TableHead className="whitespace-nowrap">Causa</TableHead>
                      <TableHead className="whitespace-nowrap">Tipo progetto</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Persone servite</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Volontari</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Ore capped</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Donati USD capped</TableHead>
                      <TableHead>Org. beneficiata</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Raccolti USD capped</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((a: any) => (
                      <TableRow key={a.id_attivita} className="cv-row hover:bg-muted/40 print:hover:bg-transparent">
                        <TableCell className="whitespace-nowrap font-medium">{a.sponsor_nome_account}</TableCell>
                        <TableCell className="whitespace-nowrap">{a.sponsor_circoscrizione}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(a.data_inizio)}</TableCell>
                        <TableCell className="whitespace-nowrap">{a.stato}</TableCell>
                        <TableCell>{a.titolo}</TableCell>
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
                  </TableBody>
                </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
