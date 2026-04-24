import { createClient } from "@/utils/supabase/server"
import DashboardClient from "@/components/dashboard/dashboard-client"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch overview stats
  const { count: totalSoci } = await supabase
    .from('vista_soci_ricerca')
    .select('*', { count: 'exact', head: true })

  const { count: totalClubs } = await supabase
    .from('club')
    .select('*', { count: 'exact', head: true })

  const { count: totalActivities } = await supabase
    .from('vista_report_ricerca')
    .select('*', { count: 'exact', head: true })

  const { data: hoursData } = await supabase
    .from('vista_report_ricerca')
    .select('totale_ore_servizio')
  
  const totalHours = hoursData?.reduce((sum, item) => sum + (item.totale_ore_servizio || 0), 0) || 0

  // Gender distribution
  const { data: genderData } = await supabase
    .from('vista_soci_ricerca')
    .select('sesso')
    .not('sesso', 'is', null)
  
  const genderDist = genderData?.reduce((acc: any, item) => {
    const sesso = item.sesso || 'Non specificato'
    acc[sesso] = (acc[sesso] || 0) + 1
    return acc
  }, {}) || {}

  const genderChartData = Object.entries(genderDist).map(([name, value]: [string, any]) => ({ name, value: Number(value) }))

  // Age group distribution
  const { data: ageData } = await supabase
    .from('vista_soci_ricerca')
    .select('fascia_eta')
    .not('fascia_eta', 'is', null)

  const ageDist = ageData?.reduce((acc: any, item) => {
    const fascia = item.fascia_eta || 'Non specificato'
    acc[fascia] = (acc[fascia] || 0) + 1
    return acc
  }, {}) || {}

  const ageChartData = Object.entries(ageDist).map(([name, value]: [string, any]) => ({ name, value: Number(value) }))

  // Activities by cause
  const { data: causeData } = await supabase
    .from('vista_report_ricerca')
    .select('causa')
    .not('causa', 'is', null)

  const causeDist = causeData?.reduce((acc: any, item) => {
    const causa = item.causa || 'Altro'
    acc[causa] = (acc[causa] || 0) + 1
    return acc
  }, {}) || {}

  const causeChartData = Object.entries(causeDist).map(([name, value]: [string, any]) => ({ name, value: Number(value) }))

  // Activities by zone
  const { data: zoneData } = await supabase
    .from('vista_report_ricerca')
    .select('sponsor_zona')
    .not('sponsor_zona', 'is', null)

  const zoneDist = zoneData?.reduce((acc: any, item) => {
    const zona = item.sponsor_zona || 'Non specificato'
    acc[zona] = (acc[zona] || 0) + 1
    return acc
  }, {}) || {}

  const zoneChartData = Object.entries(zoneDist).map(([name, value]: [string, any]) => ({ name, value: Number(value) }))

  // Recent activities
  const { data: recentActivities } = await supabase
    .from('vista_report_ricerca')
    .select('*')
    .order('data_inizio', { ascending: false })
    .limit(10)

  return (
    <DashboardClient
      stats={{
        totalSoci: totalSoci || 0,
        totalClubs: totalClubs || 0,
        totalActivities: totalActivities || 0,
        totalHours,
      }}
      genderData={genderChartData}
      ageData={ageChartData}
      causeData={causeChartData}
      zoneData={zoneChartData}
      recentActivities={recentActivities || []}
    />
  )
}
