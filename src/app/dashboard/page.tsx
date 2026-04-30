import { createClient } from "@/utils/supabase/server"
import DashboardClient from "@/components/dashboard/dashboard-client"

function buildDist(data: { [key: string]: any }[] | null, key: string, fallback = 'Non specificato') {
  const dist = (data || []).reduce((acc: Record<string, number>, item) => {
    const val = item[key] || fallback
    acc[val] = (acc[val] || 0) + 1
    return acc
  }, {})
  return Object.entries(dist).map(([name, value]) => ({ name, value }))
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalSoci },
    { count: totalClubs },
    { count: totalActivities },
    { data: hoursData },
    { data: genderData },
    { data: ageData },
    { data: causeData },
    { data: zoneData },
    { data: recentActivities },
  ] = await Promise.all([
    supabase.from('vista_soci_ricerca').select('*', { count: 'exact', head: true }),
    supabase.from('club').select('*', { count: 'exact', head: true }),
    supabase.from('vista_report_ricerca').select('*', { count: 'exact', head: true }),
    supabase.from('vista_report_ricerca').select('totale_ore_servizio'),
    supabase.from('vista_soci_ricerca').select('sesso').not('sesso', 'is', null),
    supabase.from('vista_soci_ricerca').select('fascia_eta').not('fascia_eta', 'is', null),
    supabase.from('vista_report_ricerca').select('causa').not('causa', 'is', null),
    supabase.from('vista_report_ricerca').select('sponsor_zona').not('sponsor_zona', 'is', null),
    supabase.from('vista_report_ricerca').select('*').order('data_inizio', { ascending: false }).limit(10),
  ])

  const totalHours = (hoursData || []).reduce((sum, item) => sum + (item.totale_ore_servizio || 0), 0)

  return (
    <DashboardClient
      stats={{
        totalSoci: totalSoci || 0,
        totalClubs: totalClubs || 0,
        totalActivities: totalActivities || 0,
        totalHours,
      }}
      genderData={buildDist(genderData, 'sesso')}
      ageData={buildDist(ageData, 'fascia_eta')}
      causeData={buildDist(causeData, 'causa', 'Altro')}
      zoneData={buildDist(zoneData, 'sponsor_zona')}
      recentActivities={recentActivities || []}
    />
  )
}
