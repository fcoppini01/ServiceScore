'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, ShieldCheck, FileSpreadsheet } from 'lucide-react'
import { exportToExcel, todayStamp } from '@/lib/excel-export'
import { getCurrentAnnoSocialeStart, getAnnoSocialeRange, getAnniSociali } from '@/lib/anno-sociale'

// Prospetto "Ruoli di leadership del club" (da Statuto LCI).
// Template a righe fisse: per il club selezionato mostra chi ricopre ogni
// ruolo statutario; le posizioni scoperte restano vuote (come sul cartaceo).
// La colonna `match` contiene i titolo_ufficiale reali presenti nel DB
// (normalizzati) che corrispondono a quel ruolo.

type RoleDef = { label: string; match: string[] }

const GRUPPO_STATUTO: RoleDef[] = [
  { label: 'Presidente di Club (Presidente GAT di Club)', match: ['presidente di club'] },
  { label: 'Immediato Past Presidente', match: [] },
  { label: 'Primo Vice Presidente di Club (GLT di Club)', match: ['club first vice president'] },
  { label: 'Secondo Vice Presidente di Club', match: ['secondo vice presidente di club'] },
  { label: 'Segretario di Club', match: ['segretario di club'] },
  { label: 'Tesoriere di Club', match: ['tesoriere di club'] },
  { label: 'Presidente di club addetto ai soci - Presidente di Comitato Soci (GMT di Club)', match: ['presidente di club addetto ai soci'] },
  { label: 'Presidente addetto al Service di Club - Presidente Comitato Service (GST di Club)', match: ['presidente addetto ai service di club'] },
  { label: 'Presidente di Comitato Marketing - Presidente addetto al marketing e alla comunicazione', match: ['presidente di comitato marketing'] },
]

const GRUPPO_ALTRE: RoleDef[] = [
  { label: 'Amministratore di Club', match: ['amministratore del club'] },
  { label: 'Presidente di comitato di club addetto al protocollo - Cerimoniere (facoltativo)', match: ['presidente di comitato di club addetto al protocollo'] },
  { label: 'Coordinatore LCIF di Club', match: ['coordinatore lcif di club'] },
  { label: 'Censore (facoltativo)', match: [] },
  { label: 'Coordinatore dei Programmi', match: [] },
  { label: 'Officer Addetto alla Sicurezza (facoltativo)', match: [] },
  { label: 'Presidente del Satellite (se nominato)', match: [] },
  { label: 'Advisor Leo (se nominato)', match: [] },
  { label: 'Presidente di comitato di club addetto alle Tecnologie Informatiche (posizione sul Portal, non più su statuto)', match: ['presidente di comitato di club addetto alle tecnologie informatiche'] },
  { label: 'Direttore di Club (consiglieri in numero a discrezione del Club)', match: ['direttore di club'] },
  { label: 'Presidenti di Comitati (se eletti e a discrezione del Club)', match: [] },
]

const ALL_ROLES = [...GRUPPO_STATUTO, ...GRUPPO_ALTRE]

function norm(s: string | null | undefined): string {
  // I titolo_ufficiale nel DB non contengono accenti, basta lowercase + spazi normalizzati.
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

type Off = {
  id_incarico: any
  matricola_socio: string | null
  titolo_ufficiale: string | null
  nome: string | null
  cognome: string | null
  email: string | null
  telefono: string | null
}

// Riga renderizzata: label ruolo + eventuale persona (null = riga vuota)
type RenderRow = { label: string; off: Off | null }

export default function QuadroRuoliClubPage() {
  const [clubs, setClubs] = useState<string[]>([])
  const [clubSel, setClubSel] = useState<string[]>([])
  const anniOpzioni = useMemo(() => getAnniSociali(), [])
  const [anniSociali, setAnniSociali] = useState<number[]>([getCurrentAnnoSocialeStart()])
  const [officers, setOfficers] = useState<Off[]>([])
  // Presidente dell'anno sociale precedente = Immediato Past Presidente (regola LCI).
  // Ricavato automaticamente perché nei dati officer non esiste questo titolo.
  const [pastPresidente, setPastPresidente] = useState<Off | null>(null)
  const [pastAnnoLabel, setPastAnnoLabel] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const club = clubSel[0] ?? ''

  useEffect(() => {
    setIsClient(true)
    loadClubs()
  }, [])

  useEffect(() => {
    if (!isClient) return
    if (!club) { setOfficers([]); return }
    loadOfficers()
  }, [isClient, club, anniSociali])

  async function loadClubs() {
    const { data } = await supabase.from('club').select('nome_club').range(0, 9999)
    if (data) setClubs([...new Set(data.map((c: any) => c.nome_club))].filter(Boolean).sort() as string[])
  }

  async function loadOfficers() {
    setLoading(true)
    setError(null)
    // Incarichi del club attivi durante gli anni sociali selezionati (sovrapposizione mandato ↔ finestra anni).
    // Con più anni si usa la finestra [prima data inizio anno, ultima data fine anno].
    let q = supabase
      .from('vista_officer_ricerca')
      .select('id_incarico, matricola_socio, titolo_ufficiale, nome, cognome, data_inizio, data_conclusione, email, telefono')
      .eq('nome_club', club)
    if (anniSociali.length) {
      const ranges = anniSociali.map((y) => getAnnoSocialeRange(y))
      const from = ranges.map((r) => r.from).sort()[0]
      const to = ranges.map((r) => r.to).sort().slice(-1)[0]
      q = q.or(`data_inizio.is.null,data_inizio.lte.${to}`).or(`data_conclusione.is.null,data_conclusione.gte.${from}`)
    }
    const offRes = await q.range(0, 9999)

    if (offRes.error) { setError('Errore nel caricamento. Riprova.'); setLoading(false); return }
    const rows = offRes.data ?? []

    // Email (indirizzo vero) e telefono cellulare arrivano già dalla vista officer.
    setOfficers(rows.map((o: any) => ({
      id_incarico: o.id_incarico,
      matricola_socio: o.matricola_socio,
      titolo_ufficiale: o.titolo_ufficiale,
      nome: o.nome,
      cognome: o.cognome,
      email: o.email ?? null,
      telefono: o.telefono ?? null,
    })))

    // Immediato Past Presidente = Presidente del club dell'anno sociale precedente
    // (rispetto al più recente anno selezionato). Ricavato con una query dedicata.
    await loadPastPresidente()
    setLoading(false)
  }

  async function loadPastPresidente() {
    if (!anniSociali.length) { setPastPresidente(null); setPastAnnoLabel(''); return }
    const pastYear = Math.max(...anniSociali) - 1
    const { from, to, label } = getAnnoSocialeRange(pastYear)
    setPastAnnoLabel(label)
    const { data } = await supabase
      .from('vista_officer_ricerca')
      .select('id_incarico, matricola_socio, titolo_ufficiale, nome, cognome, email, telefono, data_inizio, data_conclusione')
      .eq('nome_club', club)
      .or(`data_inizio.is.null,data_inizio.lte.${to}`)
      .or(`data_conclusione.is.null,data_conclusione.gte.${from}`)
      .range(0, 999)
    const pres = (data ?? []).find((o: any) => norm(o.titolo_ufficiale) === 'presidente di club')
    setPastPresidente(pres ? {
      id_incarico: `past-${pres.id_incarico}`,
      matricola_socio: pres.matricola_socio,
      titolo_ufficiale: pres.titolo_ufficiale,
      nome: pres.nome,
      cognome: pres.cognome,
      email: pres.email ?? null,
      telefono: pres.telefono ?? null,
    } : null)
  }

  // Costruisce le righe per un gruppo di ruoli + traccia gli incarichi abbinati
  function buildGroup(roles: RoleDef[], usedIds: Set<any>): RenderRow[] {
    const out: RenderRow[] = []
    for (const role of roles) {
      const matches = role.match.length
        ? officers.filter((o) => role.match.includes(norm(o.titolo_ufficiale)))
        : []
      matches.forEach((m) => usedIds.add(m.id_incarico))
      if (matches.length === 0) out.push({ label: role.label, off: null })
      else matches.forEach((m) => out.push({ label: role.label, off: m }))
    }
    return out
  }

  const { rowsStatuto, rowsAltre, rowsAltri } = useMemo(() => {
    const used = new Set<any>()
    const rowsStatuto = buildGroup(GRUPPO_STATUTO, used).map((r) =>
      // Compila in automatico l'Immediato Past Presidente col presidente dell'anno precedente
      r.label === 'Immediato Past Presidente' && !r.off && pastPresidente
        ? { ...r, off: pastPresidente }
        : r
    )
    const rowsAltre = buildGroup(GRUPPO_ALTRE, used)
    // Incarichi presenti nel club ma non riconducibili ai ruoli dello schema
    const rowsAltri: RenderRow[] = officers
      .filter((o) => !used.has(o.id_incarico))
      .map((o) => ({ label: o.titolo_ufficiale ?? '—', off: o }))
    return { rowsStatuto, rowsAltre, rowsAltri }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officers, pastPresidente])

  const annoLabel = anniSociali.length
    ? [...anniSociali].sort((a, b) => a - b).map((y) => getAnnoSocialeRange(y).label).join(', ')
    : 'tutti gli anni'

  function esportaExcel() {
    const allRows = [
      ...rowsStatuto.map((r) => ({ ...r, gruppo: 'Officer di Club da Statuto LCI' })),
      ...rowsAltre.map((r) => ({ ...r, gruppo: 'Altre posizioni nominabili nel Consiglio Direttivo' })),
      ...rowsAltri.map((r) => ({ ...r, gruppo: 'Altri incarichi' })),
    ]
    exportToExcel(
      allRows,
      [
        { header: 'Sezione', accessor: (r: any) => r.gruppo },
        { header: 'Incarico', accessor: (r: any) => r.label },
        { header: 'Codice socio', accessor: (r: any) => r.off?.matricola_socio ?? '' },
        { header: 'Nome', accessor: (r: any) => r.off?.nome ?? '' },
        { header: 'Cognome', accessor: (r: any) => r.off?.cognome ?? '' },
        { header: 'email', accessor: (r: any) => r.off?.email ?? '' },
        { header: 'Telefono', accessor: (r: any) => r.off?.telefono ?? '' },
      ],
      `ruoli_leadership_${(club || 'club').replace(/\s+/g, '_')}_${todayStamp()}`,
      'Ruoli leadership'
    )
  }

  if (!isClient) return null

  const PersonCells = ({ off }: { off: Off | null }) => (
    <>
      <TableCell className="whitespace-nowrap font-mono text-xs">{off?.matricola_socio ?? ''}</TableCell>
      <TableCell className="whitespace-nowrap">{off?.nome ?? ''}</TableCell>
      <TableCell className="whitespace-nowrap font-medium">{off?.cognome ?? ''}</TableCell>
      <TableCell className="text-xs">{off?.email ?? ''}</TableCell>
      <TableCell className="whitespace-nowrap font-mono text-xs">{off?.telefono ?? ''}</TableCell>
    </>
  )

  const GroupHeader = ({ children }: { children: React.ReactNode }) => (
    <TableRow className="bg-muted/60 print:bg-transparent">
      <TableCell colSpan={6} className="font-bold text-sm py-2 border-y border-border print:border-black">{children}</TableCell>
    </TableRow>
  )

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 print-hide gap-2 flex-wrap">
        <Link href="/officer/rapporti">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Rapporti Officer
          </Button>
        </Link>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent print:text-foreground print:bg-none">
        Ruoli di Leadership del Club
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-4 print:text-black">
        {club
          ? <>Club <strong className="text-foreground print:text-black">{club}</strong> · Anno sociale <strong className="text-foreground print:text-black">{annoLabel}</strong></>
          : 'Seleziona un club per generare il prospetto dei ruoli statutari (Officer di club da Statuto LCI)'}
      </motion.p>

      <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2 flex-wrap print-hide">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={esportaExcel} size="sm" className="text-xs gap-1.5" disabled={!club}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={!club}>
            <Printer className="h-3.5 w-3.5" /> Stampa / Salva PDF
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Club</p>
                <MultiSelect
                  options={clubs}
                  selected={clubSel}
                  onChange={(v) => setClubSel(v.slice(-1))}
                  placeholder="Seleziona un club…"
                />
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
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm print:border-none print:bg-transparent">
          <CardHeader className="pb-3 print-hide">
            <CardTitle className="text-base font-semibold">Prospetto ruoli {club && `· ${club}`}</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0">
            {error ? (
              <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
            ) : !club ? (
              <div className="flex flex-col justify-center items-center h-32 gap-2 text-muted-foreground">
                <ShieldCheck className="w-8 h-8 opacity-30" />
                <span className="text-sm">Nessun club selezionato</span>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm cv-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[36%]">Incarico</TableHead>
                      <TableHead className="whitespace-nowrap">Codice socio</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead>email</TableHead>
                      <TableHead className="whitespace-nowrap">Telefono</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <GroupHeader>Officer di Club da Statuto LCI</GroupHeader>
                    {rowsStatuto.map((r, i) => (
                      <TableRow key={`s${i}`} className="cv-row print:hover:bg-transparent">
                        <TableCell className="align-top leading-snug">{r.label}</TableCell>
                        <PersonCells off={r.off} />
                      </TableRow>
                    ))}
                    <GroupHeader>Altre posizioni nominabili nel Consiglio Direttivo del Club</GroupHeader>
                    {rowsAltre.map((r, i) => (
                      <TableRow key={`a${i}`} className="cv-row print:hover:bg-transparent">
                        <TableCell className="align-top leading-snug">{r.label}</TableCell>
                        <PersonCells off={r.off} />
                      </TableRow>
                    ))}
                    {rowsAltri.length > 0 && (
                      <>
                        <GroupHeader>Altri incarichi (fuori dallo schema statutario)</GroupHeader>
                        {rowsAltri.map((r, i) => (
                          <TableRow key={`x${i}`} className="cv-row print:hover:bg-transparent">
                            <TableCell className="align-top leading-snug">{r.label}</TableCell>
                            <PersonCells off={r.off} />
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </table>
                {pastPresidente && (
                  <p className="text-[10px] text-muted-foreground italic mt-3 print:text-black">
                    L&apos;<strong>Immediato Past Presidente</strong> è compilato in automatico con il Presidente del club
                    dell&apos;anno sociale {pastAnnoLabel} (regola statutaria LCI: il past president è il presidente dell&apos;annata precedente).
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
