'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { CheckCircle2, PauseCircle, XCircle, Save, ShieldCheck, LogIn } from 'lucide-react'

// Permessi risolti dal DB (fn_my_permissions)
type Perm = { ruolo: string; puo_scrivere: boolean; ambito_tipo: string | null; ambito_valore: string | null }

// Campi numerici che il revisore può correggere prima di approvare
const CAMPI_NUM = [
  { key: 'persone_servite_limite', label: 'Persone (limite)' },
  { key: 'totale_volontari', label: 'Volontari' },
  { key: 'totale_ore_servizio_capped', label: 'Ore (capped)' },
  { key: 'fondi_raccolti_usd_capped', label: 'Raccolti USD (capped)' },
] as const

const STATO_BADGE: Record<string, string> = {
  in_revisione: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  sospeso: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
}

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''

export default function RevisionePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [perm, setPerm] = useState<Perm | null>(null)
  const [rows, setRows] = useState<any[]>([])
  // correzioni locali per riga: { [id]: { campo: valore } }
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data: perms } = await supabase.rpc('fn_my_permissions')
      const p: Perm | null = Array.isArray(perms) ? perms[0] ?? null : (perms ?? null)
      setPerm(p)
      if (p?.puo_scrivere) await loadRows()
    }
    setLoading(false)
  }

  // Le RLS limitano già le righe al solo ambito del revisore
  async function loadRows() {
    const { data, error } = await supabase
      .from('attivita_report')
      .select('id_attivita, nome_club_sponsor, data_inizio, titolo, causa, tipo_progetto, persone_servite_limite, totale_volontari, totale_ore_servizio_capped, fondi_raccolti_usd_capped, stato_approvazione')
      .in('stato_approvazione', ['in_revisione', 'sospeso'])
      .order('data_inizio', { ascending: false })
      .range(0, 9999)
    if (!error) setRows(data ?? [])
  }

  const editValue = (row: any, campo: string) =>
    edits[row.id_attivita]?.[campo] ?? (row[campo] ?? '')

  const setEdit = (id: string, campo: string, val: string) =>
    setEdits(e => ({ ...e, [id]: { ...e[id], [campo]: val } }))

  const isDirty = (id: string) => !!edits[id] && Object.keys(edits[id]).length > 0

  // Salva le correzioni numeriche di una riga
  async function salvaCorrezioni(row: any) {
    const id = row.id_attivita
    const patch: Record<string, number | null> = {}
    for (const c of CAMPI_NUM) {
      const v = edits[id]?.[c.key]
      if (v !== undefined) patch[c.key] = v === '' ? null : Number(v)
    }
    if (Object.keys(patch).length === 0) return
    setBusy(id)
    const { error } = await supabase.from('attivita_report')
      .update({ ...patch, revisionato_da: user.email, revisionato_il: new Date().toISOString() })
      .eq('id_attivita', id)
    if (error) { setMsg('Errore nel salvataggio: ' + error.message) }
    else {
      setRows(rs => rs.map(r => r.id_attivita === id ? { ...r, ...patch } : r))
      setEdits(e => { const n = { ...e }; delete n[id]; return n })
      setMsg('Correzioni salvate ✓')
    }
    setBusy(null)
  }

  // Cambia stato di approvazione (3 pulsanti)
  async function cambiaStato(row: any, nuovo: 'approvato' | 'sospeso' | 'rifiutato') {
    const id = row.id_attivita
    setBusy(id)
    const { error } = await supabase.from('attivita_report')
      .update({ stato_approvazione: nuovo, revisionato_da: user.email, revisionato_il: new Date().toISOString() })
      .eq('id_attivita', id)
    if (error) { setMsg('Errore: ' + error.message); setBusy(null); return }
    // Approvato/Rifiutato escono dalla coda; Sospeso resta ma cambia badge
    if (nuovo === 'sospeso') setRows(rs => rs.map(r => r.id_attivita === id ? { ...r, stato_approvazione: 'sospeso' } : r))
    else setRows(rs => rs.filter(r => r.id_attivita !== id))
    setMsg(nuovo === 'approvato' ? 'Attività approvata ✓' : nuovo === 'rifiutato' ? 'Attività rifiutata' : 'Attività sospesa')
    setBusy(null)
  }

  if (loading) {
    return (
      <main className="container mx-auto p-8 flex justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
    )
  }

  // Non autenticato
  if (!user) {
    return (
      <main className="container mx-auto p-8 max-w-md">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="py-10 flex flex-col items-center gap-4">
            <LogIn className="h-10 w-10 text-primary opacity-70" />
            <p className="text-sm text-muted-foreground">Per accedere alla revisione devi prima effettuare l&apos;accesso.</p>
            <Link href="/login"><Button className="bg-gradient-to-r from-primary to-[#0055ff]">Accedi</Button></Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  // Autenticato ma senza permessi di scrittura (Presidente / Socio)
  if (!perm?.puo_scrivere) {
    return (
      <main className="container mx-auto p-8 max-w-lg">
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-amber-500 opacity-80" />
            <p className="font-semibold">Area riservata ai revisori</p>
            <p className="text-sm text-muted-foreground">
              Il tuo ruolo (<strong>{perm?.ruolo ?? 'non assegnato'}</strong>) è in sola lettura.
              L&apos;approvazione delle attività è riservata al Comitato GST e ai Super-Admin.
            </p>
            <Link href="/dashboard"><Button variant="outline" size="sm">Torna alla Dashboard</Button></Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  // Revisore (GST / Super-Admin)
  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Revisione Attività
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-2">
        Ruolo: <strong className="text-foreground">{perm.ruolo}</strong>
        {perm.ambito_tipo === 'circoscrizione' && <> · Ambito: <strong className="text-foreground">{perm.ambito_valore}ª circoscrizione</strong></>}
        {perm.ambito_tipo === 'distretto' && <> · Ambito: <strong className="text-foreground">tutto il Distretto</strong></>}
        {' '}· {rows.length} attività in coda
      </motion.p>
      <motion.p variants={itemVariants} className="text-xs text-muted-foreground mb-6">
        Correggi i valori se servono, poi scegli: <span className="text-green-600 font-medium">Approva</span> (validata e conteggiata),
        <span className="text-amber-600 font-medium"> Sospendi</span> (in attesa), <span className="text-red-600 font-medium">Rifiuta</span> (scartata, nascosta).
      </motion.p>

      {msg && (
        <motion.div variants={itemVariants} className="mb-4 text-sm px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
          {msg}
        </motion.div>
      )}

      {rows.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-green-500 opacity-70" />
              <p className="text-sm">Nessuna attività da revisionare nel tuo ambito. Tutto in ordine! 🎉</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {rows.map((row: any) => (
            <Card key={row.id_attivita} className="border border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="text-sm font-semibold leading-tight">{row.titolo}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.nome_club_sponsor} · {formatDate(row.data_inizio)} · {row.causa}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${STATO_BADGE[row.stato_approvazione] ?? ''}`}>
                    {row.stato_approvazione === 'sospeso' ? 'Sospeso' : 'In revisione'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Correzione valori */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CAMPI_NUM.map(c => (
                    <div key={c.key}>
                      <p className="text-[10px] text-muted-foreground mb-1">{c.label}</p>
                      <Input
                        type="number"
                        value={editValue(row, c.key)}
                        onChange={e => setEdit(row.id_attivita, c.key, e.target.value)}
                        className="h-8 text-sm bg-background/50"
                      />
                    </div>
                  ))}
                </div>

                {/* Azioni */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {isDirty(row.id_attivita) && (
                    <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={busy === row.id_attivita} onClick={() => salvaCorrezioni(row)}>
                      <Save className="h-3.5 w-3.5" /> Salva correzioni
                    </Button>
                  )}
                  <div className="flex-1" />
                  <Button size="sm" className="text-xs gap-1.5 bg-green-600 hover:bg-green-700" disabled={busy === row.id_attivita} onClick={() => cambiaStato(row, 'approvato')}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approva
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-400" disabled={busy === row.id_attivita} onClick={() => cambiaStato(row, 'sospeso')}>
                    <PauseCircle className="h-3.5 w-3.5" /> Sospendi
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 border-red-500/40 text-red-700 dark:text-red-400" disabled={busy === row.id_attivita} onClick={() => cambiaStato(row, 'rifiutato')}>
                    <XCircle className="h-3.5 w-3.5" /> Rifiuta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </motion.main>
  )
}
