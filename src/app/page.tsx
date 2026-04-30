'use client'

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { GlowCard, PulseGlow, FloatingElement, FadeInUp, StaggerContainer } from "@/lib/mac-effects"
import { motion } from "framer-motion"

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: `${((i * 137.5) % 100).toFixed(1)}%`,
  top: `${((i * 97.3 + 23) % 100).toFixed(1)}%`,
  duration: 3 + (i % 5) * 0.5,
  delay: (i % 4) * 0.5,
  blue: i % 2 === 0,
}))

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
}

export default function Home() {
  const cards = [
    { href: "/dashboard", title: "Dashboard", desc: "Panoramica completa con grafici e statistiche", icon: "📊" },
    { href: "/soci", title: "Soci", desc: "Gestione anagrafica soci, ricerca e filtri avanzati", icon: "👥" },
    { href: "/attivita", title: "Attività", desc: "Report attività di servizio, fondi e ore volontariato", icon: "🎯" },
    { href: "/officer", title: "Officer", desc: "Gestione incarichi e ruoli nei club", icon: "⭐" },
  ]

  return (
    <motion.main 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden"
    >
      {/* Background effects */}
      <PulseGlow className="top-1/4 left-1/4 w-[600px] h-[600px]" />
      <PulseGlow className="bottom-1/4 right-1/4 w-[400px] h-[400px]" glowColor="#ffe500" />
      
      {/* Ambient particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: p.left,
            top: p.top,
            background: p.blue ? '#0055ff' : '#ffe500',
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}

      <StaggerContainer delay={0.1}>
        {/* Hero Title */}
        <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-16 relative z-10">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-primary via-[#0055ff] to-[#ffe500] bg-clip-text text-transparent">
              ServiceScore
            </span>
          </motion.h1>
          <motion.p 
            className="text-lg sm:text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Lions Club Distretto 108 LA
          </motion.p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl w-full relative z-10"
        >
          {cards.map((card, index) => (
            <FadeInUp key={card.href} delay={index * 0.1}>
              <GlowCard 
                glowColor={index === 0 ? "#0055ff" : index === 1 ? "#ffe500" : index === 2 ? "#ff0000" : "#0d0d0d"}
                className="h-full"
              >
                <Link href={card.href}>
                  <Card className="h-full p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02] bg-background/80 backdrop-blur-xl border border-border/50 hover:border-primary/30 group">
                    <FloatingElement>
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        {card.icon}
                      </div>
                    </FloatingElement>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                      {card.title}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {card.desc}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Vai alla sezione</span>
                      <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </div>
                  </Card>
                </Link>
              </GlowCard>
            </FadeInUp>
          ))}
        </motion.div>

        {/* Footer Info */}
        <motion.div variants={itemVariants} className="mt-12 sm:mt-20 text-center text-sm text-muted-foreground">
          <p>Progettato con Next.js + Supabase + Tailwind CSS</p>
          <motion.p
            className="mt-2 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            © {new Date().getFullYear()} ServiceScore - Lions Club 108 LA
          </motion.p>
        </motion.div>
      </StaggerContainer>
    </motion.main>
  )
}