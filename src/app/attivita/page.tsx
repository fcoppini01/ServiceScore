'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ChevronLeft, ChevronRight, SlidersHorizontal, Activity } from 'lucide-react'

const PAGE_SIZE = 20

interface Filters {
  search: string
  stato: string
  zona: string
  causa: string
  tipoProgetto: string
  minFondi: string
  maxFondi: string
  minPersone: string
  maxPersone: string
}

const EMPTY_FILTERS: Filters = {
  search: '', stato: '', zona: '', causa: '', tipoProgetto: '',
  minFondi: '', maxFondi: '', minPersone: '', maxPersone: ''
}

const STATO_COLORS: Record<string, string> = {
  Completato: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  'In corso': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  Pianificato: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
}

export default function AttivitaPage() {
  const [attivita, setAttivita] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [zone, setZone] = useState<string[]>([])
  const [cause, setCause] = useState<string[]>([])
  const [tipiProgetto, setTipiProgetto] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
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
  }, [filters, page, isClient])

  async function loadFilterOptions() {
    const [zoneRes, causaRes, tipoRes] = await Promise.all([
      supabase.from('vista_report_ricerca').select('sponsor_zona').not('sponsor_zona', 'is', null),
      supabase.from('vista_report_ricerca').select('causa').not('causa', 'is', null),
      supabase.from('vista_report_ricerca').select('tipo_progetto').not('tipo_progetto', 'is', null),
    ])
    if (zoneRes.data) setZone([...new Set(zoneRes.data.map(z => z.sponsor_zona))].sort() as string[])
    if (causaRes.data) setCause([...new Set(causaRes.data.map(c => c.causa))].sort() as string[])
    if (tipoRes.data) setTipiProgetto([...new Set(tipoRes.data.map(t => t.tipo_progetto))].sort() as string[])
  }

  async function loadAttivita() {
    setLoading(true)
    setError(null)

    let query = supabase.from('vista_report_ricerca').select('*', { count: 'exact' })

    if (filters.search) query = query.or(`titolo.ilike.%${filters.search}%,descrizione.ilike.%${filters.search}%`)
    if (filters.stato) query = query.eq('stato', filters.stato)
    if (filters.zona) query = query.eq('sponsor_zona', filters.zona)
    if (filters.causa) query = query.eq('causa', filters.causa)
    if (filters.tipoProgetto) query = query.eq('tipo_progetto', filters.tipoProgetto)
    if (filters.minFondi) query = query.gte('totale_fondi_raccolti', parseFloat(filters.minFondi))
    if (filters.maxFondi) query = query.lte('totale_fondi_raccolti', parseFloat(filters.maxFondi))
    if (filters.minPersone) query = query.gte('persone_servite', parseFloat(filters.minPersone))
    if (filters.maxPersone) query = query.lte('persone_servite', parseFloat(filters.maxPersone))

    const { data, count, error: queryError } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (queryError) {
      setError('Errore nel caricamento delle attività. Riprova.')
    } else {
      setAttivita(data || [])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }

  function updateFilters(newFilters: Filters) {
    setPage(0)
    setFilters(newFilters)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const start = totalCount === 0 ? 0 : page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, totalCount)

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Attività di Servizio
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Reportistica attività del Distretto 108 LA
      </motion.p>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6 border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Filtri di Ricerca</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden flex items-center gap-1.5 text-xs h-8 px-2"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {filtersOpen ? 'Nascondi' : 'Filtri'}
              </Button>
            </div>
          </CardHeader>
          <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <Input
                  placeholder="Cerca titolo, descrizione..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                  className="sm:col-span-2 bg-background/50"
                />
                <Select value={filters.stato} onValueChange={(v) => updateFilters({ ...filters, stato: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Stato" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti</SelectItem>
                    <SelectItem value="Completato">Completato</SelectItem>
                    <SelectItem value="In corso">In corso</SelectItem>
                    <SelectItem value="Pianificato">Pianificato</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.zona} onValueChange={(v) => updateFilters({ ...filters, zona: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Zona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte</SelectItem>
                    {zone.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.causa} onValueChange={(v) => updateFilters({ ...filters, causa: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Causa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte</SelectItem>
                    {cause.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.tipoProgetto} onValueChange={(v) => updateFilters({ ...filters, tipoProgetto: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Tipo Progetto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti</SelectItem>
                    {tipiProgetto.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted-foreground">Min Fondi (€)</label>
                  <Input type="number" placeholder="0" value={filters.minFondi} onChange={(e) => updateFilters({ ...filters, minFondi: e.target.value })} className="text-sm bg-background/50" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted-foreground">Max Fondi (€)</label>
                  <Input type="number" placeholder="100000" value={filters.maxFondi} onChange={(e) => updateFilters({ ...filters, maxFondi: e.target.value })} className="text-sm bg-background/50" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted-foreground">Min Persone</label>
                  <Input type="number" placeholder="0" value={filters.minPersone} onChange={(e) => updateFilters({ ...filters, minPersone: e.target.value })} className="text-sm bg-background/50" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted-foreground">Max Persone</label>
                  <Input type="number" placeholder="1000" value={filters.maxPersone} onChange={(e) => updateFilters({ ...filters, maxPersone: e.target.value })} className="text-sm bg-background/50" />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => updateFilters(EMPTY_FILTERS)} className="text-xs">
                Cancella filtri
              </Button>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Results */}
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
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : attivita.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessuna attività trovata</span>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {attivita.map((att: any) => (
                    <div key={att.id_attivita} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight line-clamp-2">{att.titolo}</p>
                        <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${STATO_COLORS[att.stato] ?? 'bg-muted text-muted-foreground'}`}>
                          {att.stato}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{att.sponsor_nome_account}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5">{att.sponsor_zona}</Badge>
                        {att.causa && <span className="text-[10px] text-muted-foreground truncate">{att.causa}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/30">
                        <span><span className="font-medium text-foreground">{att.persone_servite ?? 0}</span> persone</span>
                        <span><span className="font-medium text-foreground">{att.totale_ore_servizio ?? 0}</span> ore</span>
                        <span><span className="font-medium text-foreground">€ {att.totale_fondi_raccolti ?? 0}</span></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titolo</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Causa</TableHead>
                        <TableHead>Persone</TableHead>
                        <TableHead>Ore</TableHead>
                        <TableHead>Fondi</TableHead>
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
                          <TableCell className="font-medium max-w-[200px] truncate">{att.titolo}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{att.sponsor_nome_account}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{att.sponsor_zona}</Badge></TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATO_COLORS[att.stato] ?? 'bg-muted text-muted-foreground'}`}>
                              {att.stato}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{att.causa}</TableCell>
                          <TableCell className="text-sm">{att.persone_servite}</TableCell>
                          <TableCell className="text-sm">{att.totale_ore_servizio}</TableCell>
                          <TableCell className="text-sm tabular-nums">€ {att.totale_fondi_raccolti}</TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </table>
                </div>

                {/* Pagination */}
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
