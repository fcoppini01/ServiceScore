import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">
          ServiceScore - Lions Club 108 LA
        </h1>
        <p className="text-xl text-center mb-12 text-gray-600">
          Sistema gestionale per il monitoraggio delle attività di servizio
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/soci">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-2xl font-semibold mb-3">Soci</h2>
              <p className="text-gray-600 mb-4">
                Gestione anagrafica soci, ricerca e filtri avanzati
              </p>
              <Button className="w-full">Accedi</Button>
            </Card>
          </Link>

          <Link href="/attivita">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-2xl font-semibold mb-3">Attività</h2>
              <p className="text-gray-600 mb-4">
                Report attività di servizio, fondi e ore volontariato
              </p>
              <Button className="w-full">Accedi</Button>
            </Card>
          </Link>

          <Link href="/officer">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-2xl font-semibold mb-3">Officer</h2>
              <p className="text-gray-600 mb-4">
                Gestione incarichi e ruoli nei club
              </p>
              <Button className="w-full">Accedi</Button>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  )
}
