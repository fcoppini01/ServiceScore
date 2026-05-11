'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { SortableHead, MobileSortSelect, type SortState, nextSort } from '@/components/ui/sortable-head'
import { motion, AnimatePresence } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Activity } from 'lucide-react'

const PAGE_SIZE = 20

interface Filters {
  search: string
  stato: string[]
  zona: string[]
  causa: string[]
  // Advanced — Categorizzazione
  tipoProgetto: string[]
  livelloAttivita: string[]
  circoscrizione: string[]
  club: string[]
  organizzazioneBeneficiata: string
  rapportoCompleto: string
  attivitaDistintiva: string
  finanziateLcif: string
  // Advanced — Date
  dataInizioDa: string
  dataInizioA: string
  dataConclusioneDa: string
  dataConclusioneA: string
  // Advanced — Impatto
  minPersone: string; maxPersone: string
  minPersoneLimite: string; maxPersoneLimite: string
  minVolontari: string; maxVolontari: string
  minOre: string; maxOre: string
  minOreCapped: string; maxOreCapped: string
  // Advanced — Finanziario
  minFondiDonati: string; maxFondiDonati: string
  minFondiDonatiCapped: string; maxFondiDonatiCapped: string
  minDonazioneLcif: string; maxDonazioneLcif: string
  minFondiRaccolti: string; maxFondiRaccolti: string
  minFondiRaccoltiCapped: string; maxFondiRaccoltiCapped: string
  // Advanced — Ambiente
  minAlberi: string; maxAlberi: string
}

const EMPTY_FILTERS: Filters = {
  search: '', stato: [], zona: [], causa: [],
  tipoProgetto: [], livelloAttivita: [], circoscrizione: [], club: [],
  organizzazioneBeneficiata: '', rapportoCompleto: '', attivitaDistintiva: '', finanziateLcif: '',
  dataInizioDa: '', dataInizioA: '', dataConclusioneDa: '', dataConclusioneA: '',
  minPersone: '', maxPersone: '', minPersoneLimite: '', maxPersoneLimite: '',
  minVolontari: '', maxVolontari: '', minOre: '', maxOre: '', minOreCapped: '', maxOreCapped: '',
  minFondiDonati: '', maxFondiDonati: '', minFondiDonatiCapped: '', maxFondiDonatiCapped: '',
  minDonazioneLcif: '', maxDonazioneLcif: '', minFondiRaccolti: '', maxFondiRaccolti: '',
  minFondiRaccoltiCapped: '', maxFondiRaccoltiCapped: '',
  minAlberi: '', maxAlberi: '',
}

function countAdvancedFilters(f: Filters) {
  let c = 0
  if (f.stato.length) c++
  if (f.zona.length) c++
  if (f.causa.length) c++
  if (f.tipoProgetto.length) c++
  if (f.livelloAttivita.length) c++
  if (f.organizzazioneBeneficiata) c++
  if (f.rapportoCompleto) c++
  if (f.attivitaDistintiva) c++
  if (f.finanziateLcif) c++
  if (f.dataInizioDa || f.dataInizioA) c++
  if (f.dataConclusioneDa || f.dataConclusioneA) c++
  if (f.minPersone || f.maxPersone) c++
  if (f.minPersoneLimite || f.maxPersoneLimite) c++
  if (f.minVolontari || f.maxVolontari) c++
  if (f.minOre || f.maxOre) c++
  if (f.minOreCapped || f.maxOreCapped) c++
  if (f.minFondiDonati || f.maxFondiDonati) c++
  if (f.minFondiDonatiCapped || f.maxFondiDonatiCapped) c++
  if (f.minDonazioneLcif || f.maxDonazioneLcif) c++
  if (f.minFondiRaccolti || f.maxFondiRaccolti) c++
  if (f.minFondiRaccoltiCapped || f.maxFondiRaccoltiCapped) c++
  if (f.minAlberi || f.maxAlberi) c++
  return c
}

const STATO_COLORS: Record<string, string> = {
  'Comunicato': 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  'Pronto per comunicare i dati': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'Pianificato': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  'Bozza': 'bg-muted text-muted-foreground border-border',
}

function RangeRow({ label, minVal, maxVal, onMin, onMax, type = 'number', unit }: {
  label: string; minVal: string; maxVal: string
  onMin: (v: string) => void; onMax: (v: string) => void
  type?: string; unit?: string
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-1">{label}{unit ? ` (${unit})` : ''}</p>
      <div className="flex items-center gap-1.5">
        <Input type={type} placeholder="Da" value={minVal} onChange={(e) => onMin(e.target.value)} className="text-sm bg-background/50" />
        <span className="text-xs text-muted-foreground shrink-0">—</span>
        <Input type={type} placeholder="A" value={maxVal} onChange={(e) => onMax(e.target.value)} className="text-sm bg-background/50" />
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-1">{children}</p>
}

export default function AttivitaPage() {
  const [attivita, setAttivita] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [cause, setCause] = useState<string[]>([])
  const [tipiProgetto, setTipiProgetto] = useState<string[]>([])
  const [livelliAttivita, setLivelliAttivita] = useState<string[]>([])
  const [stati, setStati] = useState<string[]>([])
  const [clubs, setClubs] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [sort, setSort] = useState<SortState>({ field: 'data_inizio', dir: 'desc' })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { loadAttivita() }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters, page, sort, isClient])

  const handleSort = (field: string) => {
    setPage(0)
    setSort(s => nextSort(s, field, 'desc'))
  }

  async function loadFilterOptions() {
    const [zoneRes, circRes, causaRes, tipoRes, livelloRes, statiRes, clubsRes] = await Promise.all([
      supabase.from('vista_report_ricerca').select('sponsor_zona').not('sponsor_zona', 'is', null),
      supabase.from('vista_report_ricerca').select('sponsor_circoscrizione').not('sponsor_circoscrizione', 'is', null),
      supabase.from('vista_report_ricerca').select('causa').not('causa', 'is', null),
      supabase.from('vista_report_ricerca').select('tipo_progetto').not('tipo_progetto', 'is', null),
      supabase.from('vista_report_ricerca').select('livello_attivita').not('livello_attivita', 'is', null),
      supabase.from('vista_report_ricerca').select('stato').not('stato', 'is', null),
      supabase.from('vista_report_ricerca').select('sponsor_nome_account').not('sponsor_nome_account', 'is', null),
    ])
    if (zoneRes.data) setZone([...new Set(zoneRes.data.map(z => z.sponsor_zona))].filter(Boolean).sort() as string[])
    if (circRes.data) setCircoscrizioni([...new Set(circRes.data.map(c => c.sponsor_circoscrizione))].filter(Boolean).sort() as string[])
    if (causaRes.data) setCause([...new Set(causaRes.data.map(c => c.causa))].filter(Boolean).sort() as string[])
    if (tipoRes.data) setTipiProgetto([...new Set(tipoRes.data.map(t => t.tipo_progetto))].filter(Boolean).sort() as string[])
    if (livelloRes.data) setLivelliAttivita([...new Set(livelloRes.data.map(l => l.livello_attivita))].filter(Boolean).sort() as string[])
    if (statiRes.data) setStati([...new Set(statiRes.data.map(s => s.stato))].filter(Boolean).sort() as string[])
    if (clubsRes.data) setClubs([...new Set(clubsRes.data.map(c => c.sponsor_nome_account))].filter(Boolean).sort() as string[])
  }

  async function loadAttivita() {
    setLoading(true)
    setError(null)

    let query = supabase.from('vista_report_ricerca').select('*', { count: 'exact' })

    if (filters.search) query = query.or(`titolo.ilike.%${filters.search}%,descrizione.ilike.%${filters.search}%`)
    if (filters.stato.length) query = query.in('stato', filters.stato)
    if (filters.zona.length) query = query.in('sponsor_zona', filters.zona)
    if (filters.causa.length) query = query.in('causa', filters.causa)
    if (filters.tipoProgetto.length) query = query.in('tipo_progetto', filters.tipoProgetto)
    if (filters.livelloAttivita.length) query = query.in('livello_attivita', filters.livelloAttivita)
    if (filters.circoscrizione.length) query = query.in('sponsor_circoscrizione', filters.circoscrizione)
    if (filters.club.length) query = query.in('sponsor_nome_account', filters.club)
    if (filters.organizzazioneBeneficiata) query = query.ilike('organizzazione_beneficiata', `%${filters.organizzazioneBeneficiata}%`)
    if (filters.rapportoCompleto) query = query.eq('rapporto_completo', filters.rapportoCompleto === 'true')
    if (filters.attivitaDistintiva) query = query.eq('attivita_distintiva', filters.attivitaDistintiva === 'true')
    if (filters.finanziateLcif) query = query.eq('finanziata_lcif', filters.finanziateLcif === 'true')
    if (filters.dataInizioDa) query = query.gte('data_inizio', filters.dataInizioDa)
    if (filters.dataInizioA) query = query.lte('data_inizio', filters.dataInizioA)
    if (filters.dataConclusioneDa) query = query.gte('data_conclusione', filters.dataConclusioneDa)
    if (filters.dataConclusioneA) query = query.lte('data_conclusione', filters.dataConclusioneA)
    if (filters.minPersone) query = query.gte('persone_servite', parseFloat(filters.minPersone))
    if (filters.maxPersone) query = query.lte('persone_servite', parseFloat(filters.maxPersone))
    if (filters.minPersoneLimite) query = query.gte('persone_servite_limite', parseFloat(filters.minPersoneLimite))
    if (filters.maxPersoneLimite) query = query.lte('persone_servite_limite', parseFloat(filters.maxPersoneLimite))
    if (filters.minVolontari) query = query.gte('totale_volontari', parseFloat(filters.minVolontari))
    if (filters.maxVolontari) query = query.lte('totale_volontari', parseFloat(filters.maxVolontari))
    if (filters.minOre) query = query.gte('totale_ore_servizio', parseFloat(filters.minOre))
    if (filters.maxOre) query = query.lte('totale_ore_servizio', parseFloat(filters.maxOre))
    if (filters.minOreCapped) query = query.gte('totale_ore_servizio_capped', parseFloat(filters.minOreCapped))
    if (filters.maxOreCapped) query = query.lte('totale_ore_servizio_capped', parseFloat(filters.maxOreCapped))
    if (filters.minFondiDonati) query = query.gte('totale_fondi_donati', parseFloat(filters.minFondiDonati))
    if (filters.maxFondiDonati) query = query.lte('totale_fondi_donati', parseFloat(filters.maxFondiDonati))
    if (filters.minFondiDonatiCapped) query = query.gte('fondi_donati_usd_capped', parseFloat(filters.minFondiDonatiCapped))
    if (filters.maxFondiDonatiCapped) query = query.lte('fondi_donati_usd_capped', parseFloat(filters.maxFondiDonatiCapped))
    if (filters.minDonazioneLcif) query = query.gte('donazione_lcif', parseFloat(filters.minDonazioneLcif))
    if (filters.maxDonazioneLcif) query = query.lte('donazione_lcif', parseFloat(filters.maxDonazioneLcif))
    if (filters.minFondiRaccolti) query = query.gte('totale_fondi_raccolti', parseFloat(filters.minFondiRaccolti))
    if (filters.maxFondiRaccolti) query = query.lte('totale_fondi_raccolti', parseFloat(filters.maxFondiRaccolti))
    if (filters.minFondiRaccoltiCapped) query = query.gte('fondi_raccolti_usd_capped', parseFloat(filters.minFondiRaccoltiCapped))
    if (filters.maxFondiRaccoltiCapped) query = query.lte('fondi_raccolti_usd_capped', parseFloat(filters.maxFondiRaccoltiCapped))
    if (filters.minAlberi) query = query.gte('alberi_piantati', parseFloat(filters.minAlberi))
    if (filters.maxAlberi) query = query.lte('alberi_piantati', parseFloat(filters.maxAlberi))

    if (sort) query = query.order(sort.field, { ascending: sort.dir === 'asc', nullsFirst: false })

    const { data, count, error: queryError } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (queryError) setError('Errore nel caricamento delle attività. Riprova.')
    else { setAttivita(data || []); setTotalCount(count ?? 0) }
    setLoading(false)
  }

  function updateFilters(newFilters: Filters) {
    setPage(0)
    setFilters(newFilters)
  }

  const advancedCount = useMemo(() => countAdvancedFilters(filters), [filters])
  const basicCount = (filters.search ? 1 : 0) + (filters.club.length ? 1 : 0) + (filters.circoscrizione.length ? 1 : 0)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const start = totalCount === 0 ? 0 : page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, totalCount)

  if (!isClient) return null

  const upd = (patch: Partial<Filters>) => updateFilters({ ...filters, ...patch })

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Attività di Servizio
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Reportistica attività del Distretto 108 LA
      </motion.p>

      <motion.div variants={itemVariants}>
        <Card className="mb-6 border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Filtri di Ricerca</CardTitle>
              <Button
                variant="ghost" size="sm"
                className="sm:hidden flex items-center gap-1.5 text-xs h-8 px-2"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {filtersOpen ? 'Nascondi' : 'Filtri'}
                {(advancedCount + basicCount) > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[9px] ml-0.5">{advancedCount + basicCount}</Badge>
                )}
              </Button>
            </div>
          </CardHeader>
          <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
            <CardContent className="pt-0 space-y-3">
              {/* Basic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input
                  placeholder="Cerca titolo, descrizione..."
                  value={filters.search}
                  onChange={(e) => upd({ search: e.target.value })}
                  className="sm:col-span-2 lg:col-span-1 bg-background/50"
                />
                <MultiSelect options={clubs} selected={filters.club} onChange={(v) => upd({ club: v })} placeholder="Club" />
                <MultiSelect options={circoscrizioni} selected={filters.circoscrizione} onChange={(v) => upd({ circoscrizione: v })} placeholder="Circoscrizione" />
              </div>

              {/* Advanced toggle */}
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
                Filtri avanzati
                {advancedCount > 0 && <Badge className="h-4 min-w-4 px-1 text-[9px]">{advancedCount}</Badge>}
              </button>

              <AnimatePresence initial={false}>
                {advancedOpen && (
                  <motion.div
                    key="advanced"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-2">

                      {/* Categorizzazione */}
                      <SectionLabel>Categorizzazione</SectionLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <MultiSelect options={stati} selected={filters.stato} onChange={(v) => upd({ stato: v })} placeholder="Stato" />
                        <MultiSelect options={zone} selected={filters.zona} onChange={(v) => upd({ zona: v })} placeholder="Zona" />
                        <MultiSelect options={cause} selected={filters.causa} onChange={(v) => upd({ causa: v })} placeholder="Causa" />
                        <MultiSelect options={tipiProgetto} selected={filters.tipoProgetto} onChange={(v) => upd({ tipoProgetto: v })} placeholder="Tipo progetto" />
                        <MultiSelect options={livelliAttivita} selected={filters.livelloAttivita} onChange={(v) => upd({ livelloAttivita: v })} placeholder="Livello attività" />
                        <Input placeholder="Organizzazione beneficiata..." value={filters.organizzazioneBeneficiata} onChange={(e) => upd({ organizzazioneBeneficiata: e.target.value })} className="bg-background/50" />
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Rapporto completo</p>
                          <Select value={filters.rapportoCompleto} onValueChange={(v) => upd({ rapportoCompleto: v ?? '' })}>
                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="Tutti" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Tutti</SelectItem>
                              <SelectItem value="true">Sì</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Attività distintiva</p>
                          <Select value={filters.attivitaDistintiva} onValueChange={(v) => upd({ attivitaDistintiva: v ?? '' })}>
                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="Tutti" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Tutti</SelectItem>
                              <SelectItem value="true">Sì</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Finanziata LCIF</p>
                          <Select value={filters.finanziateLcif} onValueChange={(v) => upd({ finanziateLcif: v ?? '' })}>
                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="Tutti" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Tutti</SelectItem>
                              <SelectItem value="true">Sì</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Date */}
                      <SectionLabel>Date</SectionLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <RangeRow label="Data inizio" minVal={filters.dataInizioDa} maxVal={filters.dataInizioA} onMin={(v) => upd({ dataInizioDa: v })} onMax={(v) => upd({ dataInizioA: v })} type="date" />
                        <RangeRow label="Data conclusione" minVal={filters.dataConclusioneDa} maxVal={filters.dataConclusioneA} onMin={(v) => upd({ dataConclusioneDa: v })} onMax={(v) => upd({ dataConclusioneA: v })} type="date" />
                      </div>

                      {/* Impatto */}
                      <SectionLabel>Impatto</SectionLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <RangeRow label="Persone servite" minVal={filters.minPersone} maxVal={filters.maxPersone} onMin={(v) => upd({ minPersone: v })} onMax={(v) => upd({ maxPersone: v })} />
                        <RangeRow label="Persone servite (limite)" minVal={filters.minPersoneLimite} maxVal={filters.maxPersoneLimite} onMin={(v) => upd({ minPersoneLimite: v })} onMax={(v) => upd({ maxPersoneLimite: v })} />
                        <RangeRow label="Totale volontari" minVal={filters.minVolontari} maxVal={filters.maxVolontari} onMin={(v) => upd({ minVolontari: v })} onMax={(v) => upd({ maxVolontari: v })} />
                        <RangeRow label="Ore di servizio" minVal={filters.minOre} maxVal={filters.maxOre} onMin={(v) => upd({ minOre: v })} onMax={(v) => upd({ maxOre: v })} />
                        <RangeRow label="Ore di servizio (capped)" minVal={filters.minOreCapped} maxVal={filters.maxOreCapped} onMin={(v) => upd({ minOreCapped: v })} onMax={(v) => upd({ maxOreCapped: v })} />
                        <RangeRow label="Alberi piantati/curati" minVal={filters.minAlberi} maxVal={filters.maxAlberi} onMin={(v) => upd({ minAlberi: v })} onMax={(v) => upd({ maxAlberi: v })} />
                      </div>

                      {/* Finanziario */}
                      <SectionLabel>Finanziario</SectionLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <RangeRow label="Fondi donati" minVal={filters.minFondiDonati} maxVal={filters.maxFondiDonati} onMin={(v) => upd({ minFondiDonati: v })} onMax={(v) => upd({ maxFondiDonati: v })} unit="€" />
                        <RangeRow label="Fondi donati (USD capped)" minVal={filters.minFondiDonatiCapped} maxVal={filters.maxFondiDonatiCapped} onMin={(v) => upd({ minFondiDonatiCapped: v })} onMax={(v) => upd({ maxFondiDonatiCapped: v })} unit="$" />
                        <RangeRow label="Donazione LCIF" minVal={filters.minDonazioneLcif} maxVal={filters.maxDonazioneLcif} onMin={(v) => upd({ minDonazioneLcif: v })} onMax={(v) => upd({ maxDonazioneLcif: v })} unit="€" />
                        <RangeRow label="Fondi raccolti" minVal={filters.minFondiRaccolti} maxVal={filters.maxFondiRaccolti} onMin={(v) => upd({ minFondiRaccolti: v })} onMax={(v) => upd({ maxFondiRaccolti: v })} unit="€" />
                        <RangeRow label="Fondi raccolti (USD capped)" minVal={filters.minFondiRaccoltiCapped} maxVal={filters.maxFondiRaccoltiCapped} onMin={(v) => upd({ minFondiRaccoltiCapped: v })} onMax={(v) => upd({ maxFondiRaccoltiCapped: v })} unit="$" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => { updateFilters(EMPTY_FILTERS); setAdvancedOpen(false) }} className="text-xs">
                  Cancella filtri
                </Button>
                {(advancedCount + basicCount) > 0 && (
                  <span className="text-xs text-muted-foreground">{advancedCount + basicCount} filtri attivi</span>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Elenco Attività
                {!loading && <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount} totali)</span>}
              </CardTitle>
              {!loading && totalCount > 0 && (
                <span className="text-xs text-muted-foreground">{start}–{end} di {totalCount}</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : attivita.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessuna attività trovata</span>
              </div>
            ) : (
              <>
                <MobileSortSelect
                  options={[
                    { value: 'data_inizio:desc', label: 'Data (più recente)' },
                    { value: 'data_inizio:asc', label: 'Data (più vecchia)' },
                    { value: 'titolo:asc', label: 'Titolo A→Z' },
                    { value: 'totale_fondi_raccolti:desc', label: 'Fondi raccolti (max)' },
                    { value: 'totale_fondi_donati:desc', label: 'Fondi donati (max)' },
                    { value: 'persone_servite:desc', label: 'Persone servite (max)' },
                    { value: 'totale_ore_servizio:desc', label: 'Ore servizio (max)' },
                    { value: 'totale_volontari:desc', label: 'Volontari (max)' },
                    { value: 'sponsor_nome_account:asc', label: 'Club A→Z' },
                  ]}
                  sort={sort}
                  onChange={(s) => { setPage(0); setSort(s) }}
                />
                <div className="md:hidden space-y-3">
                  {attivita.map((att: any) => (
                    <div key={att.id_attivita} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight line-clamp-2 break-words flex-1 min-w-0">{att.titolo}</p>
                        <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${STATO_COLORS[att.stato] ?? 'bg-muted text-muted-foreground'}`}>
                          {att.stato}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground break-words">{att.sponsor_nome_account}</p>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px] h-5">{att.sponsor_zona}</Badge>
                        {att.sponsor_circoscrizione && <Badge variant="outline" className="text-[10px] h-5">{att.sponsor_circoscrizione}</Badge>}
                        {att.causa && <Badge variant="outline" className="text-[10px] h-5 max-w-[160px] truncate">{att.causa}</Badge>}
                        {att.tipo_progetto && <Badge variant="outline" className="text-[10px] h-5 max-w-[160px] truncate">{att.tipo_progetto}</Badge>}
                      </div>
                      {(att.attivita_distintiva || att.finanziata_lcif) && (
                        <div className="flex items-center flex-wrap gap-1.5">
                          {att.attivita_distintiva && <Badge className="text-[10px] h-5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">⭐ Distintiva</Badge>}
                          {att.finanziata_lcif && <Badge className="text-[10px] h-5 bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30">LCIF</Badge>}
                        </div>
                      )}
                      {att.organizzazione_beneficiata && (
                        <p className="text-[10px] text-muted-foreground break-words">🤝 {att.organizzazione_beneficiata}</p>
                      )}
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground pt-1 border-t border-border/30">
                        <span><span className="font-medium text-foreground">{att.persone_servite ?? 0}</span> persone</span>
                        <span><span className="font-medium text-foreground">{att.totale_volontari ?? 0}</span> volontari</span>
                        <span><span className="font-medium text-foreground">{att.totale_ore_servizio ?? 0}</span> ore</span>
                        {att.alberi_piantati > 0 && <span><span className="font-medium text-foreground">{att.alberi_piantati}</span> alberi</span>}
                        <span>raccolti <span className="font-medium text-foreground tabular-nums">€{att.totale_fondi_raccolti ?? 0}</span></span>
                        {att.totale_fondi_donati > 0 && <span>donati <span className="font-medium text-foreground tabular-nums">€{att.totale_fondi_donati}</span></span>}
                      </div>
                      {att.data_inizio && (
                        <div className="text-[10px] text-muted-foreground pt-1">
                          📅 {new Date(att.data_inizio).toLocaleDateString('it-IT')}
                          {att.data_conclusione && ` → ${new Date(att.data_conclusione).toLocaleDateString('it-IT')}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <SortableHead field="titolo" label="Titolo" sort={sort} onSort={handleSort} />
                        <SortableHead field="sponsor_nome_account" label="Club" sort={sort} onSort={handleSort} />
                        <SortableHead field="sponsor_zona" label="Zona" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="sponsor_circoscrizione" label="Circ." sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="stato" label="Stato" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="causa" label="Causa" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="tipo_progetto" label="Tipo" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="data_inizio" label="Data" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="persone_servite" label="Persone" sort={sort} onSort={handleSort} className="whitespace-nowrap" align="right" />
                        <SortableHead field="totale_volontari" label="Volont." sort={sort} onSort={handleSort} className="whitespace-nowrap" align="right" />
                        <SortableHead field="totale_ore_servizio" label="Ore" sort={sort} onSort={handleSort} className="whitespace-nowrap" align="right" />
                        <SortableHead field="totale_fondi_donati" label="Donati" sort={sort} onSort={handleSort} className="whitespace-nowrap" align="right" />
                        <SortableHead field="totale_fondi_raccolti" label="Raccolti" sort={sort} onSort={handleSort} className="whitespace-nowrap" align="right" />
                        <SortableHead field="alberi_piantati" label="Alberi" sort={sort} onSort={handleSort} className="whitespace-nowrap" align="right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attivita.map((att: any, index: number) => (
                        <motion.tr
                          key={att.id_attivita}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-muted/40"
                        >
                          <TableCell className="font-medium max-w-[220px] truncate" title={att.titolo}>{att.titolo}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate" title={att.sponsor_nome_account}>{att.sponsor_nome_account}</TableCell>
                          <TableCell className="whitespace-nowrap"><Badge variant="outline" className="text-xs">{att.sponsor_zona}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{att.sponsor_circoscrizione}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATO_COLORS[att.stato] ?? 'bg-muted text-muted-foreground'}`}>
                              {att.stato}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate" title={att.causa}>{att.causa}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate" title={att.tipo_progetto}>{att.tipo_progetto}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{att.data_inizio ? new Date(att.data_inizio).toLocaleDateString('it-IT') : ''}</TableCell>
                          <TableCell className="text-sm tabular-nums text-right">{att.persone_servite ?? 0}</TableCell>
                          <TableCell className="text-sm tabular-nums text-right">{att.totale_volontari ?? 0}</TableCell>
                          <TableCell className="text-sm tabular-nums text-right">{att.totale_ore_servizio ?? 0}</TableCell>
                          <TableCell className="text-sm tabular-nums text-right">€{att.totale_fondi_donati ?? 0}</TableCell>
                          <TableCell className="text-sm tabular-nums text-right">€{att.totale_fondi_raccolti ?? 0}</TableCell>
                          <TableCell className="text-sm tabular-nums text-right">{att.alberi_piantati ?? 0}</TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0} className="h-8 px-3 text-xs">
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />Prec
                    </Button>
                    <span className="text-xs text-muted-foreground">Pagina {page + 1} di {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="h-8 px-3 text-xs">
                      Succ<ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
