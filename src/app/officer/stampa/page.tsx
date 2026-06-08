'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react'
import { getArray, getString } from '@/lib/filters-url'

const LABELS: Record<string, string> = {
  search: 'Cerca',
  titolo: 'Titolo',
  zona: 'Zona',
  circoscrizione: 'Circoscrizione',
  club: 'Club',
  soloAttivi: 'Solo incarichi attivi (in corso oggi)',
  dataInizioDa: 'Inizio dal',
  dataInizioA: 'Inizio al',
  dataConclusioneDa: 'Fine dal',
  dataConclusioneA: 'Fine al',
}

function StampaOfficerInner() {
  const sp = useSearchParams()!
  const [officer, setOfficer] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => { setIsClient(true) }, [])

  const filters = {
    search: getString(sp, 'search'),
    titolo: getArray(sp, 'titolo'),
    zona: getArray(sp, 'zona'),
    circoscrizione: getArray(sp, 'circoscrizione'),
    club: getArray(sp, 'club'),
    soloAttivi: getString(sp, 'soloAttivi') === 'true',
    dataInizioDa: getString(sp, 'dataInizioDa'),
    dataInizioA: getString(sp, 'dataInizioA'),
    dataConclusioneDa: getString(sp, 'dataConclusioneDa'),
    dataConclusioneA: getString(sp, 'dataConclusioneA'),
    sortField: getString(sp, 'sortField') || 'cognome',
    sortDir: getString(sp, 'sortDir') || 'asc',
  }

  useEffect(() => {
    if (!isClient) return
    setLoading(true)
    let q = supabase.from('vista_officer_ricerca').select('*')

    if (filters.search) q = q.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    if (filters.titolo.length) q = q.in('titolo_ufficiale', filters.titolo)
    if (filters.zona.length) q = q.in('club_zona', filters.zona)
    if (filters.circoscrizione.length) q = q.in('club_circoscrizione', filters.circoscrizione)
    if (filters.club.length) q = q.in('nome_club', filters.club)
    if (filters.soloAttivi) {
      const d = new Date()
      const oggi = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      q = q
        .or(`data_inizio.is.null,data_inizio.lte.${oggi}`)
        .or(`data_conclusione.is.null,data_conclusione.gte.${oggi}`)
    }
    if (filters.dataInizioDa) q = q.gte('data_inizio', filters.dataInizioDa)
    if (filters.dataInizioA) q = q.lte('data_inizio', filters.dataInizioA)
    if (filters.dataConclusioneDa) q = q.gte('data_conclusione', filters.dataConclusioneDa)
    if (filters.dataConclusioneA) q = q.lte('data_conclusione', filters.dataConclusioneA)

    q.order(filters.sortField, { ascending: filters.sortDir === 'asc', nullsFirst: false }).range(0, 9999).then(({ data, error }) => {
      if (error) setError('Errore nel caricamento. Riprova.')
      else setOfficer(data || [])
      setLoading(false)
    })
  }, [isClient, sp])

  const activeFilters: { label: string; value: string }[] = []
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'sortField' || key === 'sortDir') continue
    if (Array.isArray(value) && value.length > 0) activeFilters.push({ label: LABELS[key] ?? key, value: value.join(', ') })
    else if (typeof value === 'boolean' && value) activeFilters.push({ label: LABELS[key] ?? key, value: 'Sì' })
    else if (typeof value === 'string' && value) activeFilters.push({ label: LABELS[key] ?? key, value })
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''

  if (!isClient) return null

  return (
    <main className="container mx-auto p-4 sm:p-8 print-area print-landscape">
      <div className="flex items-center justify-between mb-4 print-hide gap-2 flex-wrap">
        <Link href="/officer">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Officer
          </Button>
        </Link>
        <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={loading || officer.length === 0}>
          <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
        </Button>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Elenco Officer · Risultati Filtrati
      </h1>
      <p className="text-sm text-muted-foreground mb-3 print:text-black">
        Distretto Lions 108 LA · {officer.length} incarichi trovati
      </p>

      {activeFilters.length > 0 && (
        <div className="mb-5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs print:border-black print:bg-transparent">
          <p className="font-semibold text-primary uppercase tracking-wide mb-1 print:text-black">Filtri applicati</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {activeFilters.map((f, i) => (
              <span key={i} className="text-foreground print:text-black">
                <strong>{f.label}:</strong> {f.value}
              </span>
            ))}
          </div>
        </div>
      )}

      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
        <CardHeader className="pb-3 print-hide">
          <CardTitle className="text-base font-semibold">Risultati ({officer.length})</CardTitle>
        </CardHeader>
        <CardContent className="print:p-0">
          {error ? (
            <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
          ) : loading ? (
            <div className="flex justify-center items-center h-32 text-sm text-muted-foreground">Caricamento…</div>
          ) : officer.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
              <ShieldCheck className="w-8 h-8 opacity-30" />
              <span className="text-sm">Nessun incarico trovato con i filtri applicati</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cognome</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Incarico</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Circ.</TableHead>
                    <TableHead>Inizio</TableHead>
                    <TableHead>Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {officer.map((o: any) => (
                    <TableRow key={o.id_incarico}>
                      <TableCell>{o.nome}</TableCell>
                      <TableCell className="font-medium">{o.cognome}</TableCell>
                      <TableCell>{o.nome_club}</TableCell>
                      <TableCell>{o.titolo_ufficiale}</TableCell>
                      <TableCell>{o.club_zona}</TableCell>
                      <TableCell>{o.club_circoscrizione}</TableCell>
                      <TableCell>{formatDate(o.data_inizio)}</TableCell>
                      <TableCell>{o.data_conclusione ? formatDate(o.data_conclusione) : 'In corso'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export default function StampaOfficerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Caricamento…</div>}>
      <StampaOfficerInner />
    </Suspense>
  )
}
