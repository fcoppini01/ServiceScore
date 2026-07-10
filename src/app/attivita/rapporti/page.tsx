'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, FileText, Briefcase, Activity } from 'lucide-react'

// Pagina indice dei Rapporti Attività: raggruppa le classificazioni stampabili
// per la sezione Attività. Sostituisce la lista "Quadri di Stampa" che era
// nella prima pagina di /attivita.
const RAPPORTI = [
  {
    href: '/attivita/quadri/club-anno',
    title: 'Classificazione delle Attività comunicate dal club nell’anno sociale',
    desc: 'Elenco completo delle attività con il complessivo (persone, volontari, ore, fondi) in cima alla tabella. Selezione multipla club o per zona.',
    icon: FileText,
    color: 'text-blue-600',
  },
  {
    href: '/attivita/quadri/club-anno-amm-service',
    title: 'Classificazione Amministrazione vs Service — Dettagliato',
    desc: 'Le stesse attività divise in due gruppi: Amministrazione (riunioni, direttivi) e Service (servizio alla comunità), con l’elenco completo, subtotali per ciascuno e totali complessivi.',
    icon: Briefcase,
    color: 'text-amber-600',
  },
  {
    href: '/attivita/quadri/amm-service-totali',
    title: 'Classificazione Amministrazione vs Service — Totalizzato',
    desc: 'Solo i numeri: totale complessivo e subtotali Service / Amministrazione, senza l’elenco delle attività. Utile per una sintesi rapida da stampare.',
    icon: Briefcase,
    color: 'text-amber-600',
  },
  {
    href: '/attivita/quadri/sintesi-club',
    title: 'Sintesi Attività per Club — Amministrazione vs Service',
    desc: 'Prospetto a incrocio: per la selezione mostra Totale / Amministrazione / Service con attività, persone servite, volontari e ore (numeri e percentuali). Filtri per club, zona, circoscrizione, Distretto e anno sociale.',
    icon: Activity,
    color: 'text-orange-600',
  },
]

export default function RapportiAttivitaPage() {
  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.div variants={itemVariants} className="mb-4">
        <Link href="/attivita">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna ad Attività
          </Button>
        </Link>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Rapporti Attività
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Classificazioni stampabili delle attività di servizio. Tutti i numeri usano i valori capped/limite massimo come nei report ufficiali LCI.
      </motion.p>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RAPPORTI.map(r => {
          const Icon = r.icon
          return (
            <Link key={r.href} href={r.href} className="group">
              <Card className="h-full border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-200 bg-card/50 backdrop-blur-sm cursor-pointer">
                <CardHeader className="pb-3">
                  <Icon className={`h-6 w-6 mb-2 ${r.color} group-hover:scale-110 transition-transform`} />
                  <CardTitle className="text-base font-semibold leading-tight">{r.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </motion.div>
    </motion.main>
  )
}
