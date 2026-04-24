import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg text-primary">
            01ServiceScore
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/soci" className="text-sm font-medium transition-colors hover:text-primary">
              Soci
            </Link>
            <Link href="/attivita" className="text-sm font-medium transition-colors hover:text-primary">
              Attività
            </Link>
            <Link href="/officer" className="text-sm font-medium transition-colors hover:text-primary">
              Officer
            </Link>
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
