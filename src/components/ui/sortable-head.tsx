'use client'

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableHead } from '@/components/ui/table'

export type SortState = { field: string; dir: 'asc' | 'desc' } | null

interface SortableHeadProps {
  field: string
  label: string
  sort: SortState
  onSort: (field: string) => void
  className?: string
  align?: 'left' | 'right'
}

export function SortableHead({ field, label, sort, onSort, className, align = 'left' }: SortableHeadProps) {
  const active = sort?.field === field
  const dir = sort?.dir
  return (
    <TableHead className={cn('p-0', className)}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          'inline-flex items-center gap-1 px-2 h-9 w-full hover:bg-muted/50 transition-colors text-left font-medium select-none cursor-pointer',
          align === 'right' && 'justify-end',
          active && 'text-primary'
        )}
      >
        <span>{label}</span>
        {active
          ? (dir === 'asc'
              ? <ChevronUp className="h-3 w-3 shrink-0" />
              : <ChevronDown className="h-3 w-3 shrink-0" />)
          : <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-30" />
        }
      </button>
    </TableHead>
  )
}

export function nextSort(current: SortState, field: string, defaultDir: 'asc' | 'desc' = 'asc'): SortState {
  if (current?.field === field) {
    return { field, dir: current.dir === 'asc' ? 'desc' : 'asc' }
  }
  return { field, dir: defaultDir }
}

interface MobileSortSelectProps {
  options: { value: string; label: string }[]
  sort: SortState
  onChange: (sort: SortState) => void
  className?: string
}

export function MobileSortSelect({ options, sort, onChange, className }: MobileSortSelectProps) {
  const value = sort ? `${sort.field}:${sort.dir}` : ''
  return (
    <div className={cn('md:hidden flex items-center gap-2 text-xs mb-3', className)}>
      <span className="text-muted-foreground shrink-0">Ordina:</span>
      <select
        value={value}
        onChange={(e) => {
          if (!e.target.value) { onChange(null); return }
          const [field, dir] = e.target.value.split(':')
          onChange({ field, dir: dir as 'asc' | 'desc' })
        }}
        className="flex-1 h-8 px-2 text-xs rounded-md border border-input bg-background/50 outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
}
