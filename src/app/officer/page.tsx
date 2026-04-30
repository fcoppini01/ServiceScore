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
import { ChevronLeft, ChevronRight, SlidersHorizontal, ShieldCheck } from 'lucide-react'

const PAGE_SIZE = 20

interface Filters {
  search: string
  titolo: string
  zona: string
}

const EMPTY_FILTERS: Filters = { search: '', titolo: '', zona: '' }

export default function OfficerPage() {
  const [officer, setOfficer] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [zone, setZone] = useState<string[]>([])
  const [titoli, setTitoli] = useState<string[]>([])
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
    debounceRef.current = setTimeout(() => { loadOfficer() }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filters, page, isClient])

  async function loadFilterOptions() {
    const [zoneRes, titoliRes] = await Promise.all([
      supabase.from('vista_officer_ricerca').select('club_zona').not('club_zona', 'is', null),
      supabase.from('vista_officer_ricerca').select('titolo_ufficiale').not('titolo_ufficiale', 'is', null),
    ])
    if (zoneRes.data) setZone([...new Set(zoneRes.data.map(z => z.club_zona))].sort() as string[])
    if (titoliRes.data) setTitoli([...new Set(titoliRes.data.map(t => t.titolo_ufficiale))].sort() as string[])
  }

  async function loadOfficer() {
    setLoading(true)
    setError(null)

    let query = supabase.from('vista_officer_ricerca').select('*', { count: 'exact' })

    if (filters.search) query = query.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    if (filters.titolo) query = query.eq('titolo_ufficiale', filters.titolo)
    if (filters.zona) query = query.eq('club_zona', filters.zona)

    const { data, count, error: queryError } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (queryError) {
      setError('Errore nel caricamento degli incarichi. Riprova.')
    } else {
      setOfficer(data || [])
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
        Gestione Officer
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Incarichi ufficiali del Distretto 108 LA
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <Input
                  placeholder="Cerca nome, cognome..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                  className="bg-background/50"
                />
                <Select value={filters.titolo} onValueChange={(v) => updateFilters({ ...filters, titolo: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Incarico" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti</SelectItem>
                    {titoli.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.zona} onValueChange={(v) => updateFilters({ ...filters, zona: v ?? '' })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Zona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte</SelectItem>
                    {zone.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
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
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : officer.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <ShieldCheck className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessun incarico trovato</span>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {officer.map((off: any) => (
                    <div key={off.id_incarico} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{off.nome} {off.cognome}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{off.nome_club}</p>
                        </div>
                        <Badge className="text-[10px] shrink-0">{off.titolo_ufficiale}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5">{off.club_zona}</Badge>
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

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cognome</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Incarico</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Inizio</TableHead>
                        <TableHead>Fine</TableHead>
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
                          <TableCell className="font-medium">{off.nome}</TableCell>
                          <TableCell>{off.cognome}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{off.nome_club}</TableCell>
                          <TableCell><Badge className="text-xs">{off.titolo_ufficiale}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{off.club_zona}</Badge></TableCell>
                          <TableCell className="text-sm">{off.data_inizio ? new Date(off.data_inizio).toLocaleDateString('it-IT') : ''}</TableCell>
                          <TableCell className="text-sm">
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
