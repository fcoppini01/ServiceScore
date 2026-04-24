import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function SociPage() {
  const { data: soci } = await supabase
    .from('vista_soci_ricerca')
    .select('*')
    .limit(50)

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Gestione Soci</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Elenco Soci ({soci?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cognome</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Fascia Età</TableHead>
                <TableHead>Anzianità</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {soci?.map((socio: any) => (
                <TableRow key={socio.matricola_socio}>
                  <TableCell>{socio.nome}</TableCell>
                  <TableCell>{socio.cognome}</TableCell>
                  <TableCell>{socio.nome_club}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{socio.club_zona}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{socio.fascia_eta}</Badge>
                  </TableCell>
                  <TableCell>{socio.anzianita_lionistica} anni</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
