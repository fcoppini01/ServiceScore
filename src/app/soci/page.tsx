'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { SortableHead, MobileSortSelect, type SortState, nextSort } from '@/components/ui/sortable-head'
import { motion, AnimatePresence } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Users, Printer, FileText, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { filtersToQueryString } from '@/lib/filters-url'
import { exportToExcel, todayStamp } from '@/lib/excel-export'

const PAGE_SIZE = 20

interface Filters {
  search: string
  sesso: string[]
  fasciaEta: string[]
  fasciaAnzianita: string[]
  // Filtri territoriali (ordine fisso: Club, Zona, Circoscrizione, Distretto)
  club: string[]
  zona: string[]
  circoscrizione: string[]
  distretto: string[]
  classificazione: string[]
  programma: string[]
  professione: string
  citta: string
  provincia: string
}

const FASCE_ETA = ['Under 30', '31-40', '41-50', '51-60', '61-70', 'Over 70']
const FASCE_ANZIANITA = ['Under 2', '2-5', '5-10', '10-15', '15-20', 'Over 20']
const DISTRETTI = ['108 LA']
// Classificazione per categoria associativa (mappata dal tipo associazione — vedi PDF Lions)
const CLASSIFICAZIONI = ['EFFETTIVO', 'FONDATORE', 'PRIVILEGIATO', 'VITALIZIO', 'ONORARIO', 'AGGREGATO', 'AFFILIATO', 'ASSOCIATO', 'FAMILIARE', 'LEO-LION', 'STUDENTE', 'GIOVANE ADULTO']

const EMPTY_FILTERS: Filters = {
  search: '', sesso: [], fasciaEta: [], fasciaAnzianita: [],
  club: [], zona: [], circoscrizione: [], distretto: [],
  classificazione: [], programma: [],
  professione: '', citta: '', provincia: '',
}

function countAdvancedFilters(f: Filters) {
  let c = 0
  if (f.club.length) c++
  if (f.zona.length) c++
  if (f.circoscrizione.length) c++
  if (f.distretto.length) c++
  if (f.fasciaAnzianita.length) c++
  if (f.classificazione.length) c++
  if (f.programma.length) c++
  if (f.professione) c++
  if (f.citta) c++
  if (f.provincia) c++
  return c
}

export default function SociPage() {
  const [soci, setSoci] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [programmi, setProgrammi] = useState<string[]>([])
  const [clubs, setClubs] = useState<string[]>([])
  const [sessiDisponibili, setSessiDisponibili] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [sort, setSort] = useState<SortState>({ field: 'cognome', dir: 'asc' })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { loadSoci() }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters, page, sort, isClient])

  const handleSort = (field: string) => {
    setPage(0)
    setSort(s => nextSort(s, field))
  }

  async function loadFilterOptions() {
    // Carico le opzioni territoriali dalla tabella club (completa, non dipende dal volume soci)
    // e le opzioni anagrafiche dalla tabella soci. Range esteso per evitare il default 1000 di PostgREST.
    const [clubTab, sociTab] = await Promise.all([
      supabase.from('club').select('nome_club, zona, circoscrizione').range(0, 9999),
      supabase.from('soci').select('sesso, programma').range(0, 9999),
    ])
    if (clubTab.data) {
      setClubs([...new Set(clubTab.data.map((c: any) => c.nome_club))].filter(Boolean).sort() as string[])
      setZone([...new Set(clubTab.data.map((c: any) => c.zona))].filter(Boolean).sort() as string[])
      setCircoscrizioni([...new Set(clubTab.data.map((c: any) => c.circoscrizione))].filter(Boolean).sort() as string[])
    }
    if (sociTab.data) {
      setSessiDisponibili([...new Set(sociTab.data.map((s: any) => s.sesso))].filter(Boolean).sort() as string[])
      setProgrammi([...new Set(sociTab.data.map((s: any) => s.programma))].filter(Boolean).sort() as string[])
    }
  }

  async function loadSoci() {
    setLoading(true)
    setError(null)

    let query = supabase.from('vista_soci_ricerca').select('*', { count: 'exact' })

    if (filters.search) query = query.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    if (filters.sesso.length) query = query.in('sesso', filters.sesso)
    if (filters.fasciaEta.length) query = query.in('fascia_eta', filters.fasciaEta)
    if (filters.fasciaAnzianita.length) query = query.in('fascia_anzianita', filters.fasciaAnzianita)
    // Filtri territoriali — ordine fisso Club, Zona, Circoscrizione, Distretto
    if (filters.club.length) query = query.in('nome_club', filters.club)
    if (filters.zona.length) query = query.in('club_zona', filters.zona)
    if (filters.circoscrizione.length) query = query.in('club_circoscrizione', filters.circoscrizione)
    // distretto: oggi unico ("108 LA"), filtro presente per coerenza UX, no-op a livello query
    if (filters.classificazione.length) query = query.in('categoria_socio', filters.classificazione)
    if (filters.programma.length) query = query.in('programma', filters.programma)
    if (filters.professione) query = query.ilike('professione', `%${filters.professione}%`)
    if (filters.citta) query = query.ilike('citta', `%${filters.citta}%`)
    if (filters.provincia) query = query.ilike('stato_provincia', `%${filters.provincia}%`)

    if (sort) query = query.order(sort.field, { ascending: sort.dir === 'asc', nullsFirst: false })

    const { data, count, error: queryError } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (queryError) setError('Errore nel caricamento dei soci. Riprova.')
    else { setSoci(data || []); setTotalCount(count ?? 0) }
    setLoading(false)
  }

  function updateFilters(newFilters: Filters) {
    setPage(0)
    setFilters(newFilters)
  }

  // Applica i filtri correnti a una query Supabase (riusato per export Excel).
  function applyFilters<T>(query: T): T {
    let q: any = query
    if (filters.search) q = q.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    if (filters.sesso.length) q = q.in('sesso', filters.sesso)
    if (filters.fasciaEta.length) q = q.in('fascia_eta', filters.fasciaEta)
    if (filters.fasciaAnzianita.length) q = q.in('fascia_anzianita', filters.fasciaAnzianita)
    if (filters.club.length) q = q.in('nome_club', filters.club)
    if (filters.zona.length) q = q.in('club_zona', filters.zona)
    if (filters.circoscrizione.length) q = q.in('club_circoscrizione', filters.circoscrizione)
    if (filters.classificazione.length) q = q.in('categoria_socio', filters.classificazione)
    if (filters.programma.length) q = q.in('programma', filters.programma)
    if (filters.professione) q = q.ilike('professione', `%${filters.professione}%`)
    if (filters.citta) q = q.ilike('citta', `%${filters.citta}%`)
    if (filters.provincia) q = q.ilike('stato_provincia', `%${filters.provincia}%`)
    return q as T
  }

  // Esporta in Excel TUTTI i soci attualmente filtrati (non solo la pagina).
  const [exporting, setExporting] = useState(false)
  async function exportExcel() {
    setExporting(true)
    let q = applyFilters(supabase.from('vista_soci_ricerca').select('*'))
    if (sort) q = q.order(sort.field, { ascending: sort.dir === 'asc', nullsFirst: false })
    const { data, error } = await q.range(0, 49999)
    setExporting(false)
    if (error || !data) return
    exportToExcel(
      data,
      [
        { header: 'Matricola', accessor: (s: any) => s.matricola_socio },
        { header: 'Nome', accessor: (s: any) => s.nome },
        { header: 'Cognome', accessor: (s: any) => s.cognome },
        { header: 'Club', accessor: (s: any) => s.nome_club },
        { header: 'Zona', accessor: (s: any) => s.club_zona },
        { header: 'Circoscrizione', accessor: (s: any) => s.club_circoscrizione },
        { header: 'Genere', accessor: (s: any) => s.sesso },
        { header: 'Fascia età', accessor: (s: any) => s.fascia_eta },
        { header: 'Anzianità', accessor: (s: any) => s.anzianita_lionistica != null ? `${s.anzianita_lionistica} anni` : '' },
        { header: 'Fascia anzianità', accessor: (s: any) => s.fascia_anzianita },
        { header: 'Classificazione', accessor: (s: any) => s.categoria_socio },
        { header: 'Programma', accessor: (s: any) => s.programma },
        { header: 'Professione', accessor: (s: any) => s.professione },
        { header: 'Città', accessor: (s: any) => s.citta },
        { header: 'Provincia', accessor: (s: any) => s.stato_provincia },
        { header: 'Cellulare', accessor: (s: any) => s.telefono_cellulare },
        { header: 'Email', accessor: (s: any) => s.email_effettiva ?? '' },
      ],
      `soci_${todayStamp()}`,
      'Soci'
    )
  }

  const advancedCount = useMemo(() => countAdvancedFilters(filters), [filters])
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const start = totalCount === 0 ? 0 : page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, totalCount)

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Elenco Generale Soci
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-4">
        Elenco soci del Distretto 108 LA
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/soci/rapporti">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Rapporti
          </Button>
        </Link>
        <Link href={`/soci/stampa${filtersToQueryString({ ...filters, sortField: sort?.field, sortDir: sort?.dir })}`}>
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
                {(advancedCount + (filters.search ? 1 : 0) + (filters.sesso.length ? 1 : 0) + (filters.fasciaEta.length ? 1 : 0)) > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[9px] ml-0.5">
                    {advancedCount + (filters.search ? 1 : 0) + (filters.sesso.length ? 1 : 0) + (filters.fasciaEta.length ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </CardHeader>
          <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
            <CardContent className="pt-0 space-y-3">
              {/* Prima riga in vista: filtri territoriali Club, Zona, Circoscrizione, Distretto
                  (sui Soci non c'è l'anno sociale, quindi 4 colonne). */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <MultiSelect options={clubs} selected={filters.club} onChange={(v) => updateFilters({ ...filters, club: v })} placeholder="Club" />
                <MultiSelect options={zone} selected={filters.zona} onChange={(v) => updateFilters({ ...filters, zona: v })} placeholder="Zona" />
                <MultiSelect options={circoscrizioni} selected={filters.circoscrizione} onChange={(v) => updateFilters({ ...filters, circoscrizione: v })} placeholder="Circoscrizione" />
                <MultiSelect options={DISTRETTI} selected={filters.distretto} onChange={(v) => updateFilters({ ...filters, distretto: v })} placeholder="Distretto" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input
                  placeholder="Cerca nome, cognome, matricola..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                  className="bg-background/50 sm:col-span-2 lg:col-span-1"
                />
                <MultiSelect
                  options={sessiDisponibili}
                  selected={filters.sesso}
                  onChange={(v) => updateFilters({ ...filters, sesso: v })}
                  placeholder="Genere"
                />
                <MultiSelect
                  options={FASCE_ETA}
                  selected={filters.fasciaEta}
                  onChange={(v) => updateFilters({ ...filters, fasciaEta: v })}
                  placeholder="Fascia d'età"
                />
              </div>

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
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <MultiSelect options={CLASSIFICAZIONI} selected={filters.classificazione} onChange={(v) => updateFilters({ ...filters, classificazione: v })} placeholder="Classificazione (Effettivo, Fondatore…)" />
                        <MultiSelect options={programmi} selected={filters.programma} onChange={(v) => updateFilters({ ...filters, programma: v })} placeholder="Programma" />
                        <MultiSelect options={FASCE_ANZIANITA} selected={filters.fasciaAnzianita} onChange={(v) => updateFilters({ ...filters, fasciaAnzianita: v })} placeholder="Fascia anzianità lionistica" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Input placeholder="Professione..." value={filters.professione} onChange={(e) => updateFilters({ ...filters, professione: e.target.value })} className="bg-background/50" />
                        <Input placeholder="Città..." value={filters.citta} onChange={(e) => updateFilters({ ...filters, citta: e.target.value })} className="bg-background/50" />
                        <Input placeholder="Provincia..." value={filters.provincia} onChange={(e) => updateFilters({ ...filters, provincia: e.target.value })} className="bg-background/50" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => { updateFilters(EMPTY_FILTERS); setAdvancedOpen(false) }} className="text-xs">
                  Cancella filtri
                </Button>
                {(advancedCount + (filters.search ? 1 : 0) + (filters.sesso.length ? 1 : 0) + (filters.fasciaEta.length ? 1 : 0)) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {advancedCount + (filters.search ? 1 : 0) + (filters.sesso.length ? 1 : 0) + (filters.fasciaEta.length ? 1 : 0)} filtri attivi
                  </span>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold">
                Elenco Soci
                {!loading && <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount} totali)</span>}
              </CardTitle>
              <div className="flex items-center gap-2">
                {!loading && totalCount > 0 && (
                  <span className="text-xs text-muted-foreground">{start}–{end} di {totalCount}</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
              <>
                <MobileSortSelect
                  options={[
                    { value: 'cognome:asc', label: 'Cognome A→Z' },
                    { value: 'cognome:desc', label: 'Cognome Z→A' },
                    { value: 'nome:asc', label: 'Nome A→Z' },
                    { value: 'matricola_socio:asc', label: 'Matricola crescente' },
                    { value: 'anzianita_lionistica:desc', label: 'Anzianità (più anni)' },
                    { value: 'anzianita_lionistica:asc', label: 'Anzianità (meno anni)' },
                    { value: 'nome_club:asc', label: 'Club A→Z' },
                    { value: 'citta:asc', label: 'Città A→Z' },
                  ]}
                  sort={sort}
                  onChange={(s) => { setPage(0); setSort(s) }}
                />
                <div className="md:hidden space-y-3">
                  {soci.map((socio: any) => (
                    <div key={socio.matricola_socio} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{socio.nome} {socio.cognome}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{socio.matricola_socio}</p>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {socio.fascia_eta && <Badge className="text-[10px] h-5">{socio.fascia_eta}</Badge>}
                          <Badge variant="outline" className="text-[10px] h-5">{socio.sesso === 'M' ? 'M' : 'F'}</Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{socio.nome_club}</div>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px] h-5">{socio.club_zona}</Badge>
                        {socio.club_circoscrizione && <Badge variant="outline" className="text-[10px] h-5">{socio.club_circoscrizione}</Badge>}
                        {socio.categoria_socio && <Badge variant="outline" className="text-[10px] h-5 max-w-[140px] truncate">{socio.categoria_socio}</Badge>}
                        {socio.programma && <Badge variant="outline" className="text-[10px] h-5 max-w-[140px] truncate">{socio.programma}</Badge>}
                        {socio.anzianita_lionistica != null && <span className="text-[10px] text-muted-foreground">{socio.anzianita_lionistica} anni Lions</span>}
                      </div>
                      {(socio.citta || socio.stato_provincia) && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          📍 {[socio.citta, socio.stato_provincia].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {socio.professione && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          💼 {socio.professione}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <SortableHead field="matricola_socio" label="Matricola" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="nome" label="Nome" sort={sort} onSort={handleSort} />
                        <SortableHead field="cognome" label="Cognome" sort={sort} onSort={handleSort} />
                        <SortableHead field="nome_club" label="Club" sort={sort} onSort={handleSort} />
                        <SortableHead field="club_zona" label="Zona" sort={sort} onSort={handleSort} />
                        <SortableHead field="club_circoscrizione" label="Circ." sort={sort} onSort={handleSort} />
                        <SortableHead field="sesso" label="Gen." sort={sort} onSort={handleSort} />
                        <SortableHead field="fascia_eta" label="Fascia" sort={sort} onSort={handleSort} />
                        <SortableHead field="anzianita_lionistica" label="Anzianità" sort={sort} onSort={handleSort} />
                        <SortableHead field="fascia_anzianita" label="F. Anz." sort={sort} onSort={handleSort} />
                        <SortableHead field="categoria_socio" label="Classificazione" sort={sort} onSort={handleSort} />
                        <SortableHead field="programma" label="Programma" sort={sort} onSort={handleSort} />
                        <SortableHead field="professione" label="Professione" sort={sort} onSort={handleSort} />
                        <SortableHead field="citta" label="Città" sort={sort} onSort={handleSort} />
                        <SortableHead field="stato_provincia" label="Prov." sort={sort} onSort={handleSort} />
                        <SortableHead field="telefono_cellulare" label="Cellulare" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="email_effettiva" label="Email" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {soci.map((socio: any) => (
                        <tr
                          key={socio.matricola_socio}
                          className="hover:bg-muted/40 border-b border-border/30"
                        >
                          <TableCell className="font-mono text-xs whitespace-nowrap">{socio.matricola_socio}</TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{socio.nome}</TableCell>
                          <TableCell className="whitespace-nowrap">{socio.cognome}</TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap max-w-[200px] truncate" title={socio.nome_club}>{socio.nome_club}</TableCell>
                          <TableCell className="whitespace-nowrap"><Badge variant="outline" className="text-xs">{socio.club_zona}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{socio.club_circoscrizione}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{socio.sesso}</TableCell>
                          <TableCell className="whitespace-nowrap"><Badge className="text-xs">{socio.fascia_eta}</Badge></TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{socio.anzianita_lionistica != null ? `${socio.anzianita_lionistica} anni` : ''}</TableCell>
                          <TableCell className="whitespace-nowrap">{socio.fascia_anzianita && <Badge variant="outline" className="text-xs">{socio.fascia_anzianita}</Badge>}</TableCell>
                          <TableCell className="whitespace-nowrap">{socio.categoria_socio && <Badge variant="outline" className="text-[10px]">{socio.categoria_socio}</Badge>}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap max-w-[140px] truncate" title={socio.programma}>{socio.programma}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap max-w-[150px] truncate" title={socio.professione}>{socio.professione}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap max-w-[140px] truncate" title={socio.citta}>{socio.citta}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{socio.stato_provincia}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">{socio.telefono_cellulare}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap max-w-[200px] truncate" title={socio.email_effettiva ?? ''}>{socio.email_effettiva ?? ''}</TableCell>
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
