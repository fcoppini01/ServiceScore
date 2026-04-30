'use client'

import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { GlowCard, PulseGlow, FadeInUp, StaggerContainer } from "@/lib/mac-effects"
import { motion } from "framer-motion"
import { LayoutDashboard, Users, Target, ShieldCheck } from "lucide-react"

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

const cards = [
  {
    href: "/dashboard",
    title: "Dashboard",
    desc: "Panoramica completa con grafici e statistiche",
    Icon: LayoutDashboard,
    color: "#0055ff",
    bg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    href: "/soci",
    title: "Soci",
    desc: "Gestione anagrafica soci, ricerca e filtri avanzati",
    Icon: Users,
    color: "#ffe500",
    bg: "bg-yellow-400/10",
    iconColor: "text-yellow-400",
  },
  {
    href: "/attivita",
    title: "Attività",
    desc: "Report attività di servizio, fondi e ore volontariato",
    Icon: Target,
    color: "#ff4444",
    bg: "bg-red-400/10",
    iconColor: "text-red-400",
  },
  {
    href: "/officer",
    title: "Officer",
    desc: "Gestione incarichi e ruoli nei club",
    Icon: ShieldCheck,
    color: "#6366f1",
    bg: "bg-indigo-400/10",
    iconColor: "text-indigo-400",
  },
]

export default function Home() {
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
          animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      ))}

      <StaggerContainer delay={0.1}>
        {/* Hero */}
        <motion.div variants={itemVariants} className="text-center mb-10 sm:mb-16 relative z-10">
          {/* Lions logo */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 150, delay: 0.1 }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
              <Image
                src="/logo_ufficiale.png"
                alt="Lions Club"
                width={80}
                height={80}
                className="relative drop-shadow-lg"
              />
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-6xl md:text-7xl font-bold mb-3 tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-[#0055ff] via-white to-[#ffe500] bg-clip-text text-transparent">
              ServiceScore
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground font-medium tracking-wide uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Lions Club · Distretto 108 LA
          </motion.p>

          <motion.div
            className="mt-3 flex justify-center"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary to-transparent" />
          </motion.div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-5xl w-full relative z-10"
        >
          {cards.map((card, index) => (
            <FadeInUp key={card.href} delay={index * 0.08}>
              <GlowCard glowColor={card.color} className="h-full">
                <Link href={card.href}>
                  <Card className="h-full p-5 sm:p-6 transition-all duration-300 hover:scale-[1.03] bg-background/70 backdrop-blur-xl border border-border/40 hover:border-primary/40 group cursor-pointer">
                    {/* Icon container */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${card.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <card.Icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>

                    <h2 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {card.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {card.desc}
                    </p>

                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-0 group-hover:translate-x-1">
                      <span>Vai alla sezione</span>
                      <span>→</span>
                    </div>
                  </Card>
                </Link>
              </GlowCard>
            </FadeInUp>
          ))}
        </motion.div>

        {/* Footer info */}
        <motion.div variants={itemVariants} className="mt-14 sm:mt-20 text-center text-sm text-muted-foreground/60">
          <p className="text-xs">Progettato con Next.js · Supabase · Tailwind CSS</p>
          <p className="mt-1 text-xs">
            © {new Date().getFullYear()} ServiceScore — Lions Club Distretto 108 LA
          </p>
        </motion.div>
      </StaggerContainer>
    </motion.main>
  )
}
