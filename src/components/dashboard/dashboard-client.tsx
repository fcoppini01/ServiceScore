'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { containerVariants, itemVariants } from '@/lib/animations'
import { Building2, Users, Activity, Sparkles, TrendingUp, BarChart3, PieChart as PieIcon, MapPin, Clock } from 'lucide-react'

const PIE_COLORS = ['#0055ff', '#ffe500', '#ff4444', '#6366f1', '#a3a3a3']

const STATO_COLORS: Record<string, string> = {
  'Comunicato': 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  'Pronto per comunicare i dati': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'Pianificato': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  'Bozza': 'bg-muted text-muted-foreground border-border',
}

const MESI_FY = ['Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic', 'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu']
// indici 0..11 corrispondono ai mesi fiscali Lug..Giu
// se mese naturale è M (0=gen..11=dic), fyIndex = (M - 6 + 12) % 12

function naturalToFyIdx(month: number) { return (month - 6 + 12) % 12 }

const CAUSA_COLORS = ['#0055ff', '#ffe500', '#22c55e', '#f97316', '#a855f7', '#06b6d4', '#ec4899', '#facc15', '#14b8a6']

type ClubMetrics = { total: number; newFY: number | null; reorgFY: number | null; droppedFY: number | null; statusQuoFY: number | null }
type MembershipMetrics = { total: number; addedFY: number; addedPFY: number; droppedFY: number | null; netGrowthFY: number | null; netGrowthPctFY: number | null }
type ServiceMetrics = { activitiesFY: number; peopleServedFY: number; volunteerHoursFY: number; clubsReportingFY: number; clubsReportingPctFY: number }

interface DashboardClientProps {
  fyLabel: string
  pfyLabel: string
  ppfyLabel: string
  fyStartYear: number
  clubMetrics: ClubMetrics
  membershipMetrics: MembershipMetrics
  serviceMetrics: ServiceMetrics
  sociIngressi: string[]
  activitiesFY: any[]
  activitiesPFY: any[]
  causaTable: { causa: string; numero: number; fondi: number; dollari: number; incidenza: number }[]
  // Dati storici (all-time, indipendenti dall'anno fiscale)
  genderData: { name: string; value: number }[]
  ageData: { name: string; value: number }[]
  causeDataAllTime: { name: string; value: number }[]
  zoneData: { name: string; value: number }[]
  recentActivities: any[]
}

const fmtNum = (n: number, digits = 0) => n.toLocaleString('it-IT', { maximumFractionDigits: digits })
const fmtPct = (n: number | null) => n == null ? 'n/d' : `${n.toFixed(1)}%`

function MetricCell({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xl font-bold tabular-nums">{value}</span>
      {hint && <span className="text-[10px] text-muted-foreground italic">{hint}</span>}
    </div>
  )
}

export default function DashboardClient(props: DashboardClientProps) {
  const { fyLabel, pfyLabel, fyStartYear, clubMetrics, membershipMetrics, serviceMetrics, sociIngressi, activitiesFY, causaTable, genderData, ageData, causeDataAllTime, zoneData, recentActivities } = props

  // === Andamento progressivo soci FY vs PFY (mensile) ===
  // Cumulativo: a fine di ogni mese fiscale, quanti soci hanno data_ingresso <= fine mese
  const membershipChart = useMemo(() => {
    const fyYearStart = new Date(`${fyStartYear}-07-01`)
    const pfyYearStart = new Date(`${fyStartYear - 1}-07-01`)
    const endOfFyMonth = (i: number) => {
      const d = new Date(fyYearStart)
      d.setMonth(d.getMonth() + i + 1)
      d.setDate(0) // fine mese precedente
      return d
    }
    const endOfPfyMonth = (i: number) => {
      const d = new Date(pfyYearStart)
      d.setMonth(d.getMonth() + i + 1)
      d.setDate(0)
      return d
    }
    const ingressi = sociIngressi.map(s => new Date(s).getTime()).filter(Boolean).sort((a, b) => a - b)
    const countBefore = (timestamp: number) => {
      // binary search
      let lo = 0, hi = ingressi.length
      while (lo < hi) {
        const mid = (lo + hi) >>> 1
        if (ingressi[mid] <= timestamp) lo = mid + 1
        else hi = mid
      }
      return lo
    }
    const now = Date.now()
    return MESI_FY.map((mese, i) => {
      const fyEnd = endOfFyMonth(i).getTime()
      const pfyEnd = endOfPfyMonth(i).getTime()
      return {
        mese,
        [`FY ${fyLabel}`]: fyEnd <= now ? countBefore(fyEnd) : null,
        [`PFY ${pfyLabel}`]: countBefore(pfyEnd),
      }
    })
  }, [sociIngressi, fyStartYear, fyLabel, pfyLabel])

  // === Andamento progressivo numero club (semplificato, dato non disponibile) ===
  // Usiamo totalClubs costante per ora — segnalato come dato non disponibile per mese
  const clubChart = useMemo(() => {
    return MESI_FY.map(mese => ({
      mese,
      [`FY ${fyLabel}`]: clubMetrics.total,
      [`PFY ${pfyLabel}`]: clubMetrics.total,
    }))
  }, [clubMetrics.total, fyLabel, pfyLabel])

  // === Attività mensili per causa (FY corrente, progressivo cumulativo) ===
  const causaList = useMemo(() => causaTable.map(c => c.causa), [causaTable])

  const activitiesByMonthCausa = useMemo(() => {
    // Conta cumulativo: per ogni mese fiscale, numero attività per causa fino a fine mese
    const monthlyAccum: Record<string, Record<string, number>> = {}
    for (const causa of causaList) monthlyAccum[causa] = Object.fromEntries(MESI_FY.map(m => [m, 0]))
    // Conteggio per mese
    const counts: Record<string, Record<string, number>> = {}
    for (const causa of causaList) counts[causa] = Object.fromEntries(MESI_FY.map(m => [m, 0]))
    for (const a of activitiesFY) {
      if (!a.data_inizio) continue
      const d = new Date(a.data_inizio)
      const fyIdx = naturalToFyIdx(d.getMonth())
      const c = a.causa || 'Non specificato'
      if (!counts[c]) {
        counts[c] = Object.fromEntries(MESI_FY.map(m => [m, 0]))
        monthlyAccum[c] = Object.fromEntries(MESI_FY.map(m => [m, 0]))
      }
      counts[c][MESI_FY[fyIdx]]++
    }
    // Cumulativo
    for (const causa of Object.keys(counts)) {
      let cum = 0
      for (const m of MESI_FY) {
        cum += counts[causa][m]
        monthlyAccum[causa][m] = cum
      }
    }
    // Output array per Recharts
    return MESI_FY.map(mese => {
      const row: any = { mese }
      for (const causa of Object.keys(monthlyAccum)) row[causa] = monthlyAccum[causa][mese]
      return row
    })
  }, [activitiesFY, causaList])

  const totaleNumeroFY = causaTable.reduce((s, r) => s + r.numero, 0)
  const totaleFondiFY = causaTable.reduce((s, r) => s + r.fondi, 0)
  const totaleDollariFY = causaTable.reduce((s, r) => s + r.dollari, 0)

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Dashboard Digitalions
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Quadro d&apos;insieme del Distretto 108 LA · Anno sociale <strong className="text-foreground">{fyLabel}</strong> (FY) vs <strong className="text-foreground">{pfyLabel}</strong> (PFY)
      </motion.p>

      {/* ===== Club Metrics ===== */}
      <motion.div variants={itemVariants} className="mb-4">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Building2 className="h-4 w-4 text-yellow-500" /> Club Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCell label="Totale Club" value={fmtNum(clubMetrics.total)} />
              <MetricCell label={`New Clubs in FY ${fyLabel}`} value={clubMetrics.newFY ?? 'n/d'} hint={clubMetrics.newFY == null ? 'dato non tracciato' : undefined} />
              <MetricCell label={`Reorg Clubs in FY ${fyLabel}`} value={clubMetrics.reorgFY ?? 'n/d'} hint={clubMetrics.reorgFY == null ? 'dato non tracciato' : undefined} />
              <MetricCell label={`Dropped Clubs in FY ${fyLabel}`} value={clubMetrics.droppedFY ?? 'n/d'} hint={clubMetrics.droppedFY == null ? 'dato non tracciato' : undefined} />
              <MetricCell label={`Status Quo Clubs in FY ${fyLabel}`} value={clubMetrics.statusQuoFY ?? 'n/d'} hint={clubMetrics.statusQuoFY == null ? 'dato non tracciato' : undefined} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Membership Metrics ===== */}
      <motion.div variants={itemVariants} className="mb-4">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-blue-500" /> Membership Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCell label="Total Membership" value={fmtNum(membershipMetrics.total)} />
              <MetricCell label={`Members Added in FY ${fyLabel}`} value={fmtNum(membershipMetrics.addedFY)} hint={`PFY: ${fmtNum(membershipMetrics.addedPFY)}`} />
              <MetricCell label={`Drop Members in FY ${fyLabel}`} value={membershipMetrics.droppedFY ?? 'n/d'} hint={membershipMetrics.droppedFY == null ? 'dato non tracciato' : undefined} />
              <MetricCell label={`Net Growth in FY ${fyLabel}`} value={membershipMetrics.netGrowthFY ?? 'n/d'} hint={membershipMetrics.netGrowthFY == null ? 'richiede Drop Members' : undefined} />
              <MetricCell label={`Net Growth in FY ${fyLabel} %`} value={fmtPct(membershipMetrics.netGrowthPctFY)} hint={membershipMetrics.netGrowthPctFY == null ? 'richiede Drop Members' : undefined} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Service Metrics ===== */}
      <motion.div variants={itemVariants} className="mb-6">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-red-500" /> Service Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCell label={`Overall Activity Count in FY ${fyLabel}`} value={fmtNum(serviceMetrics.activitiesFY)} />
              <MetricCell label={`Overall People Served in FY ${fyLabel}`} value={fmtNum(serviceMetrics.peopleServedFY)} />
              <MetricCell label={`Overall Volunteer Hours in FY ${fyLabel}`} value={fmtNum(serviceMetrics.volunteerHoursFY)} />
              <MetricCell label={`Clubs Reporting in FY ${fyLabel}`} value={`${fmtNum(serviceMetrics.clubsReportingFY)} (${fmtPct(serviceMetrics.clubsReportingPctFY)})`} hint={`${serviceMetrics.clubsReportingFY} / ${clubMetrics.total}`} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Grafici annuali progressivi ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-4 w-4 text-yellow-500" /> Andamento Numero Club
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Lug → Giu · FY {fyLabel} vs PFY {pfyLabel}</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={clubChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey={`PFY ${pfyLabel}`} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey={`FY ${fyLabel}`} stroke="#0055ff" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground italic mt-1 text-center">Dato storico mensile club non disponibile · mostrato totale corrente</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Andamento Numero Soci
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Lug → Giu · FY {fyLabel} vs PFY {pfyLabel} · cumulativo per data ingresso</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={membershipChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey={`PFY ${pfyLabel}`} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                <Line type="monotone" dataKey={`FY ${fyLabel}`} stroke="#0055ff" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Attività per causa - andamento mensile ===== */}
      <motion.div variants={itemVariants} className="mb-6">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-4 w-4 text-purple-500" /> Attività per Causa (cumulativo mensile FY {fyLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={activitiesByMonthCausa} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Legend iconSize={9} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                {causaList.map((c, i) => (
                  <Line key={c} type="monotone" dataKey={c} stroke={CAUSA_COLORS[i % CAUSA_COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Tabella riepilogo causa ===== */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-amber-500" /> Riepilogo per Causa · FY {fyLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Causa</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Numero</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Incidenza %</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Fondi raccolti (€)</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Fondi raccolti capped ($)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {causaTable.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nessuna attività nell&apos;anno sociale {fyLabel}</TableCell></TableRow>
                ) : (
                  <>
                    {causaTable.map((r) => (
                      <TableRow key={r.causa} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{r.causa}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtNum(r.numero)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.incidenza.toFixed(1)}%</TableCell>
                        <TableCell className="text-right tabular-nums">€ {fmtNum(r.fondi, 2)}</TableCell>
                        <TableCell className="text-right tabular-nums">$ {fmtNum(r.dollari, 2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/40">
                      <TableCell>TOTALE</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(totaleNumeroFY)}</TableCell>
                      <TableCell className="text-right tabular-nums">100.0%</TableCell>
                      <TableCell className="text-right tabular-nums">€ {fmtNum(totaleFondiFY, 2)}</TableCell>
                      <TableCell className="text-right tabular-nums">$ {fmtNum(totaleDollariFY, 2)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </table>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Sezione storica (all-time) — preservata dalla dashboard precedente ===== */}
      <motion.div variants={itemVariants} className="mt-10 mb-3">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">Distribuzione storica complessiva</h2>
        <p className="text-xs text-muted-foreground">Dati cumulativi indipendenti dall&apos;anno sociale corrente</p>
      </motion.div>

      {/* Genere + Fascia età */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieIcon className="h-4 w-4 text-blue-500" /> Distribuzione per Genere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" paddingAngle={3}>
                  {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Soci']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieIcon className="h-4 w-4 text-amber-500" /> Distribuzione per Fascia d&apos;Età
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={ageData} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" paddingAngle={3}>
                  {ageData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Soci']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Attività per Causa (all-time) + Attività per Zona */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-4 w-4 text-primary" /> Attività per Causa (storico)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={causeDataAllTime} margin={{ bottom: 55 }}>
                <XAxis dataKey="name" angle={-35} textAnchor="end" height={65} tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="value" name="Attività" fill="#0055ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4 text-amber-500" /> Attività per Zona (storico)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={zoneData} margin={{ bottom: 55 }}>
                <XAxis dataKey="name" angle={-35} textAnchor="end" height={65} tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="value" name="Attività" fill="#ffe500" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Attività Recenti */}
      <motion.div variants={itemVariants} className="mb-2">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4 text-indigo-500" /> Attività Recenti
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {recentActivities.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessuna attività recente</span>
              </div>
            ) : (
              <table className="w-full min-w-[600px] text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead className="hidden sm:table-cell">Club</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Causa</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Ore</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Fondi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity: any, index: number) => (
                    <motion.tr
                      key={activity.id_attivita}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, type: 'spring', stiffness: 100 }}
                      className="hover:bg-muted/40"
                    >
                      <TableCell className="font-medium max-w-[180px] truncate" title={activity.titolo}>{activity.titolo}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm max-w-[160px] truncate" title={activity.sponsor_nome_account}>{activity.sponsor_nome_account}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs whitespace-nowrap">{activity.sponsor_zona}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{activity.causa}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATO_COLORS[activity.stato] ?? 'bg-muted text-muted-foreground'}`}>
                          {activity.stato}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-right">{activity.totale_ore_servizio ?? 0}</TableCell>
                      <TableCell className="text-sm tabular-nums text-right">€ {activity.totale_fondi_raccolti ?? 0}</TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
