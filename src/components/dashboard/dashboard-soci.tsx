'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { itemVariants } from '@/lib/animations'
import { Users, Building2 } from 'lucide-react'

// Bucket specifici per questa sezione (richiesta Direttivo, diversi da
// quelli del filtro globale soci).
const FASCE_ETA = [
  { label: 'Under 50', test: (e: number) => e < 50 },
  { label: '50-60',    test: (e: number) => e >= 50 && e <= 60 },
  { label: '60-70',    test: (e: number) => e > 60 && e <= 70 },
  { label: 'Over 70',  test: (e: number) => e > 70 },
]

const FASCE_ANZ = [
  { label: 'Under 2', test: (a: number) => a < 2 },
  { label: '2-5',     test: (a: number) => a >= 2 && a <= 5 },
  { label: '5-10',    test: (a: number) => a > 5 && a <= 10 },
  { label: '10-15',   test: (a: number) => a > 10 && a <= 15 },
  { label: '15-20',   test: (a: number) => a > 15 && a <= 20 },
  { label: 'Over 20', test: (a: number) => a > 20 },
]

type Socio = { eta: number | null; anzianita_lionistica: number | null }

export function DashboardSoci() {
  const [clubs, setClubs] = useState<string[]>([])
  const [club, setClub] = useState<string>('')
  const [soci, setSoci] = useState<Socio[]>([])
  const [loading, setLoading] = useState(false)

  // Carica lista club ordinata
  useEffect(() => {
    supabase.from('club').select('nome_club').not('nome_club', 'is', null).range(0, 999)
      .then(({ data }) => {
        const u = [...new Set((data ?? []).map((c: any) => c.nome_club).filter(Boolean) as string[])].sort()
        setClubs(u)
        if (u.length > 0) setClub(u[0])
      })
  }, [])

  // Carica soci del club selezionato
  useEffect(() => {
    if (!club) { setSoci([]); return }
    setLoading(true)
    supabase.from('vista_soci_ricerca')
      .select('eta, anzianita_lionistica')
      .eq('nome_club', club)
      .range(0, 9999)
      .then(({ data }) => {
        setSoci((data ?? []) as Socio[])
        setLoading(false)
      })
  }, [club])

  const distEta = useMemo(() => {
    return FASCE_ETA.map(f => ({
      label: f.label,
      count: soci.filter(s => s.eta != null && f.test(Number(s.eta))).length,
    }))
  }, [soci])
  const totEta = distEta.reduce((s, f) => s + f.count, 0)

  const distAnz = useMemo(() => {
    return FASCE_ANZ.map(f => ({
      label: f.label,
      count: soci.filter(s => s.anzianita_lionistica != null && f.test(Number(s.anzianita_lionistica))).length,
    }))
  }, [soci])
  const totAnz = distAnz.reduce((s, f) => s + f.count, 0)

  const totSoci = soci.length

  return (
    <motion.div variants={itemVariants} className="mb-6">
      <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4 text-emerald-500" /> Dashboard Soci · composizione del Club
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Seleziona un Club per vederne la composizione anagrafica per età e anzianità lionistica.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Selettore Club */}
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-col sm:flex-row sm:flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Club:</label>
            </div>
            <select
              value={club}
              onChange={(e) => setClub(e.target.value)}
              className="h-9 px-3 text-sm rounded-md border border-input bg-background/50 outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto sm:min-w-[240px] sm:max-w-[420px] truncate"
            >
              {clubs.length === 0 && <option value="">Caricamento...</option>}
              {clubs.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {club && !loading && (
              <span className="text-xs text-muted-foreground">
                {totSoci} soci totali nel club
              </span>
            )}
            {loading && <span className="text-xs text-muted-foreground italic">Caricamento dati…</span>}
          </div>

          {/* Tabella 1: Fasce d'età */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="inline-block w-1 h-4 bg-emerald-500 rounded-full" />
              Composizione per Fasce d'Età
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left px-3 py-2 font-semibold text-xs uppercase text-muted-foreground border-r border-border/50">Fascia</th>
                    {distEta.map(f => (
                      <th key={f.label} className="px-3 py-2 font-semibold text-xs uppercase text-muted-foreground text-center border-r border-border/50 last:border-r-0">
                        {f.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-semibold text-xs uppercase text-emerald-700 dark:text-emerald-400 text-center bg-emerald-500/5">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/50">
                    <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">Quantità</td>
                    {distEta.map(f => (
                      <td key={f.label} className="px-3 py-2 text-center tabular-nums font-semibold border-r border-border/50 last:border-r-0">
                        {f.count}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center tabular-nums font-bold bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">{totEta}</td>
                  </tr>
                  <tr className="border-t border-border/50 bg-muted/20">
                    <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">%</td>
                    {distEta.map(f => (
                      <td key={f.label} className="px-3 py-2 text-center tabular-nums text-xs text-muted-foreground border-r border-border/50 last:border-r-0">
                        {totEta > 0 ? `${((f.count / totEta) * 100).toFixed(1)}%` : '—'}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center tabular-nums text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {totEta < totSoci && (
              <p className="text-[10px] text-muted-foreground italic mt-1">
                Nota: {totSoci - totEta} {totSoci - totEta === 1 ? 'socio non ha' : 'soci non hanno'} la data di nascita registrata
              </p>
            )}
          </div>

          {/* Tabella 2: Anzianità lionistica */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="inline-block w-1 h-4 bg-blue-500 rounded-full" />
              Composizione per Anzianità Lionistica (anni)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left px-3 py-2 font-semibold text-xs uppercase text-muted-foreground border-r border-border/50">Fascia</th>
                    {distAnz.map(f => (
                      <th key={f.label} className="px-3 py-2 font-semibold text-xs uppercase text-muted-foreground text-center border-r border-border/50 last:border-r-0">
                        {f.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-semibold text-xs uppercase text-blue-700 dark:text-blue-400 text-center bg-blue-500/5">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/50">
                    <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">Quantità</td>
                    {distAnz.map(f => (
                      <td key={f.label} className="px-3 py-2 text-center tabular-nums font-semibold border-r border-border/50 last:border-r-0">
                        {f.count}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center tabular-nums font-bold bg-blue-500/5 text-blue-700 dark:text-blue-400">{totAnz}</td>
                  </tr>
                  <tr className="border-t border-border/50 bg-muted/20">
                    <td className="px-3 py-2 font-medium text-xs text-muted-foreground border-r border-border/50">%</td>
                    {distAnz.map(f => (
                      <td key={f.label} className="px-3 py-2 text-center tabular-nums text-xs text-muted-foreground border-r border-border/50 last:border-r-0">
                        {totAnz > 0 ? `${((f.count / totAnz) * 100).toFixed(1)}%` : '—'}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center tabular-nums text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {totAnz < totSoci && (
              <p className="text-[10px] text-muted-foreground italic mt-1">
                Nota: {totSoci - totAnz} {totSoci - totAnz === 1 ? 'socio non ha' : 'soci non hanno'} la data di ingresso registrata
              </p>
            )}
          </div>

        </CardContent>
      </Card>
    </motion.div>
  )
}
