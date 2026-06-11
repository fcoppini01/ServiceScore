'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Calendar, Award, FileText } from 'lucide-react'

// Pagina indice dei Rapporti Soci: raggruppa le classificazioni stampabili
// per la sezione Soci. Sostituisce i vecchi "Quadri di Riordino" che erano
// sparpagliati nella pagina principale e nel menu.
const RAPPORTI = [
  {
    href: '/soci/quadri/eta',
    title: 'Classificazione per fasce di età',
    desc: 'Soci raggruppati per fasce d’età (Under 30 → Over 70), con possibilità di filtrare per club, zona, circoscrizione.',
    icon: Calendar,
    color: 'text-blue-600',
  },
  {
    href: '/soci/quadri/anzianita',
    title: 'Classificazione per anzianità lionistica',
    desc: 'Soci raggruppati per anni di anzianità lionistica (Under 2 → Over 20), allineata ai bucket della Dashboard.',
    icon: Award,
    color: 'text-amber-600',
  },
  {
    href: '/soci/quadri/caratteristiche',
    title: 'Classificazione per categoria associativa',
    desc: 'Soci con dettaglio di tipo associazione, categoria associativa e programma.',
    icon: FileText,
    color: 'text-emerald-600',
  },
]

export default function RapportiSociPage() {
  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.div variants={itemVariants} className="mb-4">
        <Link href="/soci">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Soci
          </Button>
        </Link>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Rapporti Soci
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Classificazioni stampabili dei soci del Distretto 108 LA. Ogni rapporto ha filtri territoriali (Club, Zona, Circoscrizione, Distretto) e pulsante di stampa / salvataggio PDF.
      </motion.p>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
