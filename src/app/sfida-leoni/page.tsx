'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'
import { ArrowLeft, Trophy, Hammer } from 'lucide-react'

// Pagina "Sfida dei Leoni" — segnaposto. In futuro ospiterà la funzionalità
// vera e propria; per ora è un placeholder "in costruzione".
export default function SfidaLeoniPage() {
  return (
    <motion.main initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto p-4 sm:p-8">
      <motion.div variants={itemVariants} className="mb-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Torna alla Dashboard
          </Button>
        </Link>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-[#0055ff] bg-clip-text text-transparent flex items-center gap-2">
        <Trophy className="h-7 w-7 text-amber-500 shrink-0" /> Sfida dei Leoni
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
        La sezione dedicata alla Sfida dei Leoni.
      </motion.p>

      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center text-center gap-4 py-16">
            <div className="relative">
              <Hammer className="h-14 w-14 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold">Pagina in costruzione</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Questa sezione è in fase di sviluppo. Presto qui sarà possibile gestire la
              <strong className="text-foreground"> Sfida dei Leoni</strong>. Torna a trovarci a breve!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
