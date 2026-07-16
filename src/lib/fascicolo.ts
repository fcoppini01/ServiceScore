// Logica del "Fascicolo per Club" (Mod. 2).
// Un fascicolo raccoglie, per un singolo club, le sezioni del modello del Direttivo:
//   Sez. 1 - Composizione (età, anzianità lionistica, genere)  [anno concluso / foto attuale]
//   Sez. 1 - Categorie associative (elenco soci per classificazione)
//   Sez. 2 - Nomine (Ruoli di leadership del club)              [anno in corso]
//   Sez. 4 - Attività (Amministrazione vs Service)             [anno concluso]
//   Sez. 1 - Riepilogo attività ultimo triennio                [3 anni conclusi]
//
// Tutta la logica di query e calcolo vive qui: le pagine si limitano a mostrare
// i dati. Le query caricano in blocco tutti i club selezionati (poche chiamate)
// e la ripartizione per club avviene in memoria.

import { supabase } from '@/lib/supabase'
import { getAnnoSocialeRange } from '@/lib/anno-sociale'

export const AMMINISTRAZIONE_CAUSA = 'Amministrazione'

// ---- Fasce (identiche al prospetto Composizione) ------------------------
export const FASCE_ETA = [
  { label: 'Under 50', test: (e: number) => e < 50 },
  { label: '50-60',    test: (e: number) => e >= 50 && e <= 60 },
  { label: '60-70',    test: (e: number) => e > 60 && e <= 70 },
  { label: 'Over 70',  test: (e: number) => e > 70 },
]

export const FASCE_ANZ = [
  { label: 'Under 2', test: (a: number) => a < 2 },
  { label: '2-5',     test: (a: number) => a >= 2 && a <= 5 },
  { label: '5-10',    test: (a: number) => a > 5 && a <= 10 },
  { label: '10-15',   test: (a: number) => a > 10 && a <= 15 },
  { label: '15-20',   test: (a: number) => a > 15 && a <= 20 },
  { label: 'Over 20', test: (a: number) => a > 20 },
]

export const FASCE_SESSO = [
  { label: 'Uomini',       test: (s: string) => s === 'Maschio' },
  { label: 'Donne',        test: (s: string) => s === 'Femmina' },
  { label: 'Altro / N.D.', test: (s: string) => s !== 'Maschio' && s !== 'Femmina' },
]

// ---- Ruoli statutari (identici al prospetto Ruoli di Leadership) --------
export type RoleDef = { label: string; match: string[] }

export const GRUPPO_STATUTO: RoleDef[] = [
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

export const GRUPPO_ALTRE: RoleDef[] = [
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

export function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// ---- Tipi -------------------------------------------------------------
export type Fascia = { label: string; count: number }
export type Distribuzione = { fasce: Fascia[]; tot: number }

export type SocioCat = {
  cognome: string | null
  nome: string | null
  classificazione: string | null
  programma: string | null
  email: string | null
  telefono: string | null
}

export type Off = {
  id_incarico: unknown
  matricola_socio: string | null
  titolo_ufficiale: string | null
  nome: string | null
  cognome: string | null
  email: string | null
  telefono: string | null
}
export type RenderRow = { label: string; off: Off | null }

export type Totali = { attivita: number; persone: number; volontari: number; ore: number; donati: number; raccolti: number }

export type TriennioAnno = { annoStart: number; label: string; amm: number; service: number; donati: number; raccolti: number }

export type FascicoloClub = {
  club: string
  totSoci: number
  eta: Distribuzione
  anz: Distribuzione
  sesso: Distribuzione
  soci: SocioCat[]
  rowsStatuto: RenderRow[]
  rowsAltre: RenderRow[]
  rowsAltri: RenderRow[]
  pastAnnoLabel: string
  service: Record<string, unknown>[]
  amministrazione: Record<string, unknown>[]
  totService: Totali
  totAmm: Totali
  totComplessivi: Totali
  triennio: {
    anni: TriennioAnno[]
    mediaRaccolti: number
    mediaDonati: number
    pctCopertura: number   // copertura = raccolti / donati (quanto le raccolte coprono le donazioni)
    mediaAmm: number
    mediaService: number
  }
}

// ---- Helper di calcolo ------------------------------------------------
function distribuisci(valori: (number | null)[], fasce: { label: string; test: (v: number) => boolean }[]): Distribuzione {
  const fasceOut = fasce.map((f) => ({
    label: f.label,
    count: valori.filter((v) => v != null && f.test(Number(v))).length,
  }))
  return { fasce: fasceOut, tot: fasceOut.reduce((s, f) => s + f.count, 0) }
}

function distribuisciSesso(valori: (string | null)[]): Distribuzione {
  const fasceOut = FASCE_SESSO.map((f) => ({
    label: f.label,
    count: valori.filter((v) => f.test((v ?? '').trim())).length,
  }))
  return { fasce: fasceOut, tot: fasceOut.reduce((s, f) => s + f.count, 0) }
}

function sumTotali(rows: Record<string, unknown>[]): Totali {
  return rows.reduce<Totali>((acc, a) => ({
    attivita: acc.attivita + 1,
    persone: acc.persone + (Number(a.persone_servite_limite) || 0),
    volontari: acc.volontari + (Number(a.totale_volontari) || 0),
    ore: acc.ore + (Number(a.totale_ore_servizio_capped) || 0),
    donati: acc.donati + (Number(a.fondi_donati_usd_capped) || 0),
    raccolti: acc.raccolti + (Number(a.fondi_raccolti_usd_capped) || 0),
  }), { attivita: 0, persone: 0, volontari: 0, ore: 0, donati: 0, raccolti: 0 })
}

// Un incarico è attivo nell'anno sociale `year` se il mandato si sovrappone
// alla finestra dell'anno (stessa regola del prospetto Ruoli di Leadership).
function officerActiveIn(o: { data_inizio: string | null; data_conclusione: string | null }, year: number): boolean {
  const { from, to } = getAnnoSocialeRange(year)
  return (o.data_inizio == null || o.data_inizio <= to) && (o.data_conclusione == null || o.data_conclusione >= from)
}

function buildGroup(roles: RoleDef[], officers: Off[], usedIds: Set<unknown>): RenderRow[] {
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

/**
 * Costruisce i fascicoli per i club indicati.
 * @param clubs elenco nomi club (ordine alfabetico consigliato)
 * @param annoConclusoStart anno sociale concluso di riferimento (es. 2025 = 2025/26).
 *        Le Nomine usano l'anno in corso = annoConclusoStart + 1.
 *        Il triennio usa annoConclusoStart-2 .. annoConclusoStart.
 */
export async function buildFascicoli(clubs: string[], annoConclusoStart: number): Promise<FascicoloClub[]> {
  if (clubs.length === 0) return []

  const annoNomine = annoConclusoStart + 1
  const anniTriennio = [annoConclusoStart - 2, annoConclusoStart - 1, annoConclusoStart]

  // Finestra date per le attività = intero triennio (copre anche la Sez. 4).
  const attFrom = getAnnoSocialeRange(anniTriennio[0]).from
  const attTo = getAnnoSocialeRange(annoConclusoStart).to
  // Finestra officer = anno concluso (past president) .. anno in corso (nomine).
  const offFrom = getAnnoSocialeRange(annoConclusoStart).from
  const offTo = getAnnoSocialeRange(annoNomine).to

  // --- 3 query in blocco per tutti i club ---
  const [sociRes, offRes, attRes] = await Promise.all([
    supabase
      .from('vista_soci_ricerca')
      .select('nome_club, eta, anzianita_lionistica, sesso, cognome, nome, categoria_socio, programma, email_effettiva, telefono_cellulare')
      .in('nome_club', clubs)
      .range(0, 49999),
    supabase
      .from('vista_officer_ricerca')
      .select('nome_club, id_incarico, matricola_socio, titolo_ufficiale, nome, cognome, email, telefono, data_inizio, data_conclusione')
      .in('nome_club', clubs)
      .or(`data_inizio.is.null,data_inizio.lte.${offTo}`)
      .or(`data_conclusione.is.null,data_conclusione.gte.${offFrom}`)
      .range(0, 49999),
    supabase
      .from('vista_report_ricerca')
      .select('sponsor_nome_account, sponsor_circoscrizione, causa, data_inizio, stato, titolo, tipo_progetto, id_attivita, organizzazione_beneficiata, persone_servite_limite, totale_volontari, totale_ore_servizio_capped, fondi_donati_usd_capped, fondi_raccolti_usd_capped')
      .in('sponsor_nome_account', clubs)
      .gte('data_inizio', attFrom)
      .lte('data_inizio', attTo)
      .range(0, 49999),
  ])

  if (sociRes.error || offRes.error || attRes.error) {
    throw new Error('Errore nel caricamento dei dati del fascicolo.')
  }

  const sociAll = sociRes.data ?? []
  const offAll = offRes.data ?? []
  const attAll = attRes.data ?? []

  const { from: conclFrom, to: conclTo } = getAnnoSocialeRange(annoConclusoStart)

  return clubs.map((club) => {
    // --- Soci del club ---
    const sociClub = sociAll.filter((s) => s.nome_club === club)
    const eta = distribuisci(sociClub.map((s) => s.eta), FASCE_ETA)
    const anz = distribuisci(sociClub.map((s) => s.anzianita_lionistica), FASCE_ANZ)
    const sesso = distribuisciSesso(sociClub.map((s) => s.sesso))
    const soci: SocioCat[] = sociClub
      .map((s) => ({
        cognome: s.cognome,
        nome: s.nome,
        classificazione: s.categoria_socio,
        programma: s.programma,
        email: s.email_effettiva ?? null,
        telefono: s.telefono_cellulare ?? null,
      }))
      .sort((a, b) => (a.cognome ?? '').localeCompare(b.cognome ?? '', 'it') || (a.nome ?? '').localeCompare(b.nome ?? '', 'it'))

    // --- Nomine (anno in corso) + Immediato Past Presidente (anno concluso) ---
    const offClub = offAll.filter((o) => o.nome_club === club)
    const officersNomine: Off[] = offClub
      .filter((o) => officerActiveIn(o, annoNomine))
      .map((o) => ({ id_incarico: o.id_incarico, matricola_socio: o.matricola_socio, titolo_ufficiale: o.titolo_ufficiale, nome: o.nome, cognome: o.cognome, email: o.email ?? null, telefono: o.telefono ?? null }))

    const presPrec = offClub.find((o) => officerActiveIn(o, annoConclusoStart) && norm(o.titolo_ufficiale) === 'presidente di club')
    const pastPresidente: Off | null = presPrec
      ? { id_incarico: `past-${presPrec.id_incarico}`, matricola_socio: presPrec.matricola_socio, titolo_ufficiale: presPrec.titolo_ufficiale, nome: presPrec.nome, cognome: presPrec.cognome, email: presPrec.email ?? null, telefono: presPrec.telefono ?? null }
      : null

    const used = new Set<unknown>()
    const rowsStatuto = buildGroup(GRUPPO_STATUTO, officersNomine, used).map((r) =>
      r.label === 'Immediato Past Presidente' && !r.off && pastPresidente ? { ...r, off: pastPresidente } : r
    )
    const rowsAltre = buildGroup(GRUPPO_ALTRE, officersNomine, used)
    const rowsAltri: RenderRow[] = officersNomine
      .filter((o) => !used.has(o.id_incarico))
      .map((o) => ({ label: o.titolo_ufficiale ?? '—', off: o }))

    // --- Attività anno concluso (Sez. 4) ---
    const attClub = attAll.filter((a) => a.sponsor_nome_account === club)
    const attConcluso = attClub
      .filter((a) => a.data_inizio != null && a.data_inizio >= conclFrom && a.data_inizio <= conclTo)
      .sort((a, b) => String(a.data_inizio).localeCompare(String(b.data_inizio)))
    const service = attConcluso.filter((a) => a.causa !== AMMINISTRAZIONE_CAUSA)
    const amministrazione = attConcluso.filter((a) => a.causa === AMMINISTRAZIONE_CAUSA)

    // --- Triennio ---
    const anni: TriennioAnno[] = anniTriennio.map((y) => {
      const { from, to, label } = getAnnoSocialeRange(y)
      const rows = attClub.filter((a) => a.data_inizio != null && a.data_inizio >= from && a.data_inizio <= to)
      const amm = rows.filter((a) => a.causa === AMMINISTRAZIONE_CAUSA).length
      const svc = rows.length - amm
      const t = sumTotali(rows)
      return { annoStart: y, label, amm, service: svc, donati: t.donati, raccolti: t.raccolti }
    })
    const nAnni = anni.length || 1
    const mediaRaccolti = anni.reduce((s, a) => s + a.raccolti, 0) / nAnni
    const mediaDonati = anni.reduce((s, a) => s + a.donati, 0) / nAnni
    const mediaAmm = anni.reduce((s, a) => s + a.amm, 0) / nAnni
    const mediaService = anni.reduce((s, a) => s + a.service, 0) / nAnni

    return {
      club,
      totSoci: sociClub.length,
      eta, anz, sesso, soci,
      rowsStatuto, rowsAltre, rowsAltri,
      pastAnnoLabel: getAnnoSocialeRange(annoConclusoStart).label,
      service, amministrazione,
      totService: sumTotali(service),
      totAmm: sumTotali(amministrazione),
      totComplessivi: sumTotali(attConcluso),
      triennio: {
        anni,
        mediaRaccolti,
        mediaDonati,
        pctCopertura: mediaDonati > 0 ? (mediaRaccolti / mediaDonati) * 100 : 0,
        mediaAmm,
        mediaService,
      },
    }
  })
}
