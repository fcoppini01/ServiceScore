'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'

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

const STATO_COLORS: Record<string, string> = {
  Completato: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  'In corso': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  Pianificato: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
}

export default function AttivitaPage() {
  const [attivita, setAttivita] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    stato: '',
    zona: '',
    causa: '',
    tipoProgetto: '',
    minFondi: '',
    maxFondi: '',
    minPersone: '',
    maxPersone: ''
  })
  const [zone, setZone] = useState<string[]>([])
  const [cause, setCause] = useState<string[]>([])
  const [tipiProgetto, setTipiProgetto] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadAttivita()
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filters, isClient])

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

    let query = supabase
      .from('vista_report_ricerca')
      .select('*')

    if (filters.search) {
      query = query.or(`titolo.ilike.%${filters.search}%,descrizione.ilike.%${filters.search}%`)
    }
    if (filters.stato) {
      query = query.eq('stato', filters.stato)
    }
    if (filters.zona) {
      query = query.eq('sponsor_zona', filters.zona)
    }
    if (filters.causa) {
      query = query.eq('causa', filters.causa)
    }
    if (filters.tipoProgetto) {
      query = query.eq('tipo_progetto', filters.tipoProgetto)
    }
    if (filters.minFondi) {
      query = query.gte('totale_fondi_raccolti', parseFloat(filters.minFondi))
    }
    if (filters.maxFondi) {
      query = query.lte('totale_fondi_raccolti', parseFloat(filters.maxFondi))
    }
    if (filters.minPersone) {
      query = query.gte('persone_servite', parseFloat(filters.minPersone))
    }
    if (filters.maxPersone) {
      query = query.lte('persone_servite', parseFloat(filters.maxPersone))
    }

    const { data, error: queryError } = await query.limit(100)

    if (queryError) {
      setError('Errore nel caricamento delle attività. Riprova.')
    } else {
      setAttivita(data || [])
    }
    setLoading(false)
  }

  function clearFilters() {
    setFilters({
      search: '',
      stato: '',
      zona: '',
      causa: '',
      tipoProgetto: '',
      minFondi: '',
      maxFondi: '',
      minPersone: '',
      maxPersone: ''
    })
  }

  if (!isClient) return null

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto p-4 sm:p-8"
    >
      <motion.h1
        variants={itemVariants}
        className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent"
      >
        Attività di Servizio
      </motion.h1>

      <motion.div variants={itemVariants}>
        <Card className="mb-6 sm:mb-8 border-2 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Filtri di Ricerca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <Input
                placeholder="Cerca titolo, descrizione..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="sm:col-span-2"
              />

              <Select value={filters.stato} onValueChange={(v: string | null) => setFilters({ ...filters, stato: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti</SelectItem>
                  <SelectItem value="Completato">Completato</SelectItem>
                  <SelectItem value="In corso">In corso</SelectItem>
                  <SelectItem value="Pianificato">Pianificato</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.zona} onValueChange={(v: string | null) => setFilters({ ...filters, zona: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutte</SelectItem>
                  {zone.map(z => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.causa} onValueChange={(v: string | null) => setFilters({ ...filters, causa: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Causa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutte</SelectItem>
                  {cause.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.tipoProgetto} onValueChange={(v: string | null) => setFilters({ ...filters, tipoProgetto: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo Progetto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti</SelectItem>
                  {tipiProgetto.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Min Fondi (€)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minFondi}
                  onChange={(e) => setFilters({ ...filters, minFondi: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Fondi (€)</label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={filters.maxFondi}
                  onChange={(e) => setFilters({ ...filters, maxFondi: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Min Persone</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPersone}
                  onChange={(e) => setFilters({ ...filters, minPersone: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Persone</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={filters.maxPersone}
                  onChange={(e) => setFilters({ ...filters, maxPersone: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <Button variant="outline" className="w-full sm:w-auto" onClick={clearFilters}>
              Cancella Filtri
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-2 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Elenco Attività ({attivita.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                />
              </div>
            ) : attivita.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <span className="text-2xl">🔍</span>
                <span className="text-sm">Nessuna attività trovata</span>
              </div>
            ) : (
              <table className="w-full min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Titolo</TableHead>
                    <TableHead className="hidden sm:table-cell">Club</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="hidden md:table-cell">Causa</TableHead>
                    <TableHead>Persone</TableHead>
                    <TableHead className="hidden sm:table-cell">Ore</TableHead>
                    <TableHead>Fondi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {attivita.map((att: any, index: number) => (
                      <motion.tr
                        key={att.id_attivita}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.03, type: "spring", stiffness: 100 }}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium max-w-[150px] sm:max-w-[200px] truncate">
                          {att.titolo}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{att.sponsor_nome_account}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{att.sponsor_zona}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATO_COLORS[att.stato] ?? 'bg-muted text-muted-foreground'}`}>
                            {att.stato}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">{att.causa}</TableCell>
                        <TableCell className="text-sm">{att.persone_servite}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{att.totale_ore_servizio}</TableCell>
                        <TableCell className="text-sm">€ {att.totale_fondi_raccolti}</TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
