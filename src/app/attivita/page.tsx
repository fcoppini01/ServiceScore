import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function AttivitaPage() {
  const { data: attivita } = await supabase
    .from('vista_report_ricerca')
    .select('*')
    .limit(50)

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Attività di Servizio</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Elenco Attività ({attivita?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Persone Servite</TableHead>
                <TableHead>Ore Servizio</TableHead>
                <TableHead>Fondi Raccolti</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attivita?.map((att: any) => (
                <TableRow key={att.id_attivita}>
                  <TableCell className="font-medium">{att.titolo}</TableCell>
                  <TableCell>{att.sponsor_nome_account}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{att.sponsor_zona}</Badge>
                  </TableCell>
                  <TableCell>{att.persone_servite}</TableCell>
                  <TableCell>{att.totale_ore_servizio}</TableCell>
                  <TableCell>€ {att.totale_fondi_raccolti}</TableCell>
                  <TableCell>
                    <Badge variant={att.stato === 'Completato' ? 'default' : 'secondary'}>
                      {att.stato}
                    </Badge>
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
