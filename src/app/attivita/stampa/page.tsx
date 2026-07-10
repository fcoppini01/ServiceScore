'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Activity, FileSpreadsheet } from 'lucide-react'
import { getArray, getString } from '@/lib/filters-url'
import { exportToExcel, todayStamp, fmtDateIT } from '@/lib/excel-export'
import { getAnnoSocialeRange } from '@/lib/anno-sociale'

const LABELS: Record<string, string> = {
  search: 'Cerca',
  stato: 'Stato',
  zona: 'Zona',
  causa: 'Causa',
  tipoProgetto: 'Tipo progetto',
  livelloAttivita: 'Livello',
  circoscrizione: 'Circoscrizione',
  club: 'Club',
  organizzazioneBeneficiata: 'Organizzazione',
  rapportoCompleto: 'Rapporto completo',
  attivitaDistintiva: 'Attività distintiva',
  finanziateLcif: 'Finanziata LCIF',
  anniSociali: 'Anno sociale',
  minPersone: 'Min persone', maxPersone: 'Max persone',
  minPersoneLimite: 'Min persone limite', maxPersoneLimite: 'Max persone limite',
  minVolontari: 'Min volontari', maxVolontari: 'Max volontari',
  minOre: 'Min ore', maxOre: 'Max ore',
  minOreCapped: 'Min ore capped', maxOreCapped: 'Max ore capped',
  minFondiDonati: 'Min € donati', maxFondiDonati: 'Max € donati',
  minFondiDonatiCapped: 'Min donati (dollari)', maxFondiDonatiCapped: 'Max donati (dollari)',
  minDonazioneLcif: 'Min LCIF', maxDonazioneLcif: 'Max LCIF',
  minFondiRaccolti: 'Min € raccolti', maxFondiRaccolti: 'Max € raccolti',
  minFondiRaccoltiCapped: 'Min raccolti (dollari)', maxFondiRaccoltiCapped: 'Max raccolti (dollari)',
  minAlberi: 'Min alberi', maxAlberi: 'Max alberi',
}

const fmtNum = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 0 })
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''

function StampaAttivitaInner() {
  const sp = useSearchParams()!
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => { setIsClient(true) }, [])

  const filters = {
    search: getString(sp, 'search'),
    stato: getArray(sp, 'stato'),
    zona: getArray(sp, 'zona'),
    causa: getArray(sp, 'causa'),
    tipoProgetto: getArray(sp, 'tipoProgetto'),
    livelloAttivita: getArray(sp, 'livelloAttivita'),
    circoscrizione: getArray(sp, 'circoscrizione'),
    club: getArray(sp, 'club'),
    organizzazioneBeneficiata: getString(sp, 'organizzazioneBeneficiata'),
    rapportoCompleto: getString(sp, 'rapportoCompleto'),
    attivitaDistintiva: getString(sp, 'attivitaDistintiva'),
    finanziateLcif: getString(sp, 'finanziateLcif'),
    anniSociali: getArray(sp, 'anniSociali'),
    minPersone: getString(sp, 'minPersone'), maxPersone: getString(sp, 'maxPersone'),
    minPersoneLimite: getString(sp, 'minPersoneLimite'), maxPersoneLimite: getString(sp, 'maxPersoneLimite'),
    minVolontari: getString(sp, 'minVolontari'), maxVolontari: getString(sp, 'maxVolontari'),
    minOre: getString(sp, 'minOre'), maxOre: getString(sp, 'maxOre'),
    minOreCapped: getString(sp, 'minOreCapped'), maxOreCapped: getString(sp, 'maxOreCapped'),
    minFondiDonati: getString(sp, 'minFondiDonati'), maxFondiDonati: getString(sp, 'maxFondiDonati'),
    minFondiDonatiCapped: getString(sp, 'minFondiDonatiCapped'), maxFondiDonatiCapped: getString(sp, 'maxFondiDonatiCapped'),
    minDonazioneLcif: getString(sp, 'minDonazioneLcif'), maxDonazioneLcif: getString(sp, 'maxDonazioneLcif'),
    minFondiRaccolti: getString(sp, 'minFondiRaccolti'), maxFondiRaccolti: getString(sp, 'maxFondiRaccolti'),
    minFondiRaccoltiCapped: getString(sp, 'minFondiRaccoltiCapped'), maxFondiRaccoltiCapped: getString(sp, 'maxFondiRaccoltiCapped'),
    minAlberi: getString(sp, 'minAlberi'), maxAlberi: getString(sp, 'maxAlberi'),
    sortField: getString(sp, 'sortField') || 'data_inizio',
    sortDir: getString(sp, 'sortDir') || 'desc',
  }

  useEffect(() => {
    if (!isClient) return
    setLoading(true)
    let q = supabase.from('vista_report_ricerca').select('*')

    if (filters.search) q = q.or(`titolo.ilike.%${filters.search}%,descrizione.ilike.%${filters.search}%`)
    if (filters.stato.length) q = q.in('stato', filters.stato)
    if (filters.zona.length) q = q.in('sponsor_zona', filters.zona)
    if (filters.causa.length) q = q.in('causa', filters.causa)
    if (filters.tipoProgetto.length) q = q.in('tipo_progetto', filters.tipoProgetto)
    if (filters.livelloAttivita.length) q = q.in('livello_attivita', filters.livelloAttivita)
    if (filters.circoscrizione.length) q = q.in('sponsor_circoscrizione', filters.circoscrizione)
    if (filters.club.length) q = q.in('sponsor_nome_account', filters.club)
    // Organizzazione beneficiata: LCIF (qualsiasi grafia) oppure Altro (qualunque altra org. valorizzata)
    if (filters.organizzazioneBeneficiata === 'LCIF') q = q.ilike('organizzazione_beneficiata', '%lcif%')
    else if (filters.organizzazioneBeneficiata === 'ALTRO') q = q.not('organizzazione_beneficiata', 'is', null).not('organizzazione_beneficiata', 'ilike', '%lcif%')
    if (filters.rapportoCompleto) q = q.eq('rapporto_completo', filters.rapportoCompleto === 'true')
    if (filters.attivitaDistintiva) q = q.eq('attivita_distintiva', filters.attivitaDistintiva === 'true')
    if (filters.finanziateLcif) q = q.eq('finanziata_lcif', filters.finanziateLcif === 'true')
    if (filters.anniSociali.length) {
      const orExpr = filters.anniSociali.map((y: string) => { const r = getAnnoSocialeRange(parseInt(y, 10)); return `and(data_inizio.gte.${r.from},data_inizio.lte.${r.to})` }).join(',')
      q = q.or(orExpr)
    }
    if (filters.minPersone) q = q.gte('persone_servite', parseFloat(filters.minPersone))
    if (filters.maxPersone) q = q.lte('persone_servite', parseFloat(filters.maxPersone))
    if (filters.minPersoneLimite) q = q.gte('persone_servite_limite', parseFloat(filters.minPersoneLimite))
    if (filters.maxPersoneLimite) q = q.lte('persone_servite_limite', parseFloat(filters.maxPersoneLimite))
    if (filters.minVolontari) q = q.gte('totale_volontari', parseFloat(filters.minVolontari))
    if (filters.maxVolontari) q = q.lte('totale_volontari', parseFloat(filters.maxVolontari))
    if (filters.minOre) q = q.gte('totale_ore_servizio', parseFloat(filters.minOre))
    if (filters.maxOre) q = q.lte('totale_ore_servizio', parseFloat(filters.maxOre))
    if (filters.minOreCapped) q = q.gte('totale_ore_servizio_capped', parseFloat(filters.minOreCapped))
    if (filters.maxOreCapped) q = q.lte('totale_ore_servizio_capped', parseFloat(filters.maxOreCapped))
    if (filters.minFondiDonati) q = q.gte('totale_fondi_donati', parseFloat(filters.minFondiDonati))
    if (filters.maxFondiDonati) q = q.lte('totale_fondi_donati', parseFloat(filters.maxFondiDonati))
    if (filters.minFondiDonatiCapped) q = q.gte('fondi_donati_usd_capped', parseFloat(filters.minFondiDonatiCapped))
    if (filters.maxFondiDonatiCapped) q = q.lte('fondi_donati_usd_capped', parseFloat(filters.maxFondiDonatiCapped))
    if (filters.minDonazioneLcif) q = q.gte('donazione_lcif', parseFloat(filters.minDonazioneLcif))
    if (filters.maxDonazioneLcif) q = q.lte('donazione_lcif', parseFloat(filters.maxDonazioneLcif))
    if (filters.minFondiRaccolti) q = q.gte('totale_fondi_raccolti', parseFloat(filters.minFondiRaccolti))
    if (filters.maxFondiRaccolti) q = q.lte('totale_fondi_raccolti', parseFloat(filters.maxFondiRaccolti))
    if (filters.minFondiRaccoltiCapped) q = q.gte('fondi_raccolti_usd_capped', parseFloat(filters.minFondiRaccoltiCapped))
    if (filters.maxFondiRaccoltiCapped) q = q.lte('fondi_raccolti_usd_capped', parseFloat(filters.maxFondiRaccoltiCapped))
    if (filters.minAlberi) q = q.gte('alberi_piantati', parseFloat(filters.minAlberi))
    if (filters.maxAlberi) q = q.lte('alberi_piantati', parseFloat(filters.maxAlberi))

    q.order(filters.sortField, { ascending: filters.sortDir === 'asc', nullsFirst: false }).range(0, 49999).then(({ data, error }) => {
      if (error) setError('Errore nel caricamento. Riprova.')
      else setRows(data || [])
      setLoading(false)
    })
  }, [isClient, sp])

  const activeFilters: { label: string; value: string }[] = []
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'sortField' || key === 'sortDir') continue
    if (Array.isArray(value) && value.length > 0) activeFilters.push({ label: LABELS[key] ?? key, value: value.join(', ') })
    else if (typeof value === 'string' && value) {
      let v = value
      if (key === 'rapportoCompleto' || key === 'attivitaDistintiva' || key === 'finanziateLcif') v = value === 'true' ? 'Sì' : 'No'
      activeFilters.push({ label: LABELS[key] ?? key, value: v })
    }
  }

  const totali = useMemo(() => rows.reduce((acc, r) => ({
    persone: acc.persone + (Number(r.persone_servite) || 0),
    volontari: acc.volontari + (Number(r.totale_volontari) || 0),
    ore: acc.ore + (Number(r.totale_ore_servizio) || 0),
    donati: acc.donati + (Number(r.totale_fondi_donati) || 0),
    raccolti: acc.raccolti + (Number(r.totale_fondi_raccolti) || 0),
  }), { persone: 0, volontari: 0, ore: 0, donati: 0, raccolti: 0 }), [rows])

  if (!isClient) return null

  return (
    <main className="container mx-auto p-4 sm:p-8 print-area print-landscape">
      <div className="flex items-center justify-between mb-4 print-hide gap-2 flex-wrap">
        <Link href="/attivita">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna ad Attività
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportToExcel(
              rows,
              [
                { header: 'ID attività', accessor: (a: any) => a.id_attivita },
                { header: 'Data inizio', accessor: (a: any) => fmtDateIT(a.data_inizio) },
                { header: 'Data fine', accessor: (a: any) => fmtDateIT(a.data_conclusione) },
                { header: 'Stato', accessor: (a: any) => a.stato },
                { header: 'Titolo', accessor: (a: any) => a.titolo },
                { header: 'Club', accessor: (a: any) => a.sponsor_nome_account },
                { header: 'Zona', accessor: (a: any) => a.sponsor_zona },
                { header: 'Causa', accessor: (a: any) => a.causa },
                { header: 'Tipo progetto', accessor: (a: any) => a.tipo_progetto },
                { header: 'Livello attività', accessor: (a: any) => a.livello_attivita },
                { header: 'Persone servite (cap)', accessor: (a: any) => Number(a.persone_servite_limite) || 0 },
                { header: 'Volontari', accessor: (a: any) => Number(a.totale_volontari) || 0 },
                { header: 'Ore (cap)', accessor: (a: any) => Number(a.totale_ore_servizio_capped) || 0 },
                { header: 'Fondi donati (dollari)', accessor: (a: any) => Number(a.fondi_donati_usd_capped) || 0 },
                { header: 'Fondi raccolti (dollari)', accessor: (a: any) => Number(a.fondi_raccolti_usd_capped) || 0 },
                { header: 'Org. beneficiata', accessor: (a: any) => a.organizzazione_beneficiata },
              ],
              `attivita_${todayStamp()}`,
              'Attività'
            )}
            size="sm"
            className="text-xs gap-1.5"
            disabled={loading || rows.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={loading || rows.length === 0}>
            <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
          </Button>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Elenco Attività · Risultati Filtrati
      </h1>
      <p className="text-sm text-muted-foreground mb-3 print:text-black">
        Distretto Lions 108 LA · {rows.length} attività trovate
      </p>

      {activeFilters.length > 0 && (
        <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs print:border-black print:bg-transparent">
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

      {!loading && rows.length > 0 && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs print:border-black print:bg-transparent">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1 print:text-black">Indicazioni totali sui risultati</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span><strong className="tabular-nums">{fmtNum(totali.persone)}</strong> persone servite</span>
            <span><strong className="tabular-nums">{fmtNum(totali.volontari)}</strong> volontari</span>
            <span><strong className="tabular-nums">{fmtNum(totali.ore)}</strong> ore servizio</span>
            <span>€ <strong className="tabular-nums">{fmtNum(totali.donati)}</strong> donati</span>
            <span>€ <strong className="tabular-nums">{fmtNum(totali.raccolti)}</strong> raccolti</span>
          </div>
        </div>
      )}

      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
        <CardHeader className="pb-3 print-hide">
          <CardTitle className="text-base font-semibold">Risultati ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="print:p-0">
          {error ? (
            <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
          ) : loading ? (
            <div className="flex justify-center items-center h-32 text-sm text-muted-foreground">Caricamento…</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
              <Activity className="w-8 h-8 opacity-30" />
              <span className="text-sm">Nessuna attività trovata con i filtri applicati</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs cv-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Causa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Persone</TableHead>
                    <TableHead className="text-right">Volont.</TableHead>
                    <TableHead className="text-right">Ore</TableHead>
                    <TableHead className="text-right">€ Donati</TableHead>
                    <TableHead className="text-right">€ Raccolti</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a: any) => (
                    <TableRow key={a.id_attivita} className="cv-row">
                      <TableCell className="font-medium">{a.titolo}</TableCell>
                      <TableCell>{a.sponsor_nome_account}</TableCell>
                      <TableCell>{a.sponsor_zona}</TableCell>
                      <TableCell>{a.stato}</TableCell>
                      <TableCell>{a.causa}</TableCell>
                      <TableCell>{a.tipo_progetto}</TableCell>
                      <TableCell>{formatDate(a.data_inizio)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(Number(a.persone_servite) || 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(Number(a.totale_volontari) || 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(Number(a.totale_ore_servizio) || 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(Number(a.totale_fondi_donati) || 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(Number(a.totale_fondi_raccolti) || 0)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/40 print:bg-transparent print:border-t-2 print:border-black">
                    <TableCell colSpan={7} className="text-right">TOTALI SUI RISULTATI</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(totali.persone)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(totali.volontari)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(totali.ore)}</TableCell>
                    <TableCell className="text-right tabular-nums">€ {fmtNum(totali.donati)}</TableCell>
                    <TableCell className="text-right tabular-nums">€ {fmtNum(totali.raccolti)}</TableCell>
                  </TableRow>
                </TableBody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export default function StampaAttivitaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Caricamento…</div>}>
      <StampaAttivitaInner />
    </Suspense>
  )
}
