'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Users, FileSpreadsheet } from 'lucide-react'
import { getArray, getString } from '@/lib/filters-url'
import { exportToExcel, todayStamp } from '@/lib/excel-export'

const LABELS: Record<string, string> = {
  search: 'Cerca',
  sesso: 'Genere',
  fasciaEta: "Fascia d'età",
  fasciaAnzianita: 'Fascia anzianità',
  zona: 'Zona',
  circoscrizione: 'Circoscrizione',
  categoriaAssociativa: 'Categoria',
  programma: 'Programma',
  club: 'Club',
  professione: 'Professione',
  citta: 'Città',
  provincia: 'Provincia',
  etaMin: 'Età min',
  etaMax: 'Età max',
  anzianitaMin: 'Anzianità min',
  anzianitaMax: 'Anzianità max',
}

function StampaSociInner() {
  const sp = useSearchParams()!
  const [soci, setSoci] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => { setIsClient(true) }, [])

  // Costruzione filtri dall'URL
  const filters = {
    search: getString(sp, 'search'),
    sesso: getArray(sp, 'sesso'),
    fasciaEta: getArray(sp, 'fasciaEta'),
    fasciaAnzianita: getArray(sp, 'fasciaAnzianita'),
    zona: getArray(sp, 'zona'),
    circoscrizione: getArray(sp, 'circoscrizione'),
    categoriaAssociativa: getArray(sp, 'categoriaAssociativa'),
    programma: getArray(sp, 'programma'),
    club: getArray(sp, 'club'),
    professione: getString(sp, 'professione'),
    citta: getString(sp, 'citta'),
    provincia: getString(sp, 'provincia'),
    etaMin: getString(sp, 'etaMin'),
    etaMax: getString(sp, 'etaMax'),
    anzianitaMin: getString(sp, 'anzianitaMin'),
    anzianitaMax: getString(sp, 'anzianitaMax'),
    sortField: getString(sp, 'sortField') || 'cognome',
    sortDir: getString(sp, 'sortDir') || 'asc',
  }

  useEffect(() => {
    if (!isClient) return
    setLoading(true)
    let q = supabase.from('vista_soci_ricerca').select('*')

    if (filters.search) q = q.or(`nome.ilike.%${filters.search}%,cognome.ilike.%${filters.search}%,matricola_socio.ilike.%${filters.search}%`)
    if (filters.sesso.length) q = q.in('sesso', filters.sesso)
    if (filters.fasciaEta.length) q = q.in('fascia_eta', filters.fasciaEta)
    if (filters.fasciaAnzianita.length) q = q.in('fascia_anzianita', filters.fasciaAnzianita)
    if (filters.zona.length) q = q.in('club_zona', filters.zona)
    if (filters.circoscrizione.length) q = q.in('club_circoscrizione', filters.circoscrizione)
    if (filters.categoriaAssociativa.length) q = q.in('categoria_associativa', filters.categoriaAssociativa)
    if (filters.programma.length) q = q.in('programma', filters.programma)
    if (filters.club.length) q = q.in('nome_club', filters.club)
    if (filters.professione) q = q.ilike('professione', `%${filters.professione}%`)
    if (filters.citta) q = q.ilike('citta', `%${filters.citta}%`)
    if (filters.provincia) q = q.ilike('stato_provincia', `%${filters.provincia}%`)
    if (filters.etaMin) q = q.gte('eta', parseInt(filters.etaMin))
    if (filters.etaMax) q = q.lte('eta', parseInt(filters.etaMax))
    if (filters.anzianitaMin) q = q.gte('anzianita_lionistica', parseInt(filters.anzianitaMin))
    if (filters.anzianitaMax) q = q.lte('anzianita_lionistica', parseInt(filters.anzianitaMax))

    q.order(filters.sortField, { ascending: filters.sortDir === 'asc', nullsFirst: false }).range(0, 9999).then(({ data, error }) => {
      if (error) setError('Errore nel caricamento. Riprova.')
      else setSoci(data || [])
      setLoading(false)
    })
  }, [isClient, sp])

  // Filtri attivi (label + valore) per intestazione
  const activeFilters: { label: string; value: string }[] = []
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'sortField' || key === 'sortDir') continue
    if (Array.isArray(value) && value.length > 0) activeFilters.push({ label: LABELS[key] ?? key, value: value.join(', ') })
    else if (typeof value === 'string' && value) activeFilters.push({ label: LABELS[key] ?? key, value })
  }

  if (!isClient) return null

  return (
    <main className="container mx-auto p-4 sm:p-8 print-area print-landscape">
      <div className="flex items-center justify-between mb-4 print-hide gap-2 flex-wrap">
        <Link href="/soci">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Soci
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportToExcel(
              soci,
              [
                { header: 'Matricola', accessor: (s: any) => s.matricola_socio },
                { header: 'Nome', accessor: (s: any) => s.nome },
                { header: 'Cognome', accessor: (s: any) => s.cognome },
                { header: 'Club', accessor: (s: any) => s.nome_club },
                { header: 'Zona', accessor: (s: any) => s.club_zona },
                { header: 'Circoscrizione', accessor: (s: any) => s.club_circoscrizione },
                { header: 'Genere', accessor: (s: any) => s.sesso },
                { header: "Fascia d'età", accessor: (s: any) => s.fascia_eta },
                { header: 'Anzianità (anni)', accessor: (s: any) => s.anzianita_lionistica },
                { header: 'Fascia anzianità', accessor: (s: any) => s.fascia_anzianita },
                { header: 'Categoria', accessor: (s: any) => s.categoria_associativa },
                { header: 'Tipo associazione', accessor: (s: any) => s.tipo_associazione_intera },
                { header: 'Programma', accessor: (s: any) => s.programma },
                { header: 'Professione', accessor: (s: any) => s.professione },
                { header: 'Città', accessor: (s: any) => s.citta },
                { header: 'Provincia', accessor: (s: any) => s.stato_provincia },
                { header: 'Cellulare', accessor: (s: any) => s.telefono_cellulare },
                { header: 'Email', accessor: (s: any) => s.email_preferita },
              ],
              `soci_${todayStamp()}`,
              'Soci'
            )}
            size="sm"
            className="text-xs gap-1.5"
            disabled={loading || soci.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={loading || soci.length === 0}>
            <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
          </Button>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Elenco Soci · Risultati Filtrati
      </h1>
      <p className="text-sm text-muted-foreground mb-3 print:text-black">
        Distretto Lions 108 LA · {soci.length} soci trovati
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
          <CardTitle className="text-base font-semibold">Risultati ({soci.length})</CardTitle>
        </CardHeader>
        <CardContent className="print:p-0">
          {error ? (
            <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
          ) : loading ? (
            <div className="flex justify-center items-center h-32 text-sm text-muted-foreground">Caricamento…</div>
          ) : soci.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
              <Users className="w-8 h-8 opacity-30" />
              <span className="text-sm">Nessun socio trovato con i filtri applicati</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricola</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cognome</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Circ.</TableHead>
                    <TableHead>Gen.</TableHead>
                    <TableHead>Fascia</TableHead>
                    <TableHead>Anz.</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Programma</TableHead>
                    <TableHead>Città</TableHead>
                    <TableHead>Prov.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soci.map((s: any) => (
                    <TableRow key={s.matricola_socio}>
                      <TableCell className="font-mono">{s.matricola_socio}</TableCell>
                      <TableCell>{s.nome}</TableCell>
                      <TableCell className="font-medium">{s.cognome}</TableCell>
                      <TableCell>{s.nome_club}</TableCell>
                      <TableCell>{s.club_zona}</TableCell>
                      <TableCell>{s.club_circoscrizione}</TableCell>
                      <TableCell>{s.sesso}</TableCell>
                      <TableCell>{s.fascia_eta}</TableCell>
                      <TableCell className="tabular-nums">{s.anzianita_lionistica}</TableCell>
                      <TableCell>{s.categoria_associativa}</TableCell>
                      <TableCell>{s.programma}</TableCell>
                      <TableCell>{s.citta}</TableCell>
                      <TableCell>{s.stato_provincia}</TableCell>
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

export default function StampaSociPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Caricamento…</div>}>
      <StampaSociInner />
    </Suspense>
  )
}
