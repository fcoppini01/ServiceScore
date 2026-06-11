'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

// Pagina indice dei Rapporti Officer: raggruppa le classificazioni stampabili
// per la sezione Officer.
const RAPPORTI = [
  {
    href: '/officer/quadri/incarichi-club',
    title: 'Classificazione incarichi con le nomine dai Club',
    desc: 'Elenco di tutti gli incarichi raggruppati per titolo ufficiale (Presidente, Segretario, Tesoriere, Direttore...), con possibilità di filtro per club, zona, circoscrizione e di limitare ai soli mandati attualmente in corso.',
    icon: ShieldCheck,
    color: 'text-blue-600',
  },
]

export default function RapportiOfficerPage() {
  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.div variants={itemVariants} className="mb-4">
        <Link href="/officer">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna a Officer
          </Button>
        </Link>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent">
        Rapporti Officer
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        Classificazioni stampabili degli incarichi nei club del Distretto 108 LA.
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
