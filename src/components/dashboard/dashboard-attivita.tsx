'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { itemVariants } from '@/lib/animations'
import { Activity, Building2, Calendar } from 'lucide-react'
import { getCurrentAnnoSocialeStart, getAnnoSocialeRange, getRecentAnniSociali } from '@/lib/anno-sociale'

const AMMINISTRAZIONE = 'Amministrazione'

type Att = {
  causa: string | null
  persone_servite: number | null
  totale_volontari: number | null
  totale_ore_servizio: number | null
}

const fmtNum = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 0 })
const fmtPct = (n: number, tot: number) => tot > 0 ? `${((n / tot) * 100).toFixed(1)}%` : '—'

function aggregate(rows: Att[]) {
  return rows.reduce((acc, r) => ({
    n: acc.n + 1,
    persone: acc.persone + (Number(r.persone_servite) || 0),
    volontari: acc.volontari + (Number(r.totale_volontari) || 0),
    ore: acc.ore + (Number(r.totale_ore_servizio) || 0),
  }), { n: 0, persone: 0, volontari: 0, ore: 0 })
}

export function DashboardAttivita() {
  const [clubs, setClubs] = useState<string[]>([])
  const [club, setClub] = useState<string>('')
  const [annoSociale, setAnnoSociale] = useState<number>(getCurrentAnnoSocialeStart())
  const [rows, setRows] = useState<Att[]>([])
  const [loading, setLoading] = useState(false)

  // Carica lista club che hanno attività
  useEffect(() => {
    supabase.from('vista_report_ricerca')
      .select('sponsor_nome_account')
      .not('sponsor_nome_account', 'is', null)
      .range(0, 9999)
      .then(({ data }) => {
        const u = [...new Set((data ?? []).map((c: any) => c.sponsor_nome_account).filter(Boolean) as string[])].sort()
        setClubs(u)
        if (u.length > 0) setClub(u[0])
      })
  }, [])

  // Carica attività del club nell'anno sociale selezionato
  useEffect(() => {
    if (!club) { setRows([]); return }
    const { from, to } = getAnnoSocialeRange(annoSociale)
    setLoading(true)
    supabase.from('vista_report_ricerca')
      .select('causa, persone_servite, totale_volontari, totale_ore_servizio')
      .eq('sponsor_nome_account', club)
      .gte('data_inizio', from)
      .lte('data_inizio', to)
      .range(0, 9999)
      .then(({ data }) => {
        setRows((data ?? []) as Att[])
        setLoading(false)
      })
  }, [club, annoSociale])

  const totals = useMemo(() => {
    const tot = aggregate(rows)
    const amm = aggregate(rows.filter(r => r.causa === AMMINISTRAZIONE))
    const ser = aggregate(rows.filter(r => r.causa !== AMMINISTRAZIONE))
    return { tot, amm, ser }
  }, [rows])

  const annoLabel = getAnnoSocialeRange(annoSociale).label

  return (
    <motion.div variants={itemVariants} className="mb-6">
      <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-4 w-4 text-orange-500" /> Dashboard Attività · sintesi per Club
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Seleziona un Club per vederne le attività dell&apos;anno sociale, divise in Amministrazione e Service.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Selettori */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Club:</label>
            </div>
            <select
              value={club}
              onChange={(e) => setClub(e.target.value)}
              className="h-9 px-3 text-sm rounded-md border border-input bg-background/50 outline-none focus:ring-1 focus:ring-ring min-w-[240px]"
            >
              {clubs.length === 0 && <option value="">Caricamento...</option>}
              {clubs.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex items-center gap-2 ml-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Anno sociale:</label>
            </div>
            <select
              value={annoSociale}
              onChange={(e) => setAnnoSociale(parseInt(e.target.value))}
              className="h-9 px-3 text-sm rounded-md border border-input bg-background/50 outline-none focus:ring-1 focus:ring-ring"
            >
              {getRecentAnniSociali(8).map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>

            {!loading && club && (
              <span className="text-xs text-muted-foreground">
                {totals.tot.n} attività · anno {annoLabel}
              </span>
            )}
            {loading && <span className="text-xs text-muted-foreground italic">Caricamento dati…</span>}
          </div>

          {/* Tabella */}
          {totals.tot.n === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nessuna attività per {club} nell&apos;anno sociale {annoLabel}
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
            Le percentuali sono calcolate per ogni colonna rispetto al totale del Club.
          </p>

        </CardContent>
      </Card>
    </motion.div>
  )
}
