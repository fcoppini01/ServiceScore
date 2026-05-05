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
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 260 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const showSearch = searchable && options.length > 6
    // Usa visualViewport se disponibile (tiene conto della tastiera mobile)
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    const viewportHeight = vv?.height ?? window.innerHeight
    const viewportTop = vv?.offsetTop ?? 0
    const visibleBottom = viewportTop + viewportHeight
    const estimatedH = Math.min(options.length * 38 + (showSearch ? 48 : 0) + 8, 320)
    const spaceBelow = visibleBottom - rect.bottom - 8
    const spaceAbove = rect.top - viewportTop - 8
    const openUp = spaceBelow < Math.min(estimatedH, 200) && spaceAbove > spaceBelow
    const maxHeight = Math.max(160, Math.min(estimatedH, openUp ? spaceAbove : spaceBelow))
    const top = openUp ? rect.top - maxHeight - 4 : rect.bottom + 4
    setPos({ top, left: rect.left, width: rect.width, maxHeight })
  }, [options.length, searchable])

  useEffect(() => {
    if (!open) return
    const isInsideDropdown = (target: EventTarget | null) =>
      dropdownRef.current && target instanceof Node && dropdownRef.current.contains(target)
    const isInsideTrigger = (target: EventTarget | null) =>
      triggerRef.current && target instanceof Node && triggerRef.current.contains(target)

    const handleClose = (e: MouseEvent | TouchEvent) => {
      if (!isInsideDropdown(e.target) && !isInsideTrigger(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    const handleScroll = (e: Event) => {
      // Ignora scroll interni al dropdown (rotella desktop, swipe mobile)
      if (isInsideDropdown(e.target)) return
      // Riposiziona invece di chiudere quando l'utente scrolla la pagina esterna
      updatePos()
    }
    // Riposiziona invece di chiudere su resize: su mobile la comparsa
    // della tastiera causa un resize del viewport e prima questo
    // chiudeva il dropdown immediatamente.
    const handleResize = () => updatePos()

    document.addEventListener('mousedown', handleClose)
    document.addEventListener('touchstart', handleClose, { passive: true })
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    // visualViewport e' piu' affidabile per detectare la tastiera
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      window.visualViewport.addEventListener('scroll', handleResize)
    }
    return () => {
      document.removeEventListener('mousedown', handleClose)
      document.removeEventListener('touchstart', handleClose)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
        window.visualViewport.removeEventListener('scroll', handleResize)
      }
    }
  }, [open, updatePos])

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
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: Math.max(pos.width, 200), maxHeight: pos.maxHeight, zIndex: 9999, touchAction: 'manipulation', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', display: 'flex', flexDirection: 'column' }}
      className="rounded-xl border border-border/80 bg-card shadow-2xl overflow-hidden"
    >
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/30 shrink-0">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Cerca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full" style={{ WebkitOverflowScrolling: 'touch' }}>
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
        <div className="border-t border-border/50 px-3 py-1.5 bg-muted/20 shrink-0">
          <button
            type="button"
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
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className={cn(
          'flex w-full items-center justify-between h-auto min-h-9 rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm hover:bg-background/70 focus:outline-none transition-colors select-none',
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
                  aria-label={`Rimuovi ${v}`}
                  className="ml-0.5 cursor-pointer hover:text-destructive px-1"
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(v) }}
                >×</span>
              </Badge>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {selected.length > 0 && (
            <span
              role="button"
              aria-label="Cancella tutti"
              className="cursor-pointer p-0.5"
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange([]) }}
            >
              <X className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
            </span>
          )}
          <ChevronDown className={cn('h-3.5 w-3.5 opacity-50 transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </button>
      {dropdown}
    </div>
  )
}
