// Utility per serializzare/deserializzare i filtri di una pagina nell'URL
// così la route di stampa può ricevere esattamente gli stessi filtri
// applicati dalla pagina elenco.
//
// I valori sono memorizzati come URLSearchParams piatti:
//   - stringhe: ?search=mario
//   - array di stringhe: ?zona=F&zona=L  (chiave ripetuta)
//   - boolean (es. 'true'/'false'/''): ?rapportoCompleto=true
//
// Le chiavi vuote/0/array vuoti NON vengono incluse, così l'URL resta
// pulito e si vede al volo cosa è attivo.

export type FilterValue = string | string[] | number | boolean | null | undefined

export function filtersToSearchParams(filters: Record<string, FilterValue>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) continue
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v !== '' && v != null) params.append(key, String(v))
      }
    } else if (typeof value === 'boolean') {
      if (value) params.set(key, 'true')
    } else if (value !== '' && value !== 0) {
      params.set(key, String(value))
    }
  }
  return params
}

export function filtersToQueryString(filters: Record<string, FilterValue>): string {
  const params = filtersToSearchParams(filters)
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** Estrae un array di stringhe da una chiave ripetuta nell'URL */
export function getArray(params: URLSearchParams, key: string): string[] {
  return params.getAll(key).filter(Boolean)
}

/** Estrae una stringa o '' se mancante */
export function getString(params: URLSearchParams, key: string): string {
  return params.get(key) ?? ''
}

/** Mostra in italiano i filtri attivi (per intestazione di stampa) */
export function describeFilters(
  filters: Record<string, FilterValue>,
  labels: Record<string, string> = {},
): { key: string; label: string; value: string }[] {
  const out: { key: string; label: string; value: string }[] = []
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) continue
    const lbl = labels[key] ?? key
    if (Array.isArray(value)) {
      const cleaned = value.filter(v => v !== '' && v != null).map(String)
      if (cleaned.length > 0) out.push({ key, label: lbl, value: cleaned.join(', ') })
    } else if (typeof value === 'boolean') {
      if (value) out.push({ key, label: lbl, value: 'Sì' })
    } else if (value !== '' && value !== 0) {
      out.push({ key, label: lbl, value: String(value) })
    }
  }
  return out
}
