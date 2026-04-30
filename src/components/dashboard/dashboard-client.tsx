'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { containerVariants, itemVariants } from "@/lib/animations"

const COLORS = ['#0055ff', '#ffe500', '#ff4444', '#6366f1', '#a3a3a3']

const STATO_COLORS: Record<string, string> = {
  Completato: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  'In corso': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  Pianificato: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
}

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
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto p-4 sm:p-8"
    >
      <motion.h1
        variants={itemVariants}
        className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent"
      >
        Dashboard
      </motion.h1>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: "Totale Soci", value: stats.totalSoci, icon: "👥" },
          { label: "Club", value: stats.totalClubs, icon: "🏢" },
          { label: "Attività", value: stats.totalActivities, icon: "📊" },
          { label: "Ore di Servizio", value: stats.totalHours.toFixed(0), icon: "⏱" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            custom={index}
          >
            <Card className="border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row 1: Gender and Age Distribution */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Distribuzione per Genere</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                >
                  {genderData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Soci']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Distribuzione per Fascia d'Età</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                >
                  {ageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Soci']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row 2: Activities by Cause and Zone */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Attività per Causa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={causeData} margin={{ bottom: 60 }}>
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Attività" fill="#0055ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Attività per Zona</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneData} margin={{ bottom: 60 }}>
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Attività" fill="#ffe500" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activities Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Attività Recenti</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {recentActivities.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <span className="text-2xl">📋</span>
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
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {activity.titolo}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{activity.sponsor_nome_account}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{activity.sponsor_zona}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{activity.causa}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATO_COLORS[activity.stato] ?? 'bg-muted text-muted-foreground'}`}>
                          {activity.stato}
                        </span>
                      </TableCell>
                      <TableCell>{activity.totale_ore_servizio}</TableCell>
                      <TableCell>€ {activity.totale_fondi_raccolti}</TableCell>
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
