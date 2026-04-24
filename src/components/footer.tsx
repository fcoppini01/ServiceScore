'use client'

import Image from "next/image"
import { motion } from "framer-motion"

export function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
      className="w-full border-t bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between py-6 px-4 sm:px-8 gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Powered by</span>
          <div className="relative group">
            <Image
              src="/logo_01informatica_retina.png"
              alt="01Informatica"
              width={140}
              height={40}
              className="transition-all duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a 
              href="https://www.lionsclub.it" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Lions Club Distretto 108 LA
            </a>
          </motion.div>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Image
              src="/logo_ufficiale.png"
              alt="Lions Logo"
              width={30}
              height={30}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </motion.div>
        </div>
      </div>
    </motion.footer>
  )
}
