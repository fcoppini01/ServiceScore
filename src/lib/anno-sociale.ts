// Anno sociale Lions: 1 luglio → 30 giugno
// Esempio: oggi è 12 maggio 2026 → anno sociale 2025-2026 (iniziato 1 lug 2025)

export function getCurrentAnnoSocialeStart(): number {
  const now = new Date()
  const month = now.getMonth() // 0-indexed (0 = gennaio, 6 = luglio)
  const year = now.getFullYear()
  return month >= 6 ? year : year - 1
}

export function getAnnoSocialeRange(startYear: number): { from: string; to: string; label: string } {
  const endYear = startYear + 1
  return {
    from: `${startYear}-07-01`,
    to: `${endYear}-06-30`,
    label: `${startYear}/${String(endYear).slice(-2)}`,
  }
}

export function getRecentAnniSociali(count = 6): { value: number; label: string }[] {
  const current = getCurrentAnnoSocialeStart()
  return Array.from({ length: count }, (_, i) => {
    const start = current - i
    return { value: start, label: `${start}/${String(start + 1).slice(-2)}` }
  })
}
