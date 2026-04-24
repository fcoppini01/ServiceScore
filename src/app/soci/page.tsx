'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

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

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadSoci()
  }, [filters])

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

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Gestione Soci</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtri di Ricerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Cerca per nome, cognome..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
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
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Cancella Filtri
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Elenco Soci ({soci.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Caricamento...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricola</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Circ.</TableHead>
                  <TableHead>Genere</TableHead>
                  <TableHead>Fascia Età</TableHead>
                  <TableHead>Anzianità</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soci.map((socio: any) => (
                  <TableRow key={socio.matricola_socio}>
                    <TableCell className="font-mono text-sm">{socio.matricola_socio}</TableCell>
                    <TableCell>{socio.nome}</TableCell>
                    <TableCell>{socio.cognome}</TableCell>
                    <TableCell>{socio.nome_club}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{socio.club_zona}</Badge>
                    </TableCell>
                    <TableCell>{socio.club_circoscrizione}</TableCell>
                    <TableCell>{socio.sesso}</TableCell>
                    <TableCell>
                      <Badge>{socio.fascia_eta}</Badge>
                    </TableCell>
                    <TableCell>{socio.anzianita_lionistica} anni</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
