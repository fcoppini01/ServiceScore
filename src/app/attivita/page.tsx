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
import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Activity, FileText, Printer, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { filtersToQueryString } from '@/lib/filters-url'
import { getAnnoSocialeRange, getRecentAnniSociali } from '@/lib/anno-sociale'
import { exportToExcel, todayStamp, fmtDateIT } from '@/lib/excel-export'

const PAGE_SIZE = 20

interface Filters {
  search: string
  stato: string[]
  causa: string[]
  // Filtri territoriali — ordine fisso Club, Zona, Circoscrizione, Distretto
  club: string[]
  zona: string[]
  circoscrizione: string[]
  distretto: string[]
  // Advanced — Categorizzazione
  tipoProgetto: string[]
  livelloAttivita: string[]
  organizzazioneBeneficiata: string
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

const DISTRETTI = ['108 LA']

const EMPTY_FILTERS: Filters = {
  search: '', stato: [], causa: [],
  club: [], zona: [], circoscrizione: [], distretto: [],
  tipoProgetto: [], livelloAttivita: [],
  organizzazioneBeneficiata: '', attivitaDistintiva: '', finanziateLcif: '',
  dataInizioDa: '', dataInizioA: '', dataConclusioneDa: '', dataConclusioneA: '',
  minPersone: '', maxPersone: '', minPersoneLimite: '', maxPersoneLimite: '',
  minVolontari: '', maxVolontari: '', minOre: '', maxOre: '', minOreCapped: '', maxOreCapped: '',
  minFondiDonati: '', maxFondiDonati: '', minFondiDonatiCapped: '', maxFondiDonatiCapped: '',
  minDonazioneLcif: '', maxDonazioneLcif: '', minFondiRaccolti: '', maxFondiRaccolti: '',
  minFondiRaccoltiCapped: '', maxFondiRaccoltiCapped: '',
  minAlberi: '', maxAlberi: '',
}

// Ricava l'anno sociale attualmente selezionato confrontando l'intervallo data inizio
// con i range degli anni sociali; ritorna 'tutti' se non corrisponde a nessuno.
function annoSocialeSelezionato(f: Filters): string {
  if (!f.dataInizioDa || !f.dataInizioA) return 'tutti'
  const match = getRecentAnniSociali(8).find((a) => {
    const r = getAnnoSocialeRange(a.value)
    return r.from === f.dataInizioDa && r.to === f.dataInizioA
  })
  return match ? String(match.value) : 'tutti'
}

function countAdvancedFilters(f: Filters) {
  let c = 0
  if (f.stato.length) c++
  if (f.causa.length) c++
  if (f.tipoProgetto.length) c++
  if (f.livelloAttivita.length) c++
  if (f.organizzazioneBeneficiata) c++
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
  const [totali, setTotali] = useState({ persone: 0, volontari: 0, ore: 0, donati: 0, raccolti: 0 })
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
    // Club/zona/circoscrizione dalla tabella club (poche righe, completa) per
    // non incappare nel limite righe quando le attività sono migliaia.
    // Causa/tipo/livello/stato dalla vista DISTINCT dedicata.
    const [clubTab, opzioniRes] = await Promise.all([
      supabase.from('club').select('nome_club, zona, circoscrizione').range(0, 9999),
      supabase.from('vista_report_opzioni').select('campo, valore').range(0, 9999),
    ])
    if (clubTab.data) {
      setClubs([...new Set(clubTab.data.map((c: any) => c.nome_club))].filter(Boolean).sort() as string[])
      setZone([...new Set(clubTab.data.map((c: any) => c.zona))].filter(Boolean).sort() as string[])
      setCircoscrizioni([...new Set(clubTab.data.map((c: any) => c.circoscrizione))].filter(Boolean).sort() as string[])
    }
    if (opzioniRes.data) {
      const byField = (campo: string) => opzioniRes.data!.filter((o: any) => o.campo === campo).map((o: any) => o.valore).filter(Boolean).sort()
      setCause(byField('causa') as string[])
      setTipiProgetto(byField('tipo_progetto') as string[])
      setLivelliAttivita(byField('livello_attivita') as string[])
      setStati(byField('stato') as string[])
    }
  }

  // Applica i filtri correnti a una qualsiasi query Supabase (riusato per
  // la query paginata e per quella aggregata dei totali).
  function applyFilters<T>(query: T): T {
    let q: any = query
    if (filters.search) q = q.or(`titolo.ilike.%${filters.search}%,descrizione.ilike.%${filters.search}%`)
    if (filters.stato.length) q = q.in('stato', filters.stato)
    if (filters.zona.length) q = q.in('sponsor_zona', filters.zona)
    if (filters.causa.length) q = q.in('causa', filters.causa)
    if (filters.tipoProgetto.length) q = q.in('tipo_progetto', filters.tipoProgetto)
    if (filters.livelloAttivita.length) q = q.in('livello_attivita', filters.livelloAttivita)
    if (filters.circoscrizione.length) q = q.in('sponsor_circoscrizione', filters.circoscrizione)
    if (filters.club.length) q = q.in('sponsor_nome_account', filters.club)
    // Organizzazione beneficiata: LCIF (qualsiasi grafia) oppure Altro (qualunque altra org. valorizzata)
    if (filters.organizzazioneBeneficiata === 'LCIF') q = q.ilike('organizzazione_beneficiata', '%lcif%')
    else if (filters.organizzazioneBeneficiata === 'ALTRO') q = q.not('organizzazione_beneficiata', 'is', null).not('organizzazione_beneficiata', 'ilike', '%lcif%')
    if (filters.attivitaDistintiva) q = q.eq('attivita_distintiva', filters.attivitaDistintiva === 'true')
    if (filters.finanziateLcif) q = q.eq('finanziata_lcif', filters.finanziateLcif === 'true')
    if (filters.dataInizioDa) q = q.gte('data_inizio', filters.dataInizioDa)
    if (filters.dataInizioA) q = q.lte('data_inizio', filters.dataInizioA)
    if (filters.dataConclusioneDa) q = q.gte('data_conclusione', filters.dataConclusioneDa)
    if (filters.dataConclusioneA) q = q.lte('data_conclusione', filters.dataConclusioneA)
    if (filters.minPersone) q = q.gte('persone_servite', parseFloat(filters.minPersone))
    if (filters.maxPersone) q = q.lte('persone_servite', parseFloat(filters.maxPersone))
    if (filters.minPersoneLimite) q = q.gte('persone_servite_limite', parseFloat(filters.minPersoneLimite))
    if (filters.maxPersoneLimite) q = q.lte('persone_servite_limite', parseFloat(filters.maxPersoneLimite))
    if (filters.minVolontari) q = q.gte('totale_volontari', parseFloat(filters.minVolontari))
    if (filters.maxVolontari) q = q.lte('totale_volontari', parseFloat(filters.maxVolontari))
    if (filters.minOre) q = q.gte('totale_ore_servizio', parseFloat(filters.minOre))
    if (filters.maxOre) q = q.lte('totale_ore_servizio', parseFloat(filters.maxOre))
    if (filters.minOreCapped) q = q.gte('totale_ore_servizio_capped', parseFloat(filters.minOreCapped))
    if (filters.maxOreCapped) q = q.lte('totale_ore_servizio_capped', parseFloat(filters.maxOreCapped))
    if (filters.minFondiDonati) q = q.gte('totale_fondi_donati', parseFloat(filters.minFondiDonati))
    if (filters.maxFondiDonati) q = q.lte('totale_fondi_donati', parseFloat(filters.maxFondiDonati))
    if (filters.minFondiDonatiCapped) q = q.gte('fondi_donati_usd_capped', parseFloat(filters.minFondiDonatiCapped))
    if (filters.maxFondiDonatiCapped) q = q.lte('fondi_donati_usd_capped', parseFloat(filters.maxFondiDonatiCapped))
    if (filters.minDonazioneLcif) q = q.gte('donazione_lcif', parseFloat(filters.minDonazioneLcif))
    if (filters.maxDonazioneLcif) q = q.lte('donazione_lcif', parseFloat(filters.maxDonazioneLcif))
    if (filters.minFondiRaccolti) q = q.gte('totale_fondi_raccolti', parseFloat(filters.minFondiRaccolti))
    if (filters.maxFondiRaccolti) q = q.lte('totale_fondi_raccolti', parseFloat(filters.maxFondiRaccolti))
    if (filters.minFondiRaccoltiCapped) q = q.gte('fondi_raccolti_usd_capped', parseFloat(filters.minFondiRaccoltiCapped))
    if (filters.maxFondiRaccoltiCapped) q = q.lte('fondi_raccolti_usd_capped', parseFloat(filters.maxFondiRaccoltiCapped))
    if (filters.minAlberi) q = q.gte('alberi_piantati', parseFloat(filters.minAlberi))
    if (filters.maxAlberi) q = q.lte('alberi_piantati', parseFloat(filters.maxAlberi))
    return q as T
  }

  async function loadAttivita() {
    setLoading(true)
    setError(null)

    let query = applyFilters(supabase.from('vista_report_ricerca').select('*', { count: 'exact' }))
    if (sort) query = query.order(sort.field, { ascending: sort.dir === 'asc', nullsFirst: false })

    // Query principale + aggregati in parallelo.
    // Usiamo i valori CAPPED / LIMITE come fa LCI nei report ufficiali:
    // i valori grezzi contengono errori di compilazione dei club (es. una
    // rotatoria con "180.000 persone servite") che gonfiano i totali.
    const totaliQ = applyFilters(supabase.from('vista_report_ricerca').select(
      'persone:persone_servite_limite.sum(), volontari:totale_volontari.sum(), ore:totale_ore_servizio_capped.sum(), donati:fondi_donati_usd_capped.sum(), raccolti:fondi_raccolti_usd_capped.sum()'
    ))
    const [main, agg] = await Promise.all([
      query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
      totaliQ,
    ])

    if (main.error) {
      setError('Errore nel caricamento delle attività. Riprova.')
    } else {
      setAttivita(main.data || [])
      setTotalCount(main.count ?? 0)
    }
    if (!agg.error && agg.data?.[0]) {
      const t = agg.data[0] as any
      setTotali({
        persone: Number(t.persone ?? 0),
        volontari: Number(t.volontari ?? 0),
        ore: Number(t.ore ?? 0),
        donati: Number(t.donati ?? 0),
        raccolti: Number(t.raccolti ?? 0),
      })
    }
    setLoading(false)
  }

  // Esporta in Excel TUTTI i risultati attualmente filtrati (non solo la pagina).
  const [exporting, setExporting] = useState(false)
  async function exportExcel() {
    setExporting(true)
    let q = applyFilters(supabase.from('vista_report_ricerca').select('*'))
    if (sort) q = q.order(sort.field, { ascending: sort.dir === 'asc', nullsFirst: false })
    const { data, error } = await q.range(0, 49999)
    setExporting(false)
    if (error || !data) return
    exportToExcel(
      data,
      [
        { header: 'ID attività', accessor: (a: any) => a.id_attivita },
        { header: 'Data inizio', accessor: (a: any) => fmtDateIT(a.data_inizio) },
        { header: 'Data fine', accessor: (a: any) => fmtDateIT(a.data_conclusione) },
        { header: 'Stato', accessor: (a: any) => a.stato },
        { header: 'Titolo', accessor: (a: any) => a.titolo },
        { header: 'Club', accessor: (a: any) => a.sponsor_nome_account },
        { header: 'Zona', accessor: (a: any) => a.sponsor_zona },
        { header: 'Circoscrizione', accessor: (a: any) => a.sponsor_circoscrizione },
        { header: 'Causa', accessor: (a: any) => a.causa },
        { header: 'Tipo progetto', accessor: (a: any) => a.tipo_progetto },
        { header: 'Livello attività', accessor: (a: any) => a.livello_attivita },
        { header: 'Persone servite (cap)', accessor: (a: any) => Number(a.persone_servite_limite) || 0 },
        { header: 'Volontari', accessor: (a: any) => Number(a.totale_volontari) || 0 },
        { header: 'Ore (cap)', accessor: (a: any) => Number(a.totale_ore_servizio_capped) || 0 },
        { header: 'Fondi donati (dollari)', accessor: (a: any) => Number(a.fondi_donati_usd_capped) || 0 },
        { header: 'Fondi raccolti (dollari)', accessor: (a: any) => Number(a.fondi_raccolti_usd_capped) || 0 },
        { header: 'Org. beneficiata', accessor: (a: any) => a.organizzazione_beneficiata },
      ],
      `attivita_${todayStamp()}`,
      'Attività'
    )
  }

  function updateFilters(newFilters: Filters) {
    setPage(0)
    setFilters(newFilters)
  }

  const advancedCount = useMemo(() => countAdvancedFilters(filters), [filters])
  const basicCount = (filters.search ? 1 : 0) + (filters.zona.length ? 1 : 0) + (filters.club.length ? 1 : 0) + (filters.circoscrizione.length ? 1 : 0)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const start = totalCount === 0 ? 0 : page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, totalCount)

  if (!isClient) return null

  const upd = (patch: Partial<Filters>) => updateFilters({ ...filters, ...patch })

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Storico Attività
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-4">
        Reportistica attività del Distretto 108 LA
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/attivita/rapporti">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Rapporti
          </Button>
        </Link>
        <Link href={`/attivita/stampa${filtersToQueryString({ ...filters, sortField: sort?.field, sortDir: sort?.dir })}`}>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" title="Stampa esattamente i risultati attualmente filtrati">
            <Printer className="h-3.5 w-3.5" /> Stampa PDF
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportExcel} disabled={exporting || totalCount === 0} title="Esporta in Excel i risultati attualmente filtrati">
          <FileSpreadsheet className="h-3.5 w-3.5" /> {exporting ? 'Esporto…' : 'Excel'}
        </Button>
      </motion.div>

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
              {/* Prima riga in vista: filtri territoriali (Club, Zona, Circoscrizione, Distretto)
                  + Anno sociale affiancato a Distretto. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <MultiSelect options={clubs} selected={filters.club} onChange={(v) => upd({ club: v })} placeholder="Club" />
                <MultiSelect options={zone} selected={filters.zona} onChange={(v) => upd({ zona: v })} placeholder="Zona" />
                <MultiSelect options={circoscrizioni} selected={filters.circoscrizione} onChange={(v) => upd({ circoscrizione: v })} placeholder="Circoscrizione" />
                <MultiSelect options={DISTRETTI} selected={filters.distretto} onChange={(v) => upd({ distretto: v })} placeholder="Distretto" />
                <Select
                  value={annoSocialeSelezionato(filters)}
                  onValueChange={(v) => {
                    if (!v || v === 'tutti') { upd({ dataInizioDa: '', dataInizioA: '' }); return }
                    const r = getAnnoSocialeRange(parseInt(v, 10))
                    upd({ dataInizioDa: r.from, dataInizioA: r.to })
                  }}
                >
                  <SelectTrigger className="text-sm bg-background/50"><SelectValue placeholder="Anno sociale" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutti">Tutti gli anni</SelectItem>
                    {getRecentAnniSociali(8).map((a) => (
                      <SelectItem key={a.value} value={String(a.value)}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  placeholder="Cerca titolo, descrizione..."
                  value={filters.search}
                  onChange={(e) => upd({ search: e.target.value })}
                  className="bg-background/50"
                />
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
                        <MultiSelect options={cause} selected={filters.causa} onChange={(v) => upd({ causa: v })} placeholder="Causa" />
                        <MultiSelect options={tipiProgetto} selected={filters.tipoProgetto} onChange={(v) => upd({ tipoProgetto: v })} placeholder="Tipo progetto" />
                        <MultiSelect options={livelliAttivita} selected={filters.livelloAttivita} onChange={(v) => upd({ livelloAttivita: v })} placeholder="Livello attività" />
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Organizzazione beneficiata</p>
                          <Select value={filters.organizzazioneBeneficiata} onValueChange={(v) => upd({ organizzazioneBeneficiata: v ?? '' })}>
                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="Tutte" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Tutte</SelectItem>
                              <SelectItem value="LCIF">LCIF</SelectItem>
                              <SelectItem value="ALTRO">Altro</SelectItem>
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
                        <RangeRow label="Fondi donati (dollari)" minVal={filters.minFondiDonatiCapped} maxVal={filters.maxFondiDonatiCapped} onMin={(v) => upd({ minFondiDonatiCapped: v })} onMax={(v) => upd({ maxFondiDonatiCapped: v })} unit="$" />
                        <RangeRow label="Donazione LCIF" minVal={filters.minDonazioneLcif} maxVal={filters.maxDonazioneLcif} onMin={(v) => upd({ minDonazioneLcif: v })} onMax={(v) => upd({ maxDonazioneLcif: v })} unit="€" />
                        <RangeRow label="Fondi raccolti" minVal={filters.minFondiRaccolti} maxVal={filters.maxFondiRaccolti} onMin={(v) => upd({ minFondiRaccolti: v })} onMax={(v) => upd({ maxFondiRaccolti: v })} unit="€" />
                        <RangeRow label="Fondi raccolti (dollari)" minVal={filters.minFondiRaccoltiCapped} maxVal={filters.maxFondiRaccoltiCapped} onMin={(v) => upd({ minFondiRaccoltiCapped: v })} onMax={(v) => upd({ maxFondiRaccoltiCapped: v })} unit="$" />
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
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <CardTitle className="text-base font-semibold">
                Elenco Attività
                {!loading && <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount} totali)</span>}
              </CardTitle>
              <div className="flex items-center gap-2">
                {!loading && totalCount > 0 && (
                  <span className="text-xs text-muted-foreground">{start}–{end} di {totalCount}</span>
                )}
              </div>
            </div>
            {!loading && totalCount > 0 && (
              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1.5">
                  Indicazioni totali
                  <span className="ml-1 text-muted-foreground font-normal normal-case">(valori ufficiali LCI · importi in dollari · sui risultati filtrati)</span>
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="whitespace-nowrap">
                    <span className="font-bold text-foreground tabular-nums">{totali.persone.toLocaleString('it-IT')}</span>
                    <span className="text-muted-foreground ml-1">persone servite</span>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="whitespace-nowrap">
                    <span className="font-bold text-foreground tabular-nums">{totali.volontari.toLocaleString('it-IT')}</span>
                    <span className="text-muted-foreground ml-1">volontari</span>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="whitespace-nowrap">
                    <span className="font-bold text-foreground tabular-nums">{totali.ore.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span>
                    <span className="text-muted-foreground ml-1">ore servizio</span>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="whitespace-nowrap">
                    <span className="font-bold text-foreground tabular-nums">$ {totali.donati.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span>
                    <span className="text-muted-foreground ml-1">donati</span>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="whitespace-nowrap">
                    <span className="font-bold text-foreground tabular-nums">$ {totali.raccolti.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span>
                    <span className="text-muted-foreground ml-1">raccolti</span>
                  </span>
                </div>
              </div>
            )}
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
                      {attivita.map((att: any) => (
                        <tr
                          key={att.id_attivita}
                          className="hover:bg-muted/40 border-b border-border/30"
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
                        </tr>
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
