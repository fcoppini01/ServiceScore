'use client'

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Menu, X, ChevronDown, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type SubLink = { href: string; label: string }
type NavItem = { href: string; label: string; sublinks?: SubLink[] }

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    sublinks: [
      { href: "/dashboard", label: "Panoramica generale" },
    ],
  },
  {
    href: "/soci",
    label: "Soci",
    sublinks: [
      { href: "/soci", label: "Elenco Generale Soci" },
      { href: "/soci/rapporti", label: "Rapporti Soci" },
      { href: "/soci/quadri/composizione", label: "Composizione per Club" },
    ],
  },
  {
    href: "/attivita",
    label: "Attività",
    sublinks: [
      { href: "/attivita", label: "Storico Attività" },
      { href: "/attivita/rapporti", label: "Rapporti Attività" },
      { href: "/attivita/quadri/sintesi-club", label: "Sintesi Attività per Club" },
    ],
  },
  {
    href: "/officer",
    label: "Officer",
    sublinks: [
      { href: "/officer", label: "Elenco Officer" },
      { href: "/officer/rapporti", label: "Rapporti Officer" },
    ],
  },
  {
    href: "/sfida-leoni",
    label: "Sfida dei Leoni",
  },
]

function DesktopNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = pathname.startsWith(item.href)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  if (!item.sublinks || item.sublinks.length === 0) {
    return (
      <Link
        href={item.href}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        {item.label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full pt-2 z-50 min-w-[260px]"
          >
            <div className="rounded-xl border border-border/80 bg-card shadow-2xl overflow-hidden py-1.5">
              {item.sublinks.map(sl => (
                <Link
                  key={sl.href}
                  href={sl.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-foreground"
                >
                  {sl.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    checkUser()

    // Aggiorna l'header in tempo reale su login/logout/conferma email,
    // senza dover ricaricare la pagina (l'header sta nel layout e non si rimonta).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-14 items-center justify-between">
        {/* Brand + nav */}
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image
              src="/logo_ufficiale.png"
              alt="Lions Club"
              width={26}
              height={26}
              className="opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <span className="font-bold text-base text-primary group-hover:opacity-80 transition-opacity">
              DigitaLions
            </span>
          </Link>

          {/* Desktop nav — always visible */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <DesktopNavItem item={item} pathname={pathname} />
              </motion.div>
            ))}
          </nav>
        </motion.div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {!loading && (
            user ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2">
                <Link href="/revisione" className="hidden sm:inline-flex">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 hover:border-primary/40 hover:text-primary transition-colors">
                    <ShieldCheck className="h-3.5 w-3.5" /> Revisione
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-xs"
                >
                  Esci
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <Link href="/login" className="hidden sm:inline-flex">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-[#0055ff] hover:shadow-lg hover:shadow-primary/25 transition-all text-xs font-semibold">
                    Accedi
                  </Button>
                </Link>
              </motion.div>
            )
          )}
          <ThemeToggle />

          {/* Mobile menu button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <nav className="container flex flex-col py-3 space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
              {NAV_ITEMS.map((item, index) => {
                const isActive = pathname.startsWith(item.href)
                const expanded = mobileExpanded === item.href
                const hasSub = item.sublinks && item.sublinks.length > 0
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <div className="flex items-stretch gap-1">
                      <Link
                        href={item.href}
                        className={`flex-1 block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                          isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                      {hasSub && (
                        <button
                          type="button"
                          onClick={() => setMobileExpanded(expanded ? null : item.href)}
                          className={`px-3 rounded-lg transition-colors ${expanded ? "bg-muted" : "hover:bg-muted"}`}
                          aria-label={`Espandi ${item.label}`}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {expanded && hasSub && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden ml-3 mt-1 border-l-2 border-border/50"
                        >
                          <div className="py-1">
                            {item.sublinks!.map(sl => (
                              <Link
                                key={sl.href}
                                href={sl.href}
                                onClick={() => { setMobileMenuOpen(false); setMobileExpanded(null) }}
                                className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-r-lg"
                              >
                                {sl.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: NAV_ITEMS.length * 0.04 }}
                className="pt-2 mt-2 border-t border-border/30"
              >
                {!loading && (
                  user ? (
                    <div className="space-y-2">
                      <Link href="/revisione" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" /> Revisione
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                        className="w-full"
                      >
                        Esci
                      </Button>
                    </div>
                  ) : (
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full bg-gradient-to-r from-primary to-[#0055ff]">
                        Accedi
                      </Button>
                    </Link>
                  )
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
