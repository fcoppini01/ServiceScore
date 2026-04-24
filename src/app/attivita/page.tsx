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
  stato: string
  zona: string
  causa: string
  tipoProgetto: string
  minFondi: string
  maxFondi: string
  minPersone: string
  maxPersone: string
}

export default function AttivitaPage() {
  const [attivita, setAttivita] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadAttivita()
  }, [filters])

  async function loadFilterOptions() {
    const { data: zoneData } = await supabase
      .from('vista_report_ricerca')
      .select('sponsor_zona')
      .not('sponsor_zona', 'is', null)
    
    if (zoneData) {
      const uniqueZone = [...new Set(zoneData.map(z => z.sponsor_zona))].sort()
      setZone(uniqueZone as string[])
    }

    const { data: causaData } = await supabase
      .from('vista_report_ricerca')
      .select('causa')
      .not('causa', 'is', null)
    
    if (causaData) {
      const uniqueCause = [...new Set(causaData.map(c => c.causa))].sort()
      setCause(uniqueCause as string[])
    }

    const { data: tipoData } = await supabase
      .from('vista_report_ricerca')
      .select('tipo_progetto')
      .not('tipo_progetto', 'is', null)
    
    if (tipoData) {
      const uniqueTipi = [...new Set(tipoData.map(t => t.tipo_progetto))].sort()
      setTipiProgetto(uniqueTipi as string[])
    }
  }

  async function loadAttivita() {
    setLoading(true)
    
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
    
    const { data, error } = await query.limit(100)
    
    if (!error && data) {
      setAttivita(data)
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

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Attività di Servizio</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtri di Ricerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Cerca per titolo, descrizione..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
            
            <Select value={filters.stato} onValueChange={(v: string | null) => setFilters({...filters, stato: v ?? ""})}>
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

            <Select value={filters.causa} onValueChange={(v: string | null) => setFilters({...filters, causa: v ?? ""})}>
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

            <Select value={filters.tipoProgetto} onValueChange={(v: string | null) => setFilters({...filters, tipoProgetto: v ?? ""})}>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Min Fondi (€)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minFondi}
                onChange={(e) => setFilters({...filters, minFondi: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Max Fondi (€)</label>
              <Input
                type="number"
                placeholder="100000"
                value={filters.maxFondi}
                onChange={(e) => setFilters({...filters, maxFondi: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Min Persone</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPersone}
                onChange={(e) => setFilters({...filters, minPersone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Max Persone</label>
              <Input
                type="number"
                placeholder="1000"
                value={filters.maxPersone}
                onChange={(e) => setFilters({...filters, maxPersone: e.target.value})}
              />
            </div>
          </div>

          <Button variant="outline" onClick={clearFilters}>
            Cancella Filtri
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Elenco Attività ({attivita.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Caricamento...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Causa</TableHead>
                  <TableHead>Persone</TableHead>
                  <TableHead>Ore</TableHead>
                  <TableHead>Fondi Raccolti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attivita.map((att: any) => (
                  <TableRow key={att.id_attivita}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {att.titolo}
                    </TableCell>
                    <TableCell>{att.sponsor_nome_account}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{att.sponsor_zona}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={att.stato === 'Completato' ? 'default' : 'secondary'}>
                        {att.stato}
                      </Badge>
                    </TableCell>
                    <TableCell>{att.causa}</TableCell>
                    <TableCell>{att.persone_servite}</TableCell>
                    <TableCell>{att.totale_ore_servizio}</TableCell>
                    <TableCell>€ {att.totale_fondi_raccolti}</TableCell>
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
