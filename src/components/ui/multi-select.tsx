'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X, Search } from 'lucide-react'
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
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const showSearch = searchable && options.length > 6
    const estimatedH = Math.min(options.length * 38 + (showSearch ? 48 : 0) + 8, 260)
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < estimatedH && rect.top > estimatedH
      ? rect.top - estimatedH - 4
      : rect.bottom + 4
    setPos({ top, left: rect.left, width: rect.width })
  }, [options.length, searchable])

  useEffect(() => {
    if (!open) return
    const handleClose = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    const handleDismiss = () => { setOpen(false); setSearch('') }
    document.addEventListener('mousedown', handleClose)
    window.addEventListener('scroll', handleDismiss, true)
    window.addEventListener('resize', handleDismiss)
    return () => {
      document.removeEventListener('mousedown', handleClose)
      window.removeEventListener('scroll', handleDismiss, true)
      window.removeEventListener('resize', handleDismiss)
    }
  }, [open])

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  const handleToggleOpen = () => {
    if (open) { setOpen(false); setSearch(''); return }
    updatePos()
    setOpen(true)
  }

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  const showSearch = searchable && options.length > 6

  const dropdown = mounted && open ? createPortal(
    <div
      ref={dropdownRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: Math.max(pos.width, 200), zIndex: 9999 }}
      className="rounded-xl border border-border/80 bg-card shadow-2xl overflow-hidden"
    >
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/30">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Cerca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
      <div className="max-h-52 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Nessun risultato</p>
        ) : (
          filtered.map(opt => {
            const isSel = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                  isSel ? 'bg-primary/10 text-foreground font-medium' : 'hover:bg-muted/60 text-foreground'
                )}
              >
                <div className={cn(
                  'h-4 w-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all',
                  isSel ? 'bg-primary border-primary' : 'border-border'
                )}>
                  {isSel && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />}
                </div>
                <span className="truncate">{opt}</span>
              </button>
            )
          })
        )}
      </div>
      {selected.length > 0 && (
        <div className="border-t border-border/50 px-3 py-1.5 bg-muted/20">
          <button
            onClick={() => { onChange([]); setOpen(false); setSearch('') }}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Deseleziona tutti ({selected.length})
          </button>
        </div>
      )}
    </div>,
    document.body
  ) : null

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggleOpen}
        className={cn(
          'flex w-full items-center justify-between h-auto min-h-9 rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm hover:bg-background/70 focus:outline-none transition-colors',
          open && 'border-ring ring-1 ring-ring/30'
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1 text-left min-w-0">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map(v => (
              <Badge key={v} variant="secondary" className="text-[10px] h-5 px-1.5 max-w-[140px] truncate font-normal gap-0.5">
                {v}
                <span
                  role="button"
                  className="ml-0.5 cursor-pointer hover:text-destructive"
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
      {dropdown}
    </div>
  )
}
