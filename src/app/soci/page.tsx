'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion, AnimatePresence } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Users } from 'lucide-react'

const PAGE_SIZE = 20

interface Filters {
  search: string
  sesso: string[]
  fasciaEta: string[]
  zona: string[]
  circoscrizione: string[]
  categoriaAssociativa: string[]
  club: string[]
  professione: string
  citta: string
  provincia: string
  anzianitaMin: string
  anzianitaMax: string
}

const EMPTY_FILTERS: Filters = {
  search: '', sesso: [], fasciaEta: [],
  zona: [], circoscrizione: [], categoriaAssociativa: [], club: [],
  professione: '', citta: '', provincia: '',
  anzianitaMin: '', anzianitaMax: '',
}

function countAdvancedFilters(f: Filters) {
  let c = 0
  if (f.zona.length) c++
  if (f.circoscrizione.length) c++
  if (f.categoriaAssociativa.length) c++
  if (f.club.length) c++
  if (f.professione) c++
  if (f.citta) c++
  if (f.provincia) c++
  if (f.anzianitaMin || f.anzianitaMax) c++
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
  const [categorie, setCategorie] = useState<string[]>([])
  const [clubs, setClubs] = useState<string[]>([])
  const [sessiDisponibili, setSessiDisponibili] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
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
  }, [filters, page, isClient])

  async function loadFilterOptions() {
    const [zoneRes, circRes, catRes, clubRes, sessoRes] = await Promise.all([
      supabase.from('club').select('zona').not('zona', 'is', null),
      supabase.from('club').select('circoscrizione').not('circoscrizione', 'is', null),
      supabase.from('soci').select('categoria_associativa').not('categoria_associativa', 'is', null),
      supabase.from('club').select('nome_club').not('nome_club', 'is', null),
      supabase.from('soci').select('sesso').not('sesso', 'is', null),
    ])
    if (zoneRes.data) setZone([...new Set(zoneRes.data.map(z => z.zona))].sort() as string[])
    if (circRes.data) setCircoscrizioni([...new Set(circRes.data.map(c => c.circoscrizione))].sort() as string[])
    if (catRes.data) setCategorie([...new Set(catRes.data.map(c => c.categoria_associativa))].filter(Boolean).sort() as string[])
    if (clubRes.data) setClubs([...new Set(clubRes.data.map(c => c.nome_club))].filter(Boolean).sort() as string[])
    if (sessoRes.data) setSessiDisponibili([...new Set(sessoRes.data.map(s => s.sesso))].filter(Boolean).sort() as string[])
  }

  async function loadSoci() {
    setLoading(true)
    setError(null)

    let query = supabase.from('vista_soci_ricerca').select('*', { count: 'exact' })

    if (filters.search) query = query.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    if (filters.sesso.length) query = query.in('sesso', filters.sesso)
    if (filters.fasciaEta.length) query = query.in('fascia_eta', filters.fasciaEta)
    if (filters.zona.length) query = query.in('club_zona', filters.zona)
    if (filters.circoscrizione.length) query = query.in('club_circoscrizione', filters.circoscrizione)
    if (filters.categoriaAssociativa.length) query = query.in('categoria_associativa', filters.categoriaAssociativa)
    if (filters.club.length) query = query.in('nome_club', filters.club)
    if (filters.professione) query = query.ilike('professione', `%${filters.professione}%`)
    if (filters.citta) query = query.ilike('citta', `%${filters.citta}%`)
    if (filters.provincia) query = query.ilike('stato_provincia', `%${filters.provincia}%`)
    if (filters.anzianitaMin) query = query.gte('anzianita_lionistica', parseInt(filters.anzianitaMin))
    if (filters.anzianitaMax) query = query.lte('anzianita_lionistica', parseInt(filters.anzianitaMax))

    const { data, count, error: queryError } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (queryError) setError('Errore nel caricamento dei soci. Riprova.')
    else { setSoci(data || []); setTotalCount(count ?? 0) }
    setLoading(false)
  }

  function updateFilters(newFilters: Filters) {
    setPage(0)
    setFilters(newFilters)
  }

  const advancedCount = useMemo(() => countAdvancedFilters(filters), [filters])
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const start = totalCount === 0 ? 0 : page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, totalCount)

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Gestione Soci
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Elenco soci del Distretto 108 LA
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
                  options={['Under 30', '30-50', '51-70', 'Over 70']}
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
                        <MultiSelect options={zone} selected={filters.zona} onChange={(v) => updateFilters({ ...filters, zona: v })} placeholder="Zona" />
                        <MultiSelect options={circoscrizioni} selected={filters.circoscrizione} onChange={(v) => updateFilters({ ...filters, circoscrizione: v })} placeholder="Circoscrizione" />
                        <MultiSelect options={clubs} selected={filters.club} onChange={(v) => updateFilters({ ...filters, club: v })} placeholder="Club" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <MultiSelect options={categorie} selected={filters.categoriaAssociativa} onChange={(v) => updateFilters({ ...filters, categoriaAssociativa: v })} placeholder="Categoria associativa" />
                        <Input placeholder="Professione..." value={filters.professione} onChange={(e) => updateFilters({ ...filters, professione: e.target.value })} className="bg-background/50" />
                        <Input placeholder="Città..." value={filters.citta} onChange={(e) => updateFilters({ ...filters, citta: e.target.value })} className="bg-background/50" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Input placeholder="Provincia..." value={filters.provincia} onChange={(e) => updateFilters({ ...filters, provincia: e.target.value })} className="bg-background/50" />
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Anzianità (anni)</p>
                          <div className="flex items-center gap-1.5">
                            <Input type="number" placeholder="Da" value={filters.anzianitaMin} onChange={(e) => updateFilters({ ...filters, anzianitaMin: e.target.value })} className="text-sm bg-background/50" />
                            <span className="text-xs text-muted-foreground shrink-0">—</span>
                            <Input type="number" placeholder="A" value={filters.anzianitaMax} onChange={(e) => updateFilters({ ...filters, anzianitaMax: e.target.value })} className="text-sm bg-background/50" />
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Elenco Soci
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
            ) : soci.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Users className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessun socio trovato</span>
              </div>
            ) : (
              <>
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5">{socio.club_zona}</Badge>
                        {socio.anzianita_lionistica && <span className="text-[10px] text-muted-foreground">{socio.anzianita_lionistica} anni</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Matricola</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cognome</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Circ.</TableHead>
                        <TableHead>Gen.</TableHead>
                        <TableHead>Fascia</TableHead>
                        <TableHead>Anzianità</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {soci.map((socio: any, index: number) => (
                        <motion.tr
                          key={socio.matricola_socio}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-muted/40"
                        >
                          <TableCell className="font-mono text-xs">{socio.matricola_socio}</TableCell>
                          <TableCell className="font-medium">{socio.nome}</TableCell>
                          <TableCell>{socio.cognome}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{socio.nome_club}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{socio.club_zona}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{socio.club_circoscrizione}</TableCell>
                          <TableCell className="text-xs">{socio.sesso}</TableCell>
                          <TableCell><Badge className="text-xs">{socio.fascia_eta}</Badge></TableCell>
                          <TableCell className="text-sm">{socio.anzianita_lionistica} anni</TableCell>
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
