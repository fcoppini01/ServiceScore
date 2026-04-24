'use client'

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-5xl w-full"
      >
        <motion.h1 
          variants={itemVariants}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-8 text-center bg-gradient-to-r from-primary via-[#0055ff] to-[#ffe500] bg-clip-text text-transparent"
        >
          ServiceScore - Lions Club 108 LA
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-lg sm:text-xl text-center mb-8 sm:mb-12 text-muted-foreground"
        >
          Sistema gestionale per il monitoraggio delle attività di servizio
        </motion.p>

        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
        >
          {[
            { href: "/soci", title: "Soci", description: "Gestione anagrafica soci, ricerca e filtri avanzati", icon: "👥" },
            { href: "/attivita", title: "Attività", description: "Report attività di servizio, fondi e ore volontariato", icon: "📊" },
            { href: "/officer", title: "Officer", description: "Gestione incarichi e ruoli nei club", icon: "⭐" },
          ].map((item, index) => (
            <motion.div key={item.href} variants={itemVariants} custom={index}>
              <Link href={item.href}>
                <Card className="p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-background to-muted/50">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">{item.title}</h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    {item.description}
                  </p>
                  <Button className="w-full bg-gradient-to-r from-primary to-[#0055ff] hover:from-[#0044cc] hover:to-[#0044cc] transition-all duration-300">
                    Accedi
                  </Button>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </main>
  )
}
