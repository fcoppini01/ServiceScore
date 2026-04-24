'use client'

import { useState, useEffect } from 'react'
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
  sesso: string
  fasciaEta: string
  zona: string
  circoscrizione: string
}

export default function SociPage() {
  const [soci, setSoci] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    sesso: '',
    fasciaEta: '',
    zona: '',
    circoscrizione: ''
  })
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (isClient) loadSoci()
  }, [filters, isClient])

  async function loadFilterOptions() {
    const { data: zoneData } = await supabase
      .from('club')
      .select('zona')
      .not('zona', 'is', null)
    
    if (zoneData) {
      const uniqueZone = [...new Set(zoneData.map(z => z.zona))].sort()
      setZone(uniqueZone as string[])
    }

    const { data: circData } = await supabase
      .from('club')
      .select('circoscrizione')
      .not('circoscrizione', 'is', null)
    
    if (circData) {
      const uniqueCirc = [...new Set(circData.map(c => c.circoscrizione))].sort()
      setCircoscrizioni(uniqueCirc as string[])
    }
  }

  async function loadSoci() {
    setLoading(true)
    
    let query = supabase
      .from('vista_soci_ricerca')
      .select('*')
    
    if (filters.search) {
      query = query.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    }
    if (filters.sesso) {
      query = query.eq('sesso', filters.sesso)
    }
    if (filters.fasciaEta) {
      query = query.eq('fascia_eta', filters.fasciaEta)
    }
    if (filters.zona) {
      query = query.eq('club_zona', filters.zona)
    }
    if (filters.circoscrizione) {
      query = query.eq('club_circoscrizione', filters.circoscrizione)
    }
    
    const { data, error } = await query.limit(100)
    
    if (!error && data) {
      setSoci(data)
    }
    setLoading(false)
  }

  function clearFilters() {
    setFilters({
      search: '',
      sesso: '',
      fasciaEta: '',
      zona: '',
      circoscrizione: ''
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
        Gestione Soci
      </motion.h1>
      
      <motion.div variants={itemVariants}>
        <Card className="mb-6 sm:mb-8 border-2 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Filtri di Ricerca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
              <Input
                placeholder="Cerca nome, cognome..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="sm:col-span-2 lg:col-span-1"
              />
              
              <Select value={filters.sesso} onValueChange={(v: string | null) => setFilters({...filters, sesso: v ?? ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Genere" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti</SelectItem>
                  <SelectItem value="M">Maschio</SelectItem>
                  <SelectItem value="F">Femmina</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.fasciaEta} onValueChange={(v: string | null) => setFilters({...filters, fasciaEta: v ?? ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Fascia d'età" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutte</SelectItem>
                  <SelectItem value="Under 30">Under 30</SelectItem>
                  <SelectItem value="30-50">30-50</SelectItem>
                  <SelectItem value="51-70">51-70</SelectItem>
                  <SelectItem value="Over 70">Over 70</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.zona} onValueChange={(v: string | null) => setFilters({...filters, zona: v ?? ""})}>
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

              <Select value={filters.circoscrizione} onValueChange={(v: string | null) => setFilters({...filters, circoscrizione: v ?? ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Circoscrizione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutte</SelectItem>
                  {circoscrizioni.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
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
            <CardTitle className="text-lg sm:text-xl">Elenco Soci ({soci.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                />
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Matricola</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cognome</TableHead>
                    <TableHead className="hidden sm:table-cell">Club</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead className="hidden md:table-cell">Circ.</TableHead>
                    <TableHead>Genere</TableHead>
                    <TableHead className="hidden sm:table-cell">Fascia</TableHead>
                    <TableHead className="hidden md:table-cell">Anzianità</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {soci.map((socio: any, index: number) => (
                      <motion.tr
                        key={socio.matricola_socio}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.03, type: "spring", stiffness: 100 }}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-mono text-xs sm:text-sm">{socio.matricola_socio}</TableCell>
                        <TableCell className="font-medium">{socio.nome}</TableCell>
                        <TableCell>{socio.cognome}</TableCell>
                        <TableCell className="hidden sm:table-cell">{socio.nome_club}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{socio.club_zona}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{socio.club_circoscrizione}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{socio.sesso}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className="text-xs">{socio.fascia_eta}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{socio.anzianita_lionistica} anni</TableCell>
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
