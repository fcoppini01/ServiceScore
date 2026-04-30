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
import { ChevronLeft, ChevronRight, SlidersHorizontal, Users } from 'lucide-react'

const PAGE_SIZE = 20

interface Filters {
  search: string
  sesso: string
  fasciaEta: string
  zona: string
  circoscrizione: string
}

const EMPTY_FILTERS: Filters = { search: '', sesso: '', fasciaEta: '', zona: '', circoscrizione: '' }

export default function SociPage() {
  const [soci, setSoci] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
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
    debounceRef.current = setTimeout(() => { loadSoci() }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters, page, isClient])

  async function loadFilterOptions() {
    const [zoneRes, circRes] = await Promise.all([
      supabase.from('club').select('zona').not('zona', 'is', null),
      supabase.from('club').select('circoscrizione').not('circoscrizione', 'is', null),
    ])
    if (zoneRes.data) setZone([...new Set(zoneRes.data.map(z => z.zona))].sort() as string[])
    if (circRes.data) setCircoscrizioni([...new Set(circRes.data.map(c => c.circoscrizione))].sort() as string[])
  }

  async function loadSoci() {
    setLoading(true)
    setError(null)

    let query = supabase.from('vista_soci_ricerca').select('*', { count: 'exact' })

    if (filters.search) query = query.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    if (filters.sesso) query = query.eq('sesso', filters.sesso)
    if (filters.fasciaEta) query = query.eq('fascia_eta', filters.fasciaEta)
    if (filters.zona) query = query.eq('club_zona', filters.zona)
    if (filters.circoscrizione) query = query.eq('club_circoscrizione', filters.circoscrizione)

    const { data, count, error: queryError } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (queryError) {
      setError('Errore nel caricamento dei soci. Riprova.')
    } else {
      setSoci(data || [])
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
        Gestione Soci
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Elenco soci del Distretto 108 LA
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                <Input
                  placeholder="Cerca nome, cognome..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                  className="sm:col-span-2 lg:col-span-1 bg-background/50"
                />
                <Select value={filters.sesso} onValueChange={(v) => updateFilters({ ...filters, sesso: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Genere" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti</SelectItem>
                    <SelectItem value="M">Maschio</SelectItem>
                    <SelectItem value="F">Femmina</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.fasciaEta} onValueChange={(v) => updateFilters({ ...filters, fasciaEta: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Fascia d'età" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte</SelectItem>
                    <SelectItem value="Under 30">Under 30</SelectItem>
                    <SelectItem value="30-50">30-50</SelectItem>
                    <SelectItem value="51-70">51-70</SelectItem>
                    <SelectItem value="Over 70">Over 70</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.zona} onValueChange={(v) => updateFilters({ ...filters, zona: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Zona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte</SelectItem>
                    {zone.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.circoscrizione} onValueChange={(v) => updateFilters({ ...filters, circoscrizione: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Circoscrizione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte</SelectItem>
                    {circoscrizioni.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : soci.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Users className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessun socio trovato</span>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{socio.nome_club}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5">{socio.club_zona}</Badge>
                        {socio.anzianita_lionistica && (
                          <span className="text-[10px] text-muted-foreground">{socio.anzianita_lionistica} anni</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 0}
                      className="h-8 px-3 text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Prec
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Pagina {page + 1} di {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages - 1}
                      className="h-8 px-3 text-xs"
                    >
                      Succ
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
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
