import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function OfficerPage() {
  const { data: officer } = await supabase
    .from('vista_officer_ricerca')
    .select('*')
    .limit(50)

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Gestione Officer</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Elenco Incarichi ({officer?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cognome</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Incarico</TableHead>
                <TableHead>Data Inizio</TableHead>
                <TableHead>Data Conclusione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officer?.map((off: any) => (
                <TableRow key={off.id_incarico}>
                  <TableCell>{off.nome}</TableCell>
                  <TableCell>{off.cognome}</TableCell>
                  <TableCell>{off.nome_club}</TableCell>
                  <TableCell>
                    <Badge>{off.titolo_ufficiale}</Badge>
                  </TableCell>
                  <TableCell>{new Date(off.data_inizio).toLocaleDateString('it-IT')}</TableCell>
                  <TableCell>
                    {off.data_conclusione 
                      ? new Date(off.data_conclusione).toLocaleDateString('it-IT')
                      : 'In corso'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
