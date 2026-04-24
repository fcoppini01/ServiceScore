'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { containerVariants, itemVariants } from "@/lib/animations"

const COLORS = ['#0055ff', '#ffe500', '#ff0000', '#0d0d0d', '#666666']

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
  const renderCustomLabel = (props: any) => {
    const { name, percent } = props
    if (percent === undefined) return name || ''
    return `${name || ''} ${(percent * 100).toFixed(0)}%`
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
        className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent"
      >
        Dashboard Admin
      </motion.h1>

      {/* Stats Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: "Total Soci", value: stats.totalSoci, icon: "👥" },
          { label: "Total Clubs", value: stats.totalClubs, icon: "🏢" },
          { label: "Total Activities", value: stats.totalActivities, icon: "📊" },
          { label: "Total Hours", value: stats.totalHours.toFixed(0), icon: "⏱" },
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
            <CardTitle className="text-lg">Soci by Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Soci by Age Group</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
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
            <CardTitle className="text-lg">Activities by Cause</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={causeData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Activities" fill="#0055ff" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Activities by Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Activities" fill="#ffe500" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activities Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Club</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Cause</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Funds</TableHead>
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
                    <TableCell>{activity.totale_ore_servizio}</TableCell>
                    <TableCell>€ {activity.totale_fondi_raccolti}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
