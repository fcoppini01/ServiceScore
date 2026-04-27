'use client'

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"
import { useEffect } from "react"

export function GlowCard({ children, className = "", glowColor = "#0055ff" }: { 
  children: React.ReactNode
  className?: string
  glowColor?: string
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const glowX = useTransform(x, [-0.5, 0.5], ["-50%", "50%"])
  const glowY = useTransform(y, [-0.5, 0.5], ["-50%", "50%"])
  const glowOpacity = useTransform(x, [-0.5, 0.5], [0.3, 0.8])
  
  const springConfig = { stiffness: 150, damping: 15 }
  const springX = useSpring(glowX, springConfig)
  const springY = useSpring(glowY, springConfig)
  const springOpacity = useSpring(glowOpacity, springConfig)

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - rect.left) / rect.width - 0.5)
        y.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      style={{
        perspective: 1000,
      }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${springX} ${springY}, ${glowColor}, transparent 40%)`,
          opacity: springOpacity,
          filter: "blur(40px)",
        }}
      />
      {/* Card */}
      <div className="relative">
        {children}
      </div>
    </motion.div>
  )
}

export function FloatingElement({ children, className = "" }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )
}

export function PulseGlow({ className = "", glowColor = "#0055ff" }: { 
  className?: string
  glowColor?: string 
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        filter: "blur(60px)",
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

export function MagneticButton({ children, className = "" }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.button
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  )
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ children, delay = 0.05 }: { 
  children: React.ReactNode
  delay?: number 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function FadeInUp({ children, delay = 0 }: { 
  children: React.ReactNode
  delay?: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 12,
        delay 
      }}
    >
      {children}
    </motion.div>
  )
}