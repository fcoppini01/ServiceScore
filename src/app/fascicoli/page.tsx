'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Printer, FolderOpen } from 'lucide-react'
import { getCurrentAnnoSocialeStart, getAnnoSocialeRange, getAnniSociali } from '@/lib/anno-sociale'
import {
  buildFascicoli, FascicoloClub, Distribuzione, RenderRow, Totali,
} from '@/lib/fascicolo'

const fmt = (n: number, digits = 0) => n.toLocaleString('it-IT', { maximumFractionDigits: digits })
const fmtDate = (d: unknown) => d ? new Date(String(d)).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''

// --- Sotto-componenti di presentazione (solo rendering) ---

function FasceTable({ title, dist, accent }: { title: string; dist: Distribuzione; accent: string }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-2">
        <span className={`inline-block w-1 h-3.5 rounded-full ${accent}`} /> {title}
      </h4>
      <div className="overflow-x-auto rounded-lg border border-border/50 print:border-black">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 print:bg-transparent">
              <th className="text-left px-2 py-1.5 font-semibold uppercase text-muted-foreground border-r border-border/50 print:text-black">Fascia</th>
              {dist.fasce.map((f) => (
                <th key={f.label} className="px-2 py-1.5 font-semibold uppercase text-muted-foreground text-center border-r border-border/50 last:border-r-0 print:text-black">{f.label}</th>
              ))}
              <th className="px-2 py-1.5 font-semibold uppercase text-center bg-muted/60 print:text-black">Totale</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border/50">
              <td className="px-2 py-1.5 font-medium text-muted-foreground border-r border-border/50 print:text-black">Quantità</td>
              {dist.fasce.map((f) => (
                <td key={f.label} className="px-2 py-1.5 text-center tabular-nums font-semibold border-r border-border/50 last:border-r-0 print-nowrap">{f.count}</td>
              ))}
              <td className="px-2 py-1.5 text-center tabular-nums font-bold bg-muted/30 print-nowrap">{dist.tot}</td>
            </tr>
            <tr className="border-t border-border/50 bg-muted/20 print:bg-transparent">
              <td className="px-2 py-1.5 font-medium text-muted-foreground border-r border-border/50 print:text-black">%</td>
              {dist.fasce.map((f) => (
                <td key={f.label} className="px-2 py-1.5 text-center tabular-nums text-muted-foreground border-r border-border/50 last:border-r-0 print:text-black print-nowrap">
                  {dist.tot > 0 ? `${((f.count / dist.tot) * 100).toFixed(1)}%` : '—'}
                </td>
              ))}
              <td className="px-2 py-1.5 text-center tabular-nums font-bold bg-muted/30 print-nowrap">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TotaliBox({ label, t, accent = false }: { label: string; t: Totali; accent?: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-2 print:border-black print:bg-transparent ${accent ? 'border-2 border-primary/30 bg-primary/5' : 'border border-border/60 bg-muted/30'}`}>
      <p className={`text-[11px] font-bold uppercase tracking-wide mb-1.5 print:text-black ${accent ? 'text-primary' : 'text-foreground'}`}>{label} · {fmt(t.attivita)} attività</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px]">
        <div><span className="text-muted-foreground print:text-black">Persone</span><br /><span className="font-bold tabular-nums">{fmt(t.persone)}</span></div>
        <div><span className="text-muted-foreground print:text-black">Volontari</span><br /><span className="font-bold tabular-nums">{fmt(t.volontari)}</span></div>
        <div><span className="text-muted-foreground print:text-black">Ore capped</span><br /><span className="font-bold tabular-nums">{fmt(t.ore)}</span></div>
        <div><span className="text-muted-foreground print:text-black">Donati ($)</span><br /><span className="font-bold tabular-nums">{fmt(t.donati)}</span></div>
        <div><span className="text-muted-foreground print:text-black">Raccolti ($)</span><br /><span className="font-bold tabular-nums">{fmt(t.raccolti)}</span></div>
      </div>
    </div>
  )
}

function AttivitaTable({ rows, label, color }: { rows: Record<string, unknown>[]; label: string; color: string }) {
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground italic py-2 print:text-black">{label}: nessuna attività</p>
  }
  return (
    <div className="overflow-x-auto">
      <h4 className={`text-xs font-bold mb-1.5 pb-1 border-b-2 ${color} print:text-black print:border-black`}>{label} · {rows.length} attività</h4>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-muted/40 print:bg-transparent text-left">
            <th className="px-1.5 py-1 whitespace-nowrap print-nowrap print:text-black">Data</th>
            <th className="px-1.5 py-1 print:text-black">Titolo</th>
            <th className="px-1.5 py-1 whitespace-nowrap print:text-black">Causa</th>
            <th className="px-1.5 py-1 whitespace-nowrap print:text-black">Tipo progetto</th>
            <th className="px-1.5 py-1 text-right whitespace-nowrap print-nowrap print:text-black">Persone</th>
            <th className="px-1.5 py-1 text-right print-nowrap print:text-black">Volont.</th>
            <th className="px-1.5 py-1 text-right print-nowrap print:text-black">Ore</th>
            <th className="px-1.5 py-1 text-right print-nowrap print:text-black">Donati $</th>
            <th className="px-1.5 py-1 print:text-black">Org. beneficiata</th>
            <th className="px-1.5 py-1 text-right print-nowrap print:text-black">Raccolti $</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => (
            <tr key={String(a.id_attivita ?? i)} className="border-t border-border/40 print:border-black/30">
              <td className="px-1.5 py-1 whitespace-nowrap print-nowrap">{fmtDate(a.data_inizio)}</td>
              <td className="px-1.5 py-1 font-medium">{String(a.titolo ?? '')}</td>
              <td className="px-1.5 py-1 whitespace-nowrap">{String(a.causa ?? '')}</td>
              <td className="px-1.5 py-1 whitespace-nowrap">{String(a.tipo_progetto ?? '')}</td>
              <td className="px-1.5 py-1 text-right tabular-nums print-nowrap">{fmt(Number(a.persone_servite_limite) || 0)}</td>
              <td className="px-1.5 py-1 text-right tabular-nums print-nowrap">{fmt(Number(a.totale_volontari) || 0)}</td>
              <td className="px-1.5 py-1 text-right tabular-nums print-nowrap">{fmt(Number(a.totale_ore_servizio_capped) || 0)}</td>
              <td className="px-1.5 py-1 text-right tabular-nums print-nowrap">{fmt(Number(a.fondi_donati_usd_capped) || 0)}</td>
              <td className="px-1.5 py-1">{String(a.organizzazione_beneficiata ?? '')}</td>
              <td className="px-1.5 py-1 text-right tabular-nums print-nowrap">{fmt(Number(a.fondi_raccolti_usd_capped) || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NomineRows({ rows }: { rows: RenderRow[] }) {
  return (
    <>
      {rows.map((r, i) => (
        <tr key={i} className="border-t border-border/40 print:border-black/30">
          <td className="px-1.5 py-1 align-top leading-snug">{r.label}</td>
          <td className="px-1.5 py-1 whitespace-nowrap font-mono">{r.off?.matricola_socio ?? ''}</td>
          <td className="px-1.5 py-1 whitespace-nowrap">{r.off?.nome ?? ''}</td>
          <td className="px-1.5 py-1 whitespace-nowrap font-medium">{r.off?.cognome ?? ''}</td>
          <td className="px-1.5 py-1">{r.off?.email ?? ''}</td>
          <td className="px-1.5 py-1 whitespace-nowrap font-mono">{r.off?.telefono ?? ''}</td>
        </tr>
      ))}
    </>
  )
}

function SezioneTitolo({ n, title, newPage = false }: { n?: string; title: string; newPage?: boolean }) {
  return (
    <h3 className={`text-sm font-bold mt-6 mb-2 pb-1 border-b border-primary/30 text-primary print:text-black print:border-black break-inside-avoid print:break-after-avoid ${newPage ? 'print:break-before-page' : ''}`}>
      {n ? `${n} — ${title}` : title}
    </h3>
  )
}

// --- Blocco fascicolo di un singolo club ---
function FascicoloBlock({ f, zona, anniLabel, annoNomine, primo }: { f: FascicoloClub; zona: string; anniLabel: string; annoNomine: string; primo: boolean }) {
  // Nome club in "Title Case" per adattarsi allo stile della copertina (es. "Pontedera").
  const clubTitolo = f.club.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase())
  // Zona depurata dal prefisso "Zone:" del dato Lions (es. "Zone: F" -> "F").
  const zonaLabel = (zona || '').replace(/^\s*z(ona|one)\s*:?\s*/i, '').trim()
  // Riepilogo soci raggruppati per Classificazione (categoria associativa): conteggio e % sul totale.
  const perClass = (() => {
    const m = new Map<string, number>()
    for (const s of f.soci) { const k = (s.classificazione || 'N.D.').toString().toUpperCase(); m.set(k, (m.get(k) || 0) + 1) }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it'))
  })()
  const totClass = f.soci.length
  return (
    <section className={primo ? '' : 'print:break-before-page'}>
      {/* Copertina del fascicolo (una pagina intera per club). Template ufficiale
          "La Concretezza del Fare" già ORIZZONTALE (A4 landscape),
          public/copertina-guida-landscape.png — stessa immagine a schermo e in
          stampa, nessuna rotazione (l'orientamento coincide con la pagina di stampa).
          Il nome del club è scritto dinamicamente sotto le tre righe di testo
          ("...tra Distretto e Club"): centrato al 50% della larghezza (come le righe
          sopra, misurate), stesso font sans e dimensione intermedia tra titolo e
          sottotitolo. Il box ha lo stesso aspect-ratio dell'immagine, quindi
          object-cover non taglia nulla. */}
      <div
        className="relative w-full mx-auto max-w-[900px] rounded-lg overflow-hidden shadow-sm mb-8 [container-type:inline-size] print:shadow-none print:rounded-none print:mb-0 print:mx-auto print:max-w-none print:h-[194mm] print:break-after-page"
        style={{ aspectRatio: '3508 / 2481' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/copertina-guida-landscape.png" alt="Copertina guida operativa" className="absolute inset-0 h-full w-full object-cover" />
        <span className="copertina-nome-club absolute left-1/2 top-[78%] -translate-x-1/2 -translate-y-1/2 w-[76%] text-center font-semibold text-white text-[3cqw] leading-tight [font-family:Arial,Helvetica,sans-serif] drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)]">
          Lions Club {clubTitolo}
        </span>
        {/* In basso a sinistra: Mod. 2 - Report di Conoscenza del Club */}
        <span className="copertina-testo absolute left-[4.5%] bottom-[4.5%] text-white font-extrabold uppercase text-[2.2cqw] [font-family:Arial,Helvetica,sans-serif] drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)]">
          Mod. 2 - Report di Conoscenza del Club
        </span>
        {/* In basso a destra: ZONA */}
        <span className="copertina-testo absolute right-[4.5%] bottom-[4.5%] text-white font-bold uppercase tracking-wide text-[1.9cqw] [font-family:Arial,Helvetica,sans-serif] drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)]">
          Zona {zonaLabel}
        </span>
      </div>

      <div className="mx-auto max-w-[1050px] print:max-w-[250mm]">
      <div className="mt-8 print:mt-0 mb-2 pb-2 border-b-2 border-primary print:border-black">
        <h2 className="text-xl font-bold print:text-black">Fascicolo Club {f.club}</h2>
        <p className="text-xs text-muted-foreground print:text-black">{f.totSoci} soci · Anni sociali {anniLabel} · Nomine anno in corso {annoNomine}</p>
      </div>

      {/* 1) Elenco soci (in cima). Intestazione senza prefisso "Mod. 2 - Sez. 1" e su
          pagina nuova (dopo il titolo del club). Colonne: Codice socio, Cognome, Nome, Email, Telefono. */}
      <SezioneTitolo title="Classificazione dei Soci per Categoria Associativa" newPage />
      <div className="overflow-x-auto rounded-lg border border-border/50 print:border-black">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/40 print:bg-transparent text-left">
              <th className="px-2 py-1.5 print:text-black">Codice socio</th>
              <th className="px-2 py-1.5 print:text-black">Cognome</th>
              <th className="px-2 py-1.5 print:text-black">Nome</th>
              <th className="px-2 py-1.5 print:text-black">Email</th>
              <th className="px-2 py-1.5 print:text-black">Telefono</th>
            </tr>
          </thead>
          <tbody>
            {f.soci.map((s, i) => (
              <tr key={i} className="border-t border-border/40 print:border-black/30">
                <td className="px-2 py-1 whitespace-nowrap font-mono">{s.matricola ?? ''}</td>
                <td className="px-2 py-1 whitespace-nowrap font-medium">{s.cognome ?? ''}</td>
                <td className="px-2 py-1 whitespace-nowrap">{s.nome ?? ''}</td>
                <td className="px-2 py-1">{s.email ?? ''}</td>
                <td className="px-2 py-1 whitespace-nowrap font-mono">{s.telefono ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2) Sez. 1 - Composizione (stessa sezione: niente salto pagina) */}
      <SezioneTitolo n="Mod. 2 - Sez. 1" title="Composizione (anzianità anagrafica e lionistica, genere)" />
      <FasceTable title="Fasce d'Età" dist={f.eta} accent="bg-emerald-500" />
      <FasceTable title="Anzianità Lionistica (anni)" dist={f.anz} accent="bg-blue-500" />
      <FasceTable title="Genere" dist={f.sesso} accent="bg-purple-500" />

      {/* 3) Sez. 1 - Riepilogo soci per Classificazione (stessa sezione: niente salto pagina) */}
      <SezioneTitolo n="Mod. 2 - Sez. 1" title="Riepilogo Soci per Classificazione" />
      <div className="overflow-x-auto rounded-lg border border-border/50 print:border-black max-w-[520px]">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/40 print:bg-transparent text-left">
              <th className="px-2 py-1.5 print:text-black">Classificazione</th>
              <th className="px-2 py-1.5 text-right print:text-black">N. soci</th>
              <th className="px-2 py-1.5 text-right print:text-black">% del totale</th>
            </tr>
          </thead>
          <tbody>
            {perClass.map(([cls, n]) => (
              <tr key={cls} className="border-t border-border/40 print:border-black/30">
                <td className="px-2 py-1 whitespace-nowrap">{cls}</td>
                <td className="px-2 py-1 text-right tabular-nums font-semibold print-nowrap">{n}</td>
                <td className="px-2 py-1 text-right tabular-nums text-muted-foreground print:text-black print-nowrap">{totClass > 0 ? ((n / totClass) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            ))}
            <tr className="border-t border-border/50 bg-muted/30 print:bg-transparent font-bold">
              <td className="px-2 py-1">Totale</td>
              <td className="px-2 py-1 text-right tabular-nums">{totClass}</td>
              <td className="px-2 py-1 text-right tabular-nums">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sez. 2 - Nomine */}
      <SezioneTitolo n="Mod. 2 - Sez. 2" title={`Nomine — Ruoli di Leadership del Club (anno in corso ${annoNomine})`} newPage />
      <div className="overflow-x-auto rounded-lg border border-border/50 print:border-black">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-muted/40 print:bg-transparent text-left">
              <th className="px-1.5 py-1.5 w-[34%] print:text-black">Incarico</th>
              <th className="px-1.5 py-1.5 print:text-black">Codice socio</th>
              <th className="px-1.5 py-1.5 print:text-black">Nome</th>
              <th className="px-1.5 py-1.5 print:text-black">Cognome</th>
              <th className="px-1.5 py-1.5 print:text-black">Email</th>
              <th className="px-1.5 py-1.5 print:text-black">Telefono</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-muted/60 print:bg-transparent"><td colSpan={6} className="px-1.5 py-1 font-bold border-y border-border print:border-black">Officer di Club da Statuto LCI</td></tr>
            <NomineRows rows={f.rowsStatuto} />
            <tr className="bg-muted/60 print:bg-transparent"><td colSpan={6} className="px-1.5 py-1 font-bold border-y border-border print:border-black">Altre posizioni nominabili nel Consiglio Direttivo</td></tr>
            <NomineRows rows={f.rowsAltre} />
            {f.rowsAltri.length > 0 && (
              <>
                <tr className="bg-muted/60 print:bg-transparent"><td colSpan={6} className="px-1.5 py-1 font-bold border-y border-border print:border-black">Altri incarichi (fuori dallo schema statutario)</td></tr>
                <NomineRows rows={f.rowsAltri} />
              </>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground italic mt-1.5 print:text-black">
        L&apos;Immediato Past Presidente è compilato in automatico con il Presidente del club dell&apos;anno sociale {f.pastAnnoLabel} (regola statutaria LCI).
      </p>

      {/* Sez. 3 - Attività */}
      <SezioneTitolo n="Mod. 2 - Sez. 3" title={`Attività degli anni sociali ${anniLabel} — Amministrazione vs Service`} newPage />
      <div className="mb-3"><TotaliBox label="Totali complessivi (Service + Amministrazione)" t={f.totComplessivi} accent /></div>
      <div className="mb-2"><TotaliBox label="Subtotale Service" t={f.totService} /></div>
      <div className="mb-4"><AttivitaTable rows={f.service} label="Service" color="border-emerald-400" /></div>
      <div className="mb-2"><TotaliBox label="Subtotale Amministrazione" t={f.totAmm} /></div>
      <div className="mb-2"><AttivitaTable rows={f.amministrazione} label="Amministrazione" color="border-amber-400" /></div>
      </div>
    </section>
  )
}

export default function FascicoliPage() {
  const [clubs, setClubs] = useState<string[]>([])
  const [zoneMap, setZoneMap] = useState<Record<string, string>>({})
  const [circMap, setCircMap] = useState<Record<string, string>>({})
  const [zone, setZone] = useState<string[]>([])
  const [circoscrizioni, setCircoscrizioni] = useState<string[]>([])

  const [filtroClub, setFiltroClub] = useState<string[]>([])
  const [filtroZona, setFiltroZona] = useState<string[]>([])
  const [filtroCirc, setFiltroCirc] = useState<string[]>([])
  const [filtroDistretto, setFiltroDistretto] = useState<string[]>([])

  const anniOpzioni = useMemo(() => getAnniSociali(), [])
  const [anniSociali, setAnniSociali] = useState<number[]>([getCurrentAnnoSocialeStart() - 1])

  const [fascicoli, setFascicoli] = useState<FascicoloClub[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadClubs()
  }, [])

  async function loadClubs() {
    const { data } = await supabase.from('club').select('nome_club, zona, circoscrizione').range(0, 9999)
    if (data) {
      setClubs([...new Set(data.map((c) => c.nome_club))].filter(Boolean).sort() as string[])
      setZone([...new Set(data.map((c) => c.zona))].filter(Boolean).sort() as string[])
      setCircoscrizioni([...new Set(data.map((c) => c.circoscrizione))].filter(Boolean).sort() as string[])
      const zm: Record<string, string> = {}
      const cm: Record<string, string> = {}
      data.forEach((c) => { if (c.nome_club) { zm[c.nome_club] = c.zona; cm[c.nome_club] = c.circoscrizione } })
      setZoneMap(zm); setCircMap(cm)
    }
  }

  // Risolve la selezione territoriale in un elenco di nomi club (ordine alfabetico).
  const clubSelezionati = useMemo(() => {
    if (filtroDistretto.length > 0) return clubs
    const set = new Set<string>()
    filtroClub.forEach((c) => set.add(c))
    if (filtroZona.length) clubs.forEach((c) => { if (filtroZona.includes(zoneMap[c])) set.add(c) })
    if (filtroCirc.length) clubs.forEach((c) => { if (filtroCirc.includes(circMap[c])) set.add(c) })
    return [...set].sort((a, b) => a.localeCompare(b, 'it'))
  }, [filtroClub, filtroZona, filtroCirc, filtroDistretto, clubs, zoneMap, circMap])

  // Se cambiano i filtri (club/zone/circoscrizioni/distretto o anni) dopo aver
  // generato, svuoto i fascicoli mostrati: così è chiaro che vanno rigenerati
  // con "Genera fascicoli" e non si guardano dati vecchi.
  useEffect(() => {
    setFascicoli([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubSelezionati.join('|'), anniSociali.join(',')])

  async function genera() {
    if (clubSelezionati.length === 0) { setFascicoli([]); return }
    setLoading(true); setError(null)
    try {
      const res = await buildFascicoli(clubSelezionati, anniSociali)
      setFascicoli(res)
    } catch {
      setError('Errore nella generazione dei fascicoli. Riprova.')
    }
    setLoading(false)
  }

  const annoRif = anniSociali.length ? Math.max(...anniSociali) : getCurrentAnnoSocialeStart() - 1
  const anniLabel = anniSociali.length
    ? [...anniSociali].sort((a, b) => a - b).map((y) => getAnnoSocialeRange(y).label).join(', ')
    : '—'
  const annoNomine = getAnnoSocialeRange(annoRif + 1).label

  // Stampa di UN SINGOLO club come PDF a sé (servono 93 file distinti, uno per
  // email). Isola il club scelto (renderizzo solo quello), imposto il nome file
  // suggerito e apro "Salva come PDF"; a stampa finita ripristino vista e titolo.
  const [printClub, setPrintClub] = useState<string | null>(null)
  useEffect(() => {
    if (!printClub) return
    const prevTitle = document.title
    document.title = `Fascicolo - ${printClub}`
    const done = () => { document.title = prevTitle; setPrintClub(null) }
    window.addEventListener('afterprint', done, { once: true })
    const t = setTimeout(() => window.print(), 80)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done) }
  }, [printClub])

  if (!isClient) return null

  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8 print-area">
      <motion.div variants={itemVariants} className="mb-4 print-hide">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna alla Dashboard
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2 flex-wrap print-hide">
        <Button onClick={genera} size="sm" className="text-xs gap-1.5" disabled={clubSelezionati.length === 0 || loading}>
          <FolderOpen className="h-3.5 w-3.5" /> Genera fascicoli ({clubSelezionati.length})
        </Button>
        <Button variant="outline" onClick={() => window.print()} size="sm" className="text-xs gap-1.5" disabled={fascicoli.length === 0}>
          <Printer className="h-3.5 w-3.5" /> Stampa tutti (unico PDF)
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6 print-hide">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Club (selezione multipla)</p>
                <MultiSelect options={clubs} selected={filtroClub} onChange={setFiltroClub} placeholder="Seleziona club…" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Zone</p>
                <MultiSelect options={zone} selected={filtroZona} onChange={setFiltroZona} placeholder="Tutte le zone" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure Circoscrizioni</p>
                <MultiSelect options={circoscrizioni} selected={filtroCirc} onChange={setFiltroCirc} placeholder="Tutte le circoscrizioni" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Oppure tutto il Distretto</p>
                <MultiSelect options={['108 LA']} selected={filtroDistretto} onChange={setFiltroDistretto} placeholder="108 LA" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Anno sociale (uno o più)</p>
                <MultiSelect
                  options={anniOpzioni.map((a) => a.label)}
                  selected={[...anniSociali].sort((a, b) => b - a).map((y) => getAnnoSocialeRange(y).label)}
                  onChange={(labels) => setAnniSociali(labels.map((l) => anniOpzioni.find((a) => a.label === l)!.value))}
                  placeholder="Anno sociale"
                />
              </div>
              <div className="flex items-end">
                <p className="text-[10px] text-muted-foreground italic">
                  La Sez. 3 (Attività) copre gli anni selezionati <strong>{anniLabel}</strong>. Le Nomine si riferiscono all&apos;anno in corso <strong>{annoNomine}</strong> (anno più recente selezionato + 1).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {error ? (
        <div className="flex justify-center items-center h-32 text-destructive text-sm">{error}</div>
      ) : loading ? (
        <div className="flex justify-center items-center h-40">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : fascicoli.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-40 gap-2 text-muted-foreground print-hide">
          <FolderOpen className="w-10 h-10 opacity-30" />
          <span className="text-sm">Seleziona uno o più club e premi «Genera fascicoli»</span>
        </div>
      ) : (
        <div>
          {(printClub ? fascicoli.filter((f) => f.club === printClub) : fascicoli).map((f, i) => (
            <div key={f.club}>
              <div className="mb-3 print-hide">
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setPrintClub(f.club)}>
                  <Printer className="h-3.5 w-3.5" /> Scarica PDF — {f.club}
                </Button>
              </div>
              <FascicoloBlock f={f} zona={zoneMap[f.club] ?? ''} anniLabel={anniLabel} annoNomine={annoNomine} primo={printClub ? true : i === 0} />
            </div>
          ))}
        </div>
      )}
    </motion.main>
  )
}
