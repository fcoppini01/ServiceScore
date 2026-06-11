// Utility per esportare dati in Excel (.xlsx) lato client.
// Usa la libreria SheetJS (xlsx). I file vengono scaricati dal browser
// con il nome passato dal chiamante (es. "soci_2026-06-11.xlsx").

import * as XLSX from 'xlsx'

export interface ExcelColumn<T> {
  header: string
  // accessor: estrae il valore dal record. Per default puoi passare la chiave.
  accessor: (row: T) => string | number | boolean | null | undefined
}

// Esporta un array di righe in Excel.
// - rows: i dati
// - columns: definizione colonne (header + accessor)
// - filename: nome del file (senza estensione)
// - sheetName: nome del foglio (max 31 caratteri per limite Excel)
export function exportToExcel<T>(
  rows: T[],
  columns: ExcelColumn<T>[],
  filename: string,
  sheetName: string = 'Dati'
) {
  // Costruisce gli oggetti riga con i nomi di header come chiavi
  // (json_to_sheet usa le chiavi come intestazioni).
  const data = rows.map(r => {
    const o: Record<string, string | number | boolean | null | undefined> = {}
    for (const c of columns) {
      o[c.header] = c.accessor(r)
    }
    return o
  })
  const ws = XLSX.utils.json_to_sheet(data, {
    header: columns.map(c => c.header),
  })

  // Imposta larghezza automatica delle colonne in base al contenuto
  // (max 60 per evitare colonne eccessivamente larghe).
  ws['!cols'] = columns.map(c => {
    const maxLen = Math.max(
      c.header.length,
      ...data.map(r => {
        const v = r[c.header]
        return v == null ? 0 : String(v).length
      })
    )
    return { wch: Math.min(60, maxLen + 2) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  XLSX.writeFile(wb, `${cleanName}.xlsx`)
}

// Helper: data ISO compatta per nomi file (es. "2026-06-11").
export function todayStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Helper: format data IT (es. "11/06/2026") da stringa ISO/Date/null.
export function fmtDateIT(d: string | Date | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
