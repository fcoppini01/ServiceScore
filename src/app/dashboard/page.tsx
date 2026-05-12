import { createClient } from "@/utils/supabase/server"
import DashboardClient from "@/components/dashboard/dashboard-client"
import { getCurrentAnnoSocialeStart, getAnnoSocialeRange } from "@/lib/anno-sociale"

export default async function DashboardPage() {
  const supabase = await createClient()

  const fyStart = getCurrentAnnoSocialeStart()
  const fy = getAnnoSocialeRange(fyStart)
  const pfy = getAnnoSocialeRange(fyStart - 1)
  const ppfy = getAnnoSocialeRange(fyStart - 2)

  const [
    { count: totalClubs },
    { count: totalSoci },
    { data: sociAddedFY },
    { data: sociAddedPFY },
    { data: allSociIngressi },
    { data: activitiesFY },
    { data: activitiesPFY },
  ] = await Promise.all([
    supabase.from('club').select('*', { count: 'exact', head: true }),
    supabase.from('soci').select('*', { count: 'exact', head: true }),
    supabase.from('soci').select('matricola_socio', { count: 'exact', head: false })
      .gte('data_ingresso', fy.from).lte('data_ingresso', fy.to),
    supabase.from('soci').select('matricola_socio', { count: 'exact', head: false })
      .gte('data_ingresso', pfy.from).lte('data_ingresso', pfy.to),
    supabase.from('soci').select('data_ingresso').not('data_ingresso', 'is', null).range(0, 9999),
    supabase.from('vista_report_ricerca').select('id_attivita, data_inizio, causa, persone_servite, totale_ore_servizio, totale_fondi_raccolti, fondi_raccolti_usd_capped, sponsor_nome_account')
      .gte('data_inizio', fy.from).lte('data_inizio', fy.to).range(0, 9999),
    supabase.from('vista_report_ricerca').select('id_attivita, data_inizio, causa, persone_servite, totale_ore_servizio, totale_fondi_raccolti, fondi_raccolti_usd_capped, sponsor_nome_account')
      .gte('data_inizio', pfy.from).lte('data_inizio', pfy.to).range(0, 9999),
  ])

  // Aggregazioni service FY
  const actFY = activitiesFY ?? []
  const totPeopleServedFY = actFY.reduce((s, a: any) => s + (Number(a.persone_servite) || 0), 0)
  const totVolunteerHoursFY = actFY.reduce((s, a: any) => s + (Number(a.totale_ore_servizio) || 0), 0)
  const clubsReportingFY = new Set(actFY.map((a: any) => a.sponsor_nome_account).filter(Boolean)).size
  const clubsReportingPct = totalClubs ? (clubsReportingFY / totalClubs) * 100 : 0

  // Causa breakdown FY
  const causaMap = new Map<string, { numero: number; fondi: number; dollari: number }>()
  for (const a of actFY) {
    const c = (a as any).causa || 'Non specificato'
    if (!causaMap.has(c)) causaMap.set(c, { numero: 0, fondi: 0, dollari: 0 })
    const row = causaMap.get(c)!
    row.numero++
    row.fondi += Number((a as any).totale_fondi_raccolti) || 0
    row.dollari += Number((a as any).fondi_raccolti_usd_capped) || 0
  }
  const causaTable = Array.from(causaMap.entries())
    .map(([causa, v]) => ({ causa, ...v, incidenza: actFY.length ? (v.numero / actFY.length) * 100 : 0 }))
    .sort((a, b) => b.numero - a.numero)

  return (
    <DashboardClient
      fyLabel={fy.label}
      pfyLabel={pfy.label}
      fyStartYear={fyStart}
      clubMetrics={{
        total: totalClubs ?? 0,
        newFY: null, reorgFY: null, droppedFY: null, statusQuoFY: null,
      }}
      membershipMetrics={{
        total: totalSoci ?? 0,
        addedFY: (sociAddedFY ?? []).length,
        addedPFY: (sociAddedPFY ?? []).length,
        droppedFY: null,
        netGrowthFY: null,
        netGrowthPctFY: null,
      }}
      serviceMetrics={{
        activitiesFY: actFY.length,
        peopleServedFY: totPeopleServedFY,
        volunteerHoursFY: totVolunteerHoursFY,
        clubsReportingFY,
        clubsReportingPctFY: clubsReportingPct,
      }}
      sociIngressi={(allSociIngressi ?? []).map((s: any) => s.data_ingresso).filter(Boolean)}
      activitiesFY={actFY}
      activitiesPFY={activitiesPFY ?? []}
      causaTable={causaTable}
      ppfyLabel={ppfy.label}
    />
  )
}
