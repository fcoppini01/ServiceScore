'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  searchable?: boolean
}

export function MultiSelect({
  options, selected, onChange, placeholder = 'Seleziona...', className, searchable = true
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between h-auto min-h-9 rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm ring-offset-background hover:bg-background/70 focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
          open && 'ring-1 ring-ring'
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1 text-left min-w-0">
          {selected.length === 0 ? (
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          ) : (
            selected.map(v => (
              <Badge key={v} variant="secondary" className="text-[10px] h-5 px-1.5 max-w-[120px] truncate">
                {v}
                <span
                  role="button"
                  className="ml-0.5 cursor-pointer hover:text-destructive shrink-0"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggle(v) }}
                >×</span>
              </Badge>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {selected.length > 0 && (
            <X
              className="h-3.5 w-3.5 opacity-40 hover:opacity-100 cursor-pointer"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange([]) }}
            />
          )}
          <ChevronDown className={cn('h-3.5 w-3.5 opacity-50 transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden">
          {searchable && options.length > 6 && (
            <div className="px-3 py-2 border-b border-border/50">
              <input
                type="text"
                placeholder="Cerca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">Nessun risultato</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted cursor-pointer text-left transition-colors"
                >
                  <div className={cn(
                    'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                    selected.includes(opt) ? 'bg-primary border-primary' : 'border-border'
                  )}>
                    {selected.includes(opt) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <span className="truncate">{opt}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
