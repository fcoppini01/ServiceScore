'use client'

import { motion } from "framer-motion"
import Image from "next/image"

export function Loading() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
    >
      {/* Glow effect - centered behind everything */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-[120px] h-[120px] bg-primary/20 rounded-full blur-xl"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />
      
      {/* Logo - centered */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
        className="relative z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Image
            src="/logo_ufficiale.png"
            alt="Lions Club Logo"
            width={100}
            height={100}
            className="drop-shadow-2xl"
            priority
          />
        </motion.div>
      </motion.div>

      {/* Loading spinner circolare */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute w-[140px] h-[140px] border-4 border-primary/20 border-t-primary rounded-full"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />
    </motion.div>
  )
}
