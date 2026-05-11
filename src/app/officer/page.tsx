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
import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, ShieldCheck, FileText } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 20

interface Filters {
  search: string
  titolo: string[]
  zona: string[]
  circoscrizione: string[]
  club: string[]
  soloAttivi: boolean
  dataInizioDa: string
  dataInizioA: string
  dataConclusioneDa: string
  dataConclusioneA: string
}

const EMPTY_FILTERS: Filters = {
  search: '', titolo: [], zona: [], circoscrizione: [], club: [],
  soloAttivi: false,
  dataInizioDa: '', dataInizioA: '',
  dataConclusioneDa: '', dataConclusioneA: '',
}

function countAdvancedFilters(f: Filters) {
  let c = 0
  if (f.circoscrizione.length) c++
  if (f.club.length) c++
  if (f.soloAttivi) c++
  if (f.dataInizioDa || f.dataInizioA) c++
  if (f.dataConclusioneDa || f.dataConclusioneA) c++
  return c
}

export default function OfficerPage() {
  const [officer, setOfficer] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [titoli, setTitoli] = useState<string[]>([])
  const [clubs, setClubs] = useState<string[]>([])
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
    debounceRef.current = setTimeout(() => { loadOfficer() }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters, page, sort, isClient])

  const handleSort = (field: string) => {
    setPage(0)
    setSort(s => nextSort(s, field))
  }

  async function loadFilterOptions() {
    const [zoneRes, circRes, titoliRes, clubRes] = await Promise.all([
      supabase.from('vista_officer_ricerca').select('club_zona').not('club_zona', 'is', null),
      supabase.from('vista_officer_ricerca').select('club_circoscrizione').not('club_circoscrizione', 'is', null),
      supabase.from('vista_officer_ricerca').select('titolo_ufficiale').not('titolo_ufficiale', 'is', null),
      supabase.from('club').select('nome_club').not('nome_club', 'is', null),
    ])
    if (zoneRes.data) setZone([...new Set(zoneRes.data.map(z => z.club_zona))].filter(Boolean).sort() as string[])
    if (circRes.data) setCircoscrizioni([...new Set(circRes.data.map(c => c.club_circoscrizione))].filter(Boolean).sort() as string[])
    if (titoliRes.data) setTitoli([...new Set(titoliRes.data.map(t => t.titolo_ufficiale))].filter(Boolean).sort() as string[])
    if (clubRes.data) setClubs([...new Set(clubRes.data.map(c => c.nome_club))].filter(Boolean).sort() as string[])
  }

  async function loadOfficer() {
    setLoading(true)
    setError(null)

    let query = supabase.from('vista_officer_ricerca').select('*', { count: 'exact' })

    if (filters.search) query = query.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    if (filters.titolo.length) query = query.in('titolo_ufficiale', filters.titolo)
    if (filters.zona.length) query = query.in('club_zona', filters.zona)
    if (filters.circoscrizione.length) query = query.in('club_circoscrizione', filters.circoscrizione)
    if (filters.club.length) query = query.in('nome_club', filters.club)
    if (filters.dataInizioDa) query = query.gte('data_inizio', filters.dataInizioDa)
    if (filters.dataInizioA) query = query.lte('data_inizio', filters.dataInizioA)
    if (filters.dataConclusioneDa) query = query.gte('data_conclusione', filters.dataConclusioneDa)
    if (filters.dataConclusioneA) query = query.lte('data_conclusione', filters.dataConclusioneA)
    if (filters.soloAttivi) query = query.is('data_conclusione', null)

    if (sort) query = query.order(sort.field, { ascending: sort.dir === 'asc', nullsFirst: false })

    const { data, count, error: queryError } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (queryError) setError('Errore nel caricamento degli incarichi. Riprova.')
    else { setOfficer(data || []); setTotalCount(count ?? 0) }
    setLoading(false)
  }

  function updateFilters(newFilters: Filters) {
    setPage(0)
    setFilters(newFilters)
  }

  const advancedCount = useMemo(() => countAdvancedFilters(filters), [filters])
  const basicCount = (filters.search ? 1 : 0) + (filters.titolo.length ? 1 : 0) + (filters.zona.length ? 1 : 0)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const start = totalCount === 0 ? 0 : page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, totalCount)

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Gestione Officer
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-4">
        Incarichi ufficiali del Distretto 108 LA
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quadri di Sintesi</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/officer/quadri/incarichi-club">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Incarichi con nomine dai Club
            </Button>
          </Link>
        </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input
                  placeholder="Cerca nome, cognome..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                  className="bg-background/50 sm:col-span-2 lg:col-span-1"
                />
                <MultiSelect
                  options={titoli}
                  selected={filters.titolo}
                  onChange={(v) => updateFilters({ ...filters, titolo: v })}
                  placeholder="Incarico / Titolo"
                />
                <MultiSelect
                  options={zone}
                  selected={filters.zona}
                  onChange={(v) => updateFilters({ ...filters, zona: v })}
                  placeholder="Zona"
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <MultiSelect options={circoscrizioni} selected={filters.circoscrizione} onChange={(v) => updateFilters({ ...filters, circoscrizione: v })} placeholder="Circoscrizione" />
                        <MultiSelect options={clubs} selected={filters.club} onChange={(v) => updateFilters({ ...filters, club: v })} placeholder="Club" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={filters.soloAttivi}
                          onChange={(e) => updateFilters({ ...filters, soloAttivi: e.target.checked })}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <span className="text-sm">Solo incarichi attivi (senza data di conclusione)</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium mb-1">Incarichi iniziati nel periodo</p>
                          <p className="text-[10px] text-muted-foreground mb-1.5">Data di inizio incarico compresa tra le due date</p>
                          <div className="flex items-center gap-1.5">
                            <Input type="date" value={filters.dataInizioDa} onChange={(e) => updateFilters({ ...filters, dataInizioDa: e.target.value })} className="text-sm bg-background/50" title="Inizio incarico dal" />
                            <span className="text-xs text-muted-foreground shrink-0">→</span>
                            <Input type="date" value={filters.dataInizioA} onChange={(e) => updateFilters({ ...filters, dataInizioA: e.target.value })} className="text-sm bg-background/50" title="Inizio incarico al" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1">Incarichi conclusi nel periodo</p>
                          <p className="text-[10px] text-muted-foreground mb-1.5">Data di conclusione compresa tra le due date</p>
                          <div className="flex items-center gap-1.5">
                            <Input type="date" value={filters.dataConclusioneDa} onChange={(e) => updateFilters({ ...filters, dataConclusioneDa: e.target.value })} className="text-sm bg-background/50" title="Fine incarico dal" />
                            <span className="text-xs text-muted-foreground shrink-0">→</span>
                            <Input type="date" value={filters.dataConclusioneA} onChange={(e) => updateFilters({ ...filters, dataConclusioneA: e.target.value })} className="text-sm bg-background/50" title="Fine incarico al" />
                          </div>
                        </div>
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
                Elenco Incarichi
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
            ) : officer.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <ShieldCheck className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessun incarico trovato</span>
              </div>
            ) : (
              <>
                <MobileSortSelect
                  options={[
                    { value: 'cognome:asc', label: 'Cognome A→Z' },
                    { value: 'cognome:desc', label: 'Cognome Z→A' },
                    { value: 'titolo_ufficiale:asc', label: 'Incarico A→Z' },
                    { value: 'data_inizio:desc', label: 'Inizio (più recente)' },
                    { value: 'data_inizio:asc', label: 'Inizio (più vecchio)' },
                    { value: 'nome_club:asc', label: 'Club A→Z' },
                  ]}
                  sort={sort}
                  onChange={(s) => { setPage(0); setSort(s) }}
                />
                <div className="md:hidden space-y-3">
                  {officer.map((off: any) => (
                    <div key={off.id_incarico} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm break-words">{off.nome} {off.cognome}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">{off.nome_club}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 shrink-0">{off.club_zona}</Badge>
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <Badge className="text-[10px] inline-block max-w-full whitespace-normal text-left leading-snug py-1 px-2 h-auto">
                          {off.titolo_ufficiale}
                        </Badge>
                        {off.club_circoscrizione && <Badge variant="outline" className="text-[10px] h-5">{off.club_circoscrizione}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                        {off.data_inizio && <span>Dal {new Date(off.data_inizio).toLocaleDateString('it-IT')}</span>}
                        {off.data_conclusione
                          ? <span>al {new Date(off.data_conclusione).toLocaleDateString('it-IT')}</span>
                          : <span className="text-green-500 font-medium">In corso</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <SortableHead field="nome" label="Nome" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="cognome" label="Cognome" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="nome_club" label="Club" sort={sort} onSort={handleSort} />
                        <SortableHead field="titolo_ufficiale" label="Incarico" sort={sort} onSort={handleSort} />
                        <SortableHead field="club_zona" label="Zona" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="club_circoscrizione" label="Circ." sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="data_inizio" label="Inizio" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                        <SortableHead field="data_conclusione" label="Fine" sort={sort} onSort={handleSort} className="whitespace-nowrap" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {officer.map((off: any, index: number) => (
                        <motion.tr
                          key={off.id_incarico}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-muted/40"
                        >
                          <TableCell className="font-medium whitespace-nowrap">{off.nome}</TableCell>
                          <TableCell className="whitespace-nowrap">{off.cognome}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={off.nome_club}>{off.nome_club}</TableCell>
                          <TableCell><Badge className="text-xs whitespace-normal leading-snug py-1 h-auto max-w-[280px] inline-block">{off.titolo_ufficiale}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap"><Badge variant="outline" className="text-xs">{off.club_zona}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{off.club_circoscrizione}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{off.data_inizio ? new Date(off.data_inizio).toLocaleDateString('it-IT') : ''}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {off.data_conclusione
                              ? new Date(off.data_conclusione).toLocaleDateString('it-IT')
                              : <span className="text-green-500">In corso</span>
                            }
                          </TableCell>
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
