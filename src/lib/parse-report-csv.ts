// Parser del file report.csv ufficiale Lions (export Salesforce), lato browser.
// Replica la logica del convertitore Python (Dati_Lions/convertitore_csv.py):
// - separatore ';', encoding ISO-8859-1 (da decodificare prima di chiamare qui)
// - mappatura per INDICE colonna (più robusta dei nomi, che hanno accenti/encoding)
// - numeri in formato europeo, date dd/mm/yyyy, booleani '1'/'0'
// Restituisce un array di oggetti pronti per la RPC fn_importa_report.

// Indici colonna nel CSV Lions (35 colonne) -> nostro schema (29 campi)
const IDX = {
  data_inizio: 0, data_conclusione: 1, rapporto_completo: 2, stato: 3, titolo: 4,
  descrizione: 5, livello_attivita: 6, causa: 7, tipo_progetto: 8, attivita_distintiva: 9,
  finanziata_lcif: 10, persone_servite: 11, persone_servite_limite: 12, totale_volontari: 13,
  totale_ore_servizio: 14, totale_ore_servizio_capped: 15, valuta_fondi_donati: 16,
  totale_fondi_donati: 17, fondi_donati_usd_capped: 18, donazione_lcif: 19,
  organizzazione_beneficiata: 20, valuta_fondi_raccolti: 21, totale_fondi_raccolti: 22,
  fondi_raccolti_usd_capped: 23, alberi_piantati: 24, creato_da: 25, id_attivita: 26,
  id_account_club: 30, nome_club_sponsor: 34,
} as const

const NUM_FIELDS = ['persone_servite', 'persone_servite_limite', 'totale_volontari', 'totale_ore_servizio',
  'totale_ore_servizio_capped', 'totale_fondi_donati', 'fondi_donati_usd_capped', 'donazione_lcif',
  'totale_fondi_raccolti', 'fondi_raccolti_usd_capped', 'alberi_piantati'] as const
const BOOL_FIELDS = ['rapporto_completo', 'attivita_distintiva', 'finanziata_lcif'] as const
const DATE_FIELDS = ['data_inizio', 'data_conclusione'] as const

// CSV parser che gestisce campi tra virgolette con a-capo interni e "" di escape
export function parseCsv(text: string, delim = ';'): string[][] {
  const rows: string[][] = []
  let field = '', row: string[] = [], inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === delim) { row.push(field); field = '' }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (ch === '\r') { /* ignora */ }
      else field += ch
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

// Numero in formato europeo -> number | null  (es. "1.234,56" -> 1234.56)
function pulisciNumero(v: string | undefined): number | null {
  if (v == null) return null
  let s = v.replace(/\s/g, '').replace(/€/g, '').trim()
  if (s === '') return null
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// "dd/mm/yyyy" -> "yyyy-mm-dd" | null
function pulisciData(v: string | undefined): string | null {
  if (!v) return null
  const t = v.trim()
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

// "1" -> true, "0" -> false, altro -> null
function pulisciBool(v: string | undefined): boolean | null {
  const t = (v ?? '').trim()
  return t === '1' ? true : t === '0' ? false : null
}

const txt = (v: string | undefined): string | null => {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}

export interface ParseResult {
  rows: Record<string, unknown>[]
  errori: string[]
  totale: number
}

// Converte il testo CSV (già decodificato ISO-8859-1) in righe pronte per fn_importa_report
export function parseReportCsv(text: string): ParseResult {
  const matrix = parseCsv(text, ';')
  const errori: string[] = []
  if (matrix.length < 2) {
    return { rows: [], errori: ['File vuoto o senza righe dati.'], totale: 0 }
  }
  // Controllo di sanità sull'header: deve avere abbastanza colonne
  const header = matrix[0]
  if (header.length < 35) {
    errori.push(`Attenzione: l'intestazione ha ${header.length} colonne invece delle 35 attese. Verifica che sia il file report.csv ufficiale Lions.`)
  }

  const rows: Record<string, unknown>[] = []
  for (let i = 1; i < matrix.length; i++) {
    const c = matrix[i]
    if (c.length < 35) continue // riga incompleta/vuota
    const id = txt(c[IDX.id_attivita])
    if (!id) continue // senza ID attività non è importabile

    const o: Record<string, unknown> = {
      id_attivita: id,
      id_account_club: txt(c[IDX.id_account_club]),
      nome_club_sponsor: txt(c[IDX.nome_club_sponsor]),
      titolo: txt(c[IDX.titolo]),
      descrizione: txt(c[IDX.descrizione]),
      stato: txt(c[IDX.stato]),
      livello_attivita: txt(c[IDX.livello_attivita]),
      causa: txt(c[IDX.causa]),
      tipo_progetto: txt(c[IDX.tipo_progetto]),
      organizzazione_beneficiata: txt(c[IDX.organizzazione_beneficiata]),
      valuta_fondi_donati: txt(c[IDX.valuta_fondi_donati]),
      valuta_fondi_raccolti: txt(c[IDX.valuta_fondi_raccolti]),
      creato_da: txt(c[IDX.creato_da]),
    }
    for (const f of DATE_FIELDS) o[f] = pulisciData(c[IDX[f]])
    for (const f of BOOL_FIELDS) o[f] = pulisciBool(c[IDX[f]])
    for (const f of NUM_FIELDS) o[f] = pulisciNumero(c[IDX[f]])
    rows.push(o)
  }
  return { rows, errori, totale: rows.length }
}
