'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, Activity, FileSpreadsheet } from 'lucide-react'
import { exportToExcel, todayStamp } from '@/lib/excel-export'
import { getAnniSociali, getCurrentAnnoSocialeStart, getAnnoSocialeRange } from '@/lib/anno-sociale'

// Prospetto "Sintesi Attività per Club" (spostato dalla Dashboard).
// Sintesi delle attività della selezione, divise tra Amministrazione e Service,
// con colonne Attività / Persone servite / Volontari / Ore (N° e %).
// Filtri come nel rapporto Amministrazione vs Service — Dettagliato.

const AMMINISTRAZIONE = 'Amministrazione'

type Att = {
  causa: string | null
  persone_servite_limite: number | null
  totale_volontari: number | null
  totale_ore_servizio_capped: number | null
}

const fmtNum = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 0 })
const fmtPct = (n: number, tot: number) => tot > 0 ? `${((n / tot) * 100).toFixed(1)}%` : '—'

function aggregate(rows: Att[]) {
  return rows.reduce((acc, r) => ({
    n: acc.n + 1,
    persone: acc.persone + (Number(r.persone_servite_limite) || 0),
    volontari: acc.volontari + (Number(r.totale_volontari) || 0),
    ore: acc.ore + (Number(r.totale_ore_servizio_capped) || 0),
  }), { n: 0, persone: 0, volontari: 0, ore: 0 })
}

export default function QuadroSintesiClubPage() {
  const [clubs, setClubs] = useState<string[]>([])
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])
  const [filtroClub, setFiltroClub] = useState<string[]>([])
  const [filtroZona, setFiltroZona] = useState<string[]>([])
  const [filtroCirc, setFiltroCirc] = useState<string[]>([])
  const [filtroDistretto, setFiltroDistretto] = useState<string[]>([])
  const anniOpzioni = useMemo(() => getAnniSociali(), [])
  const [anniSociali, setAnniSociali] = useState<number[]>([getCurrentAnnoSocialeStart()])
  const [rows, setRows] = useState<Att[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const hasSelection = filtroClub.length > 0 || filtroZona.length > 0 || filtroCirc.length > 0 || filtroDistretto.length > 0

  useEffect(() => {
    setIsClient(true)
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (!isClient) return
    if (!hasSelection) { setRows([]); return }
    loadActivities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, filtroClub, filtroZona, filtroCirc, filtroDistretto, anniSociali])

  async function loadFilterOptions() {
    const { data } = await supabase.from('club').select('nome_club, zona, circoscrizione').range(0, 9999)
    if (data) {
      setClubs([...new Set(data.map((c: any) => c.nome_club))].filter(Boolean).sort() as string[])
      setZone([...new Set(data.map((c: any) => c.zona))].filter(Boolean).sort() as string[])
      setCircoscrizioni([...new Set(data.map((c: any) => c.circoscrizione))].filter(Boolean).sort() as string[])
    }
  }

  async function loadActivities() {
    setLoading(true)
    setError(null)
    let q = supabase
      .from('vista_report_ricerca')
      .select('causa, persone_servite_limite, totale_volontari, totale_ore_servizio_capped, sponsor_nome_account, sponsor_zona, sponsor_circoscrizione')
    // Anno sociale multi-selezione: unione (OR) degli intervalli 1 lug → 30 giu
    if (anniSociali.length) {
      const orExpr = anniSociali.map((y) => { const { from, to } = getAnnoSocialeRange(y); return `and(data_inizio.gte.${from},data_inizio.lte.${to})` }).join(',')
      q = q.or(orExpr)
    }
    // Distretto selezionato = tutte le attività del Distretto (nessun filtro territoriale)
    if (filtroDistretto.length === 0) {
      if (filtroClub.length) q = q.in('sponsor_nome_account', filtroClub)
      if (filtroZona.length) q = q.in('sponsor_zona', filtroZona)
      if (filtroCirc.length) q = q.in('sponsor_circoscrizione', filtroCirc)
    }
    const { data, error } = await q.range(0, 49999)
    if (error) setError('Errore nel caricamento. Riprova.')
    else setRows((data ?? []) as Att[])
    setLoading(false)
  }

  const totals = useMemo(() => {
    const tot = aggregate(rows)
    const amm = aggregate(rows.filter(r => r.causa === AMMINISTRAZIONE))
    const ser = aggregate(rows.filter(r => r.causa !== AMMINISTRAZIONE))
    return { tot, amm, ser }
  }, [rows])

  const annoLabel = anniSociali.length
    ? [...anniSociali].sort((a, b) => a - b).map((y) => getAnnoSocialeRange(y).label).join(', ')
    : 'tutti gli anni'

  const ambitoLabel = filtroDistretto.length > 0
    ? 'Tutto il Distretto 108 LA'
    : filtroClub.length > 0
      ? (filtroClub.length === 1 ? filtroClub[0] : `${filtroClub.length} club selezionati`)
      : filtroZona.length > 0
        ? `Zone: ${filtroZona.join(', ')}`
        : filtroCirc.length > 0
          ? `Circoscrizioni: ${filtroCirc.join(', ')}`
          : ''

  function esportaExcel() {
    const riga = (categoria: string, a: ReturnType<typeof aggregate>) => ({
      categoria,
      attN: a.n, attPct: fmtPct(a.n, totals.tot.n),
      persN: a.persone, persPct: fmtPct(a.persone, totals.tot.persone),
      volN: a.volontari, volPct: fmtPct(a.volontari, totals.tot.volontari),
      oreN: a.ore, orePct: fmtPct(a.ore, totals.tot.ore),
    })
    const data = [
      riga('Totale Attività', totals.tot),
      riga('Amministrazione', totals.amm),
      riga('Service', totals.ser),
    ]
    exportToExcel(
      data,
      [
        { header: 'Categoria', accessor: (r: any) => r.categoria },
        { header: 'Attività N°', accessor: (r: any) => r.attN },
        { header: 'Attività %', accessor: (r: any) => r.attPct },
        { header: 'Persone servite N°', accessor: (r: any) => r.persN },
        { header: 'Persone servite %', accessor: (r: any) => r.persPct },
        { header: 'Volontari N°', accessor: (r: any) => r.volN },
        { header: 'Volontari %', accessor: (r: any) => r.volPct },
        { header: 'Ore N°', accessor: (r: any) => r.oreN },
        { header: 'Ore %', accessor: (r: any) => r.orePct },
      ],
      `sintesi_attivita_club_${todayStamp()}`,
      'Sintesi Amm vs Service'
    )
  }

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area">
      <motion.div variants={itemVariants} className="flex items-center mb-4 print-hide gap-2 flex-wrap">
        <Link href="/attivita/rapporti">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Rapporti Attività
          </Button>
        </Link>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Sintesi Attività per Club — Amministrazione vs Service
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-4 print:text-black">
        {hasSelection
          ? <><strong className="text-foreground print:text-black">{ambitoLabel}</strong> · Anno sociale <strong className="text-foreground print:text-black">{annoLabel}</strong> · {totals.tot.n} attività</>
          : 'Seleziona un Club (o zona, circoscrizione, o l’intero Distretto) per vederne le attività dell’anno sociale, divise in Amministrazione e Service.'}
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2 flex-wrap print-hide">
        <Button variant="outline" onClick={esportaExcel} size="sm" className="text-xs gap-1.5" disabled={!hasSelection || totals.tot.n === 0}>
          <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
        </Button>
        <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={!hasSelection || totals.tot.n === 0}>
          <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            {/* Filtri territoriali — ordine fisso Club, Zona, Circoscrizione, Distretto (+ Anno sociale) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Club (selezione multipla)</p>
                <MultiSelect options={clubs} selected={filtroClub} onChange={setFiltroClub} placeholder="Seleziona club…" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Zone (in alternativa)</p>
                <MultiSelect options={zone} selected={filtroZona} onChange={setFiltroZona} placeholder="Tutte le zone" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Circoscrizioni</p>
                <MultiSelect options={circoscrizioni} selected={filtroCirc} onChange={setFiltroCirc} placeholder="Tutte le circoscrizioni" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure tutto il Distretto</p>
                <MultiSelect options={['108 LA']} selected={filtroDistretto} onChange={setFiltroDistretto} placeholder="108 LA" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Anno sociale (uno o più)</p>
                <MultiSelect
                  options={anniOpzioni.map((a) => a.label)}
                  selected={[...anniSociali].sort((a, b) => b - a).map((y) => getAnnoSocialeRange(y).label)}
                  onChange={(labels) => setAnniSociali(labels.map((l) => anniOpzioni.find((a) => a.label === l)!.value))}
                  placeholder="Anno sociale"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Puoi selezionare uno o più Club, oppure scegliere una o più Zone/Circoscrizioni per includere tutti i loro club, oppure l’intero Distretto.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
          <CardHeader className="pb-3 print-hide">
            <CardTitle className="text-base font-semibold">Sintesi Amministrazione vs Service</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0 space-y-4">
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : !hasSelection ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Seleziona uno o più club, oppure zone, circoscrizioni o l&apos;intero Distretto</span>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : totals.tot.n === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessuna attività trovata per la selezione · anno {annoLabel}</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40">
                      <th rowSpan={2} className="text-left px-3 py-2 font-semibold text-xs uppercase text-muted-foreground border-r border-border/50 align-middle">Categoria</th>
                      <th colSpan={2} className="text-center px-3 py-2 font-semibold text-xs uppercase text-muted-foreground border-r border-border/50">Attività</th>
                      <th colSpan={2} className="text-center px-3 py-2 font-semibold text-xs uppercase text-muted-foreground border-r border-border/50">Persone Servite</th>
                      <th colSpan={2} className="text-center px-3 py-2 font-semibold text-xs uppercase text-muted-foreground border-r border-border/50">Totale Volontari</th>
                      <th colSpan={2} className="text-center px-3 py-2 font-semibold text-xs uppercase text-muted-foreground">Ore Volontari</th>
                    </tr>
                    <tr className="bg-muted/20 text-[10px] uppercase text-muted-foreground">
                      <th className="px-3 py-1 text-center font-semibold">N°</th>
                      <th className="px-3 py-1 text-center font-semibold border-r border-border/50">%</th>
                      <th className="px-3 py-1 text-center font-semibold">N°</th>
                      <th className="px-3 py-1 text-center font-semibold border-r border-border/50">%</th>
                      <th className="px-3 py-1 text-center font-semibold">N°</th>
                      <th className="px-3 py-1 text-center font-semibold border-r border-border/50">%</th>
                      <th className="px-3 py-1 text-center font-semibold">N°</th>
                      <th className="px-3 py-1 text-center font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Totale Attività */}
                    <tr className="border-t-2 border-border/70 bg-primary/5">
                      <td className="px-3 py-2 font-bold text-foreground border-r border-border/50">Totale Attività</td>
                      <td className="px-3 py-2 text-center tabular-nums font-bold">{fmtNum(totals.tot.n)}</td>
                      <td className="px-3 py-2 text-center tabular-nums font-bold border-r border-border/50">100%</td>
                      <td className="px-3 py-2 text-center tabular-nums font-bold">{fmtNum(totals.tot.persone)}</td>
                      <td className="px-3 py-2 text-center tabular-nums font-bold border-r border-border/50">100%</td>
                      <td className="px-3 py-2 text-center tabular-nums font-bold">{fmtNum(totals.tot.volontari)}</td>
                      <td className="px-3 py-2 text-center tabular-nums font-bold border-r border-border/50">100%</td>
                      <td className="px-3 py-2 text-center tabular-nums font-bold">{fmtNum(totals.tot.ore)}</td>
                      <td className="px-3 py-2 text-center tabular-nums font-bold">100%</td>
                    </tr>
                    {/* Amministrazione */}
                    <tr className="border-t border-border/50">
                      <td className="px-3 py-2 font-medium border-r border-border/50">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                          Amministrazione
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmtNum(totals.amm.n)}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground border-r border-border/50">{fmtPct(totals.amm.n, totals.tot.n)}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmtNum(totals.amm.persone)}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground border-r border-border/50">{fmtPct(totals.amm.persone, totals.tot.persone)}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmtNum(totals.amm.volontari)}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground border-r border-border/50">{fmtPct(totals.amm.volontari, totals.tot.volontari)}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmtNum(totals.amm.ore)}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">{fmtPct(totals.amm.ore, totals.tot.ore)}</td>
                    </tr>
                    {/* Service */}
                    <tr className="border-t border-border/50 bg-muted/10">
                      <td className="px-3 py-2 font-medium border-r border-border/50">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                          Service
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmtNum(totals.ser.n)}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground border-r border-border/50">{fmtPct(totals.ser.n, totals.tot.n)}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmtNum(totals.ser.persone)}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground border-r border-border/50">{fmtPct(totals.ser.persone, totals.tot.persone)}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmtNum(totals.ser.volontari)}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground border-r border-border/50">{fmtPct(totals.ser.volontari, totals.tot.volontari)}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{fmtNum(totals.ser.ore)}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">{fmtPct(totals.ser.ore, totals.tot.ore)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground italic">
              <strong>Amministrazione</strong>: attività con causa = &quot;Amministrazione&quot; (riunioni, direttivi, gabinetti).
              &nbsp;&nbsp;<strong>Service</strong>: tutte le altre cause (servizio reale alla comunità).
              Le percentuali sono calcolate per ogni colonna rispetto al totale della selezione. Valori capped/limite come nei report ufficiali LCI.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
