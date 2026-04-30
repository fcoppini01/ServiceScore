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

export default function OfficerPage() {
  const [officer, setOfficer] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    titolo: '',
    zona: '',
  })
  const [zone, setZone] = useState<string[]>([])
  const [titoli, setTitoli] = useState<string[]>([])
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
      loadOfficer()
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filters, isClient])

  async function loadFilterOptions() {
    const [zoneRes, titoliRes] = await Promise.all([
      supabase.from('vista_officer_ricerca').select('club_zona').not('club_zona', 'is', null),
      supabase.from('vista_officer_ricerca').select('titolo_ufficiale').not('titolo_ufficiale', 'is', null),
    ])

    if (zoneRes.data) {
      setZone([...new Set(zoneRes.data.map(z => z.club_zona))].sort() as string[])
    }
    if (titoliRes.data) {
      setTitoli([...new Set(titoliRes.data.map(t => t.titolo_ufficiale))].sort() as string[])
    }
  }

  async function loadOfficer() {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('vista_officer_ricerca')
      .select('*')

    if (filters.search) {
      query = query.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    }
    if (filters.titolo) {
      query = query.eq('titolo_ufficiale', filters.titolo)
    }
    if (filters.zona) {
      query = query.eq('club_zona', filters.zona)
    }

    const { data, error: queryError } = await query.limit(100)

    if (queryError) {
      setError('Errore nel caricamento degli incarichi. Riprova.')
    } else {
      setOfficer(data || [])
    }
    setLoading(false)
  }

  function clearFilters() {
    setFilters({ search: '', titolo: '', zona: '' })
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
        Gestione Officer
      </motion.h1>

      <motion.div variants={itemVariants}>
        <Card className="mb-6 sm:mb-8 border-2 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Filtri di Ricerca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <Input
                placeholder="Cerca nome, cognome..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />

              <Select value={filters.titolo} onValueChange={(v: string | null) => setFilters({ ...filters, titolo: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Incarico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti</SelectItem>
                  {titoli.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
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
            <CardTitle className="text-lg sm:text-xl">Elenco Incarichi ({officer.length})</CardTitle>
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
            ) : officer.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <span className="text-2xl">🔍</span>
                <span className="text-sm">Nessun incarico trovato</span>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cognome</TableHead>
                    <TableHead className="hidden sm:table-cell">Club</TableHead>
                    <TableHead>Incarico</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead className="hidden md:table-cell">Inizio</TableHead>
                    <TableHead className="hidden md:table-cell">Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {officer.map((off: any, index: number) => (
                      <motion.tr
                        key={off.id_incarico}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.03, type: "spring", stiffness: 100 }}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{off.nome}</TableCell>
                        <TableCell>{off.cognome}</TableCell>
                        <TableCell className="hidden sm:table-cell">{off.nome_club}</TableCell>
                        <TableCell>
                          <Badge className="text-xs">{off.titolo_ufficiale}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{off.club_zona}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {off.data_inizio ? new Date(off.data_inizio).toLocaleDateString('it-IT') : ''}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {off.data_conclusione
                            ? new Date(off.data_conclusione).toLocaleDateString('it-IT')
                            : <span className="text-green-500">In corso</span>
                          }
                        </TableCell>
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
