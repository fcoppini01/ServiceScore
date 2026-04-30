'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { containerVariants, itemVariants } from "@/lib/animations"
import { Users, Building2, Activity, Clock } from "lucide-react"

const COLORS = ['#0055ff', '#ffe500', '#ff4444', '#6366f1', '#a3a3a3']

const STATO_COLORS: Record<string, string> = {
  Completato: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  'In corso': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  Pianificato: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
}

const statConfig = [
  { key: 'totalSoci', label: "Totale Soci", Icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { key: 'totalClubs', label: "Club", Icon: Building2, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { key: 'totalActivities', label: "Attività", Icon: Activity, color: "text-red-400", bg: "bg-red-400/10" },
  { key: 'totalHours', label: "Ore di Servizio", Icon: Clock, color: "text-indigo-400", bg: "bg-indigo-400/10" },
]

export default function DashboardClient({
  stats,
  genderData,
  ageData,
  causeData,
  zoneData,
  recentActivities,
}: {
  stats: { totalSoci: number; totalClubs: number; totalActivities: number; totalHours: number }
  genderData: { name: string; value: number }[]
  ageData: { name: string; value: number }[]
  causeData: { name: string; value: number }[]
  zoneData: { name: string; value: number }[]
  recentActivities: any[]
}) {
  const statValues: Record<string, string | number> = {
    totalSoci: stats.totalSoci,
    totalClubs: stats.totalClubs,
    totalActivities: stats.totalActivities,
    totalHours: stats.totalHours.toFixed(0),
  }

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto p-4 sm:p-8"
    >
      <motion.h1
        variants={itemVariants}
        className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent"
      >
        Dashboard
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-8">
        Panoramica generale del Distretto 108 LA
      </motion.p>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {statConfig.map(({ key, label, Icon, color, bg }) => (
          <Card key={key} className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">{statValues[key]}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuzione per Genere</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" paddingAngle={3}>
                  {genderData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Soci']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuzione per Fascia d'Età</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={ageData} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" paddingAngle={3}>
                  {ageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Soci']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Attività per Causa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={causeData} margin={{ bottom: 55 }}>
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
            <CardTitle className="text-base font-semibold">Attività per Zona</CardTitle>
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

      {/* Recent Activities */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Attività Recenti</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {recentActivities.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessuna attività recente</span>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead className="hidden sm:table-cell">Club</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Causa</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Ore</TableHead>
                    <TableHead>Fondi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity: any, index: number) => (
                    <motion.tr
                      key={activity.id_attivita}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, type: "spring", stiffness: 100 }}
                      className="hover:bg-muted/40"
                    >
                      <TableCell className="font-medium max-w-[150px] truncate">{activity.titolo}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{activity.sponsor_nome_account}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{activity.sponsor_zona}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{activity.causa}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATO_COLORS[activity.stato] ?? 'bg-muted text-muted-foreground'}`}>
                          {activity.stato}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{activity.totale_ore_servizio}</TableCell>
                      <TableCell className="text-sm tabular-nums">€ {activity.totale_fondi_raccolti}</TableCell>
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
