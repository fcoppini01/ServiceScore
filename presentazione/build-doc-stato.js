// Genera il documento Word "Digitalions — Stato attuale e roadmap utenti/autorizzazioni"
// Uso: node build-doc-stato.js
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TabStopType, TabStopPosition,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
} = require('docx');

// ---- Palette / costanti ----
const BLUE = '0A3D7A';      // blu scuro intestazioni
const BRAND = '0055FF';     // blu brand
const GOLD = 'C8A200';      // oro Lions (scuro, leggibile)
const GREY = '595959';
const LIGHT = 'F2F5FB';     // riga zebra
const HEADFILL = '0A3D7A';
const CW = 9026;            // larghezza contenuto A4 con margini 1 inch (DXA)
const DXA = WidthType.DXA;
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const cellBorders = { top: border, bottom: border, left: border, right: border };

// ---- Helpers ----
const run = (text, o = {}) => new TextRun({ text, ...o });

function p(text, o = {}) {
  const children = Array.isArray(text) ? text : [run(text, o.run || {})];
  return new Paragraph({
    children,
    spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 276 },
    alignment: o.align,
    border: o.border,
  });
}

const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(t)], spacing: { before: 320, after: 160 } });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run(t)], spacing: { before: 240, after: 120 } });
const h3 = (t, color) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [run(t, color ? { color } : {})], spacing: { before: 180, after: 80 } });

const bullet = (text, o = {}) => new Paragraph({
  numbering: { reference: 'bullets', level: o.level || 0 },
  children: Array.isArray(text) ? text : [run(text)],
  spacing: { after: 70, line: 270 },
});

function cellContent(c) {
  // c può essere: stringa, array di stringhe (più paragrafi), o array di Paragraph
  if (typeof c === 'string') return [new Paragraph({ children: [run(c)], spacing: { after: 0, line: 264 } })];
  if (Array.isArray(c) && c.length && c[0] instanceof Paragraph) return c;
  if (Array.isArray(c)) return c.map(s => new Paragraph({ children: [run(s)], spacing: { after: 0, line: 264 } }));
  return [new Paragraph({ children: [run(String(c))] })];
}

function cell(c, width, o = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: DXA },
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: cellContent(typeof c === 'string' && o.bold
      ? [new Paragraph({ children: [run(c, { bold: true, color: o.color })] })]
      : c),
  });
}

function makeTable(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((hh, i) => new TableCell({
      borders: cellBorders,
      width: { size: widths[i], type: DXA },
      shading: { fill: HEADFILL, type: ShadingType.CLEAR, color: 'auto' },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [run(hh, { bold: true, color: 'FFFFFF' })] })],
    })),
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? LIGHT : 'FFFFFF' })),
  }));
  return new Table({ width: { size: total, type: DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}

const spacer = (h = 120) => new Paragraph({ children: [], spacing: { after: h } });
const rule = (color = BRAND, size = 12) => new Paragraph({
  children: [], spacing: { before: 60, after: 160 },
  border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } },
});

// =====================================================================
// CONTENUTO
// =====================================================================
const titlePage = [
  spacer(2600),
  p([run('DOCUMENTO INTERNO  ·  DISTRETTO LIONS 108 LA', { bold: true, color: GREY, size: 18 })], { align: AlignmentType.CENTER, after: 200 }),
  p([run('Digitalions', { bold: true, color: BRAND, size: 76 })], { align: AlignmentType.CENTER, after: 80 }),
  p([run('La piattaforma digitale del Distretto', { color: BLUE, size: 30, bold: true })], { align: AlignmentType.CENTER, after: 40 }),
  p([run('Stato attuale e strade per la gestione di utenti e autorizzazioni', { color: GREY, size: 24 })], { align: AlignmentType.CENTER, after: 240 }),
  rule(GOLD, 18),
  p([run('digitalions108la.it', { color: BRAND, size: 22, bold: true })], { align: AlignmentType.CENTER, after: 40 }),
  p([run('8 giugno 2026  ·  versione 1.0', { color: GREY, size: 20 })], { align: AlignmentType.CENTER, after: 320 }),
  p([run('“We Serve.” Anche digitalmente.', { italics: true, color: BLUE, size: 24 })], { align: AlignmentType.CENTER }),
  new Paragraph({ children: [new PageBreak()] }),
];

const indice = [
  h1('In questo documento'),
  bullet([run('1.  In sintesi', { bold: true })]),
  bullet([run('2.  Cosa fa oggi la piattaforma', { bold: true })]),
  bullet([run('3.  I numeri gestiti', { bold: true })]),
  bullet([run('4.  Cosa non è ancora attivo (e perché)', { bold: true })]),
  bullet([run('5.  Le strade per la gestione di utenti e autorizzazioni', { bold: true })]),
  bullet([run('6.  Percorso consigliato', { bold: true })]),
  bullet([run('7.  Le decisioni che servono al Direttivo', { bold: true })]),
  new Paragraph({ children: [new PageBreak()] }),
];

const sezione1 = [
  h1('1. In sintesi'),
  p('Digitalions è la piattaforma web del Distretto Lions 108 LA: è online e accessibile 24 ore su 24 da computer, tablet e smartphone all’indirizzo digitalions108la.it. Oggi raccoglie e rende immediatamente consultabili tutti i dati ufficiali del Distretto — club, soci, incarichi e attività di servizio — con dashboard, ricerche, classificazioni e stampe pronte all’uso.'),
  p([
    run('Allo stato attuale la piattaforma è uno strumento di '),
    run('consultazione e analisi completo', { bold: true }),
    run('. La funzione di '),
    run('inserimento dei dati', { bold: true }),
    run(' (aggiungere nuove attività, service, soci o incarichi direttamente dal sito) non è ancora attiva: è il prossimo traguardo e richiede prima il sistema di gestione degli utenti e dei permessi.'),
  ]),
  p([
    run('Non è una dimenticanza, ma una ', {}),
    run('scelta di metodo', { bold: true }),
    run(': aprire la scrittura dei dati a migliaia di soci senza prima definire “chi può fare cosa” metterebbe a rischio l’integrità dei dati e la riservatezza delle informazioni personali dei soci.'),
  ]),
  p([
    run('La buona notizia: le ', {}),
    run('fondamenta del sistema di accesso sono già state poste', { bold: true, color: BLUE }),
    run(' (login, registrazione, struttura dei ruoli, regole di sicurezza sul database). Questo documento fotografa ciò che la piattaforma fa oggi e propone tre strade concrete per attivare la gestione di utenti e autorizzazioni.'),
  ]),
];

const sezione2 = [
  h1('2. Cosa fa oggi la piattaforma'),

  h2('Dashboard del Distretto'),
  bullet('Quadro d’insieme dell’anno sociale in corso, a confronto con l’anno precedente.'),
  bullet('Indicatori chiave: numero club, soci totali, soci entrati nell’anno, attività di servizio, persone servite, ore di volontariato, club che hanno rendicontato.'),
  bullet([
    run('I numeri delle attività usano i valori “limite massimo / capped” come nei report ufficiali LCI: ', {}),
    run('combaciano quindi con i dati comunicati dal Distretto', { bold: true }),
    run('.'),
  ]),
  bullet('Grafici: distribuzione per genere e per fasce d’età, attività per causa e per zona, attività recenti.'),
  bullet('Due approfondimenti per singolo club: composizione dei soci (fasce d’età e anzianità) e attività del club (Amministrazione vs Service).'),

  h2('Soci'),
  bullet('Ricerca libera su tutti i soci (nome, cognome, matricola) con filtri avanzati: genere, fascia d’età, fascia di anzianità, zona, circoscrizione, club, categoria associativa, programma, professione, città, provincia, intervalli di età e anzianità.'),
  bullet('Tre classificazioni pronte da stampare: per fasce d’età, per anzianità lionistica, per categoria associativa.'),
  bullet([
    run('Stampa coerente con i filtri: ', {}),
    run('qualsiasi selezione applicata si riflette esattamente nella stampa/PDF', { bold: true }),
    run('.'),
  ]),

  h2('Attività di servizio'),
  bullet('Ricerca e filtri su tutte le attività (causa, tipo progetto, livello, stato, club, zona, circoscrizione, date e altro).'),
  bullet('Pannello “Indicazioni totali” che somma in tempo reale persone servite, volontari, ore e fondi sulle attività filtrate (valori capped/limite LCI).'),
  bullet('Due classificazioni: tutte le attività del club nell’anno sociale; e con evidenza di Amministrazione vs Service, con subtotali.'),

  h2('Officer (incarichi)'),
  bullet('Elenco e ricerca di tutti gli incarichi di mandato in corso, per titolo, zona e circoscrizione.'),
  bullet('Classificazione degli incarichi raggruppati per titolo con le nomine dai club (Presidente di club, Segretario, Tesoriere, Direttore di club, e così via).'),

  h2('Stampe e PDF professionali'),
  bullet('Ogni elenco e classificazione è stampabile ed esportabile in PDF, con impaginazione ottimizzata (A4/A3 orizzontale) e un’intestazione che riporta i filtri applicati.'),

  h2('Accesso, tecnologia e sicurezza'),
  bullet('Online 24 ore su 24 su digitalions108la.it; funziona su computer, tablet e smartphone.'),
  bullet('Tema chiaro e scuro; interfaccia in italiano.'),
  bullet('Infrastruttura moderna e affidabile (hosting Vercel, database PostgreSQL su Supabase) con regole di sicurezza a livello di database e backup dei dati.'),
  bullet('L’anno sociale Lions (1 luglio – 30 giugno) è gestito automaticamente in tutti i calcoli.'),
];

const sezione3 = [
  h1('3. I numeri gestiti'),
  p('La piattaforma gestisce oggi l’intero patrimonio di dati del Distretto:'),
  makeTable(
    ['Dato', 'Quantità'],
    [
      ['Club', '93'],
      ['Soci', '2.981'],
      ['Incarichi officer (mandati in corso)', '1.886'],
      ['Attività di servizio (storico pluriennale)', '6.696'],
    ],
    [6500, 2526],
  ),
  spacer(80),
  p([run('I totali dell’anno sociale 2024/25 (persone servite, ore di volontariato, numero di attività) combaciano con i valori ufficiali comunicati dal Distretto, perché la piattaforma adotta gli stessi criteri di calcolo “limite massimo” usati da LCI.', { italics: true, color: GREY, size: 20 })]),
];

const sezione4 = [
  h1('4. Cosa non è ancora attivo (e perché)'),
  p([
    run('L’unica grande funzione non ancora disponibile è l’', {}),
    run('inserimento e la modifica dei dati direttamente dal sito', { bold: true }),
    run(': aggiungere o aggiornare attività e service, soci, incarichi. Oggi la piattaforma mostra i dati (importati periodicamente dagli export ufficiali Lions), ma non permette ancora di scriverli online.'),
  ]),
  p([
    run('Questo dipende da un solo elemento mancante: il ', {}),
    run('sistema di gestione degli utenti e delle autorizzazioni', { bold: true, color: BLUE }),
    run('. Senza un sistema che stabilisca “chi può vedere cosa” e “chi può modificare cosa”, aprire la scrittura sarebbe rischioso per due motivi:'),
  ]),
  bullet([run('Integrità dei dati', { bold: true }), run(': con quasi 3.000 soci, senza permessi chiunque potrebbe modificare i dati di club non propri.')]),
  bullet([run('Riservatezza', { bold: true }), run(': l’archivio soci contiene dati personali (data di nascita, indirizzo, telefono, email) che vanno protetti e mostrati solo a chi ne ha diritto.')]),
  spacer(60),
  p([run('Le fondamenta tecniche sono però già pronte:', { bold: true, color: BLUE })]),
  bullet('Pagine di accesso e registrazione funzionanti, con conferma via email.'),
  bullet('Registrazione che può collegare automaticamente l’account al socio tramite la matricola.'),
  bullet('Una struttura di ruoli già prevista nel database (è presente il campo “ruolo”).'),
  bullet('Regole di sicurezza sul database già impostate: sola lettura per il pubblico e bozze di regole che consentono agli officer di inserire e aggiornare i rapporti delle attività.'),
  spacer(60),
  p([
    run('Restano da completare: ', {}),
    run('la protezione delle pagine riservate, l’assegnazione e l’applicazione dei ruoli, e le schermate (form) per l’inserimento guidato dei dati.', {}),
  ]),
];

const sezione5 = [
  h1('5. Le strade per la gestione di utenti e autorizzazioni'),
  p('Il modello dei permessi dovrebbe rispecchiare la struttura reale dei Lions: Distretto → Circoscrizioni → Zone → Club → Soci, con gli Officer che ricoprono gli incarichi. Su questa base proponiamo una struttura di ruoli semplice e aderente alla realtà.'),

  h2('Ruoli proposti'),
  makeTable(
    ['Ruolo', 'Chi', 'Cosa può fare'],
    [
      ['Amministratore di Distretto', 'Governatore, Segretario e Tesoriere distrettuali, referente informatico', 'Vede tutto; inserisce e modifica tutti i dati; gestisce gli account e i ruoli.'],
      ['Officer di Club', 'Presidente, Segretario, Tesoriere, Direttore… del club', 'Vede tutto il Distretto; inserisce e modifica solo i dati del proprio club (attività e service).'],
      ['Socio', 'Tutti i soci registrati', 'Consulta i dati del Distretto; aggiorna il proprio profilo.'],
      ['Officer di Zona / Circoscrizione (opzionale)', 'Presidenti di Zona e Circoscrizione', 'Come l’Officer di Club, ma esteso ai club della propria area.'],
      ['Pubblico / non registrato (opzionale)', 'Chiunque', 'Eventuale accesso limitato a dati non sensibili, oppure nessun accesso.'],
    ],
    [2600, 2700, 3726],
  ),

  h2('Le tre strade'),

  h3('Strada A — Pragmatica e immediata (account centralizzati)', GOLD),
  bullet([run('Come funziona: ', { bold: true }), run('solo il referente di Distretto crea pochi account, con due ruoli (amministratore che scrive, lettore che consulta). Nessuna registrazione pubblica.')]),
  bullet([run('Pro: ', { bold: true }), run('attivabile in tempi molto brevi; rischio minimo; pieno controllo.')]),
  bullet([run('Contro: ', { bold: true }), run('non scala; l’inserimento resta centralizzato (i club non inseriscono da soli); lavoro manuale.')]),
  bullet([run('Ideale per: ', { bold: true }), run('sbloccare subito l’inserimento per pochi referenti di Distretto.')]),

  h3('Strada B — Raccomandata (ruoli legati alla gerarchia Lions)', BRAND),
  bullet([run('Come funziona: ', { bold: true }), run('ogni socio può registrarsi con la propria matricola e un amministratore ne approva il ruolo. Gli Officer di Club inseriscono e modificano solo i dati del proprio club; il Distretto gestisce tutto; i soci consultano.')]),
  bullet([run('Pro: ', { bold: true }), run('rispecchia la realtà Lions; ogni club gestisce i propri dati; sicuro (controlli a livello di database); scala bene; sfrutta le fondamenta già presenti.')]),
  bullet([run('Contro: ', { bold: true }), run('richiede più lavoro (schermate di inserimento, pannello di gestione utenti, regole per club, flusso di approvazione).')]),
  bullet([run('Ideale per: ', { bold: true }), run('la versione definitiva e duratura del prodotto.')]),

  h3('Strada C — Evolutiva (integrazione con i sistemi Lions ufficiali)', GOLD),
  bullet([run('Come funziona: ', { bold: true }), run('in prospettiva, collegamento con le credenziali e i portali Lions ufficiali (es. MyLion / Lion Portal) e allineamento automatico dei ruoli alle nomine ufficiali degli officer, senza gestione manuale.')]),
  bullet([run('Pro: ', { bold: true }), run('zero gestione manuale; ruoli sempre allineati alle nomine ufficiali; massima sicurezza.')]),
  bullet([run('Contro: ', { bold: true }), run('dipende dalla disponibilità tecnica di LCI; più complessa; da verificare la fattibilità.')]),
  bullet([run('Ideale per: ', { bold: true }), run('un’evoluzione a medio termine, dopo la Strada B.')]),

  h2('Raccomandazione'),
  p([
    run('Consigliamo di puntare alla ', {}),
    run('Strada B come obiettivo', { bold: true, color: BRAND }),
    run(', partendo subito con un primo passo equivalente alla Strada A (pochi account amministratori per cominciare a inserire i dati) e tenendo la Strada C come visione futura. Così si ottiene un risultato utile da subito, costruendo nella direzione giusta senza dover rifare il lavoro.'),
  ]),
];

const sezione6 = [
  h1('6. Percorso consigliato'),
  p('Un percorso a fasi, dove ogni fase produce qualcosa di utilizzabile da subito. I tempi dipendono dalle priorità del Direttivo; qui indichiamo la complessità relativa.'),
  makeTable(
    ['Fase', 'Cosa si fa', 'Cosa sblocca', 'Complessità'],
    [
      ['Fase 1 — Accesso protetto', 'Protezione delle pagine riservate e creazione dei primi account amministratori di Distretto.', 'Inserimento e modifica dei dati da parte del Distretto.', 'Bassa'],
      ['Fase 2 — Ruoli per club + inserimento', 'Schermate guidate per attività e service; ruolo “Officer di Club” limitato al proprio club; registrazione dei soci con matricola e approvazione.', 'Ogni club inserisce i propri service in autonomia.', 'Media'],
      ['Fase 3 — Rifiniture e automazioni', 'Pannello completo di gestione utenti; registro delle modifiche; estensione a Zona/Circoscrizione; eventuale integrazione con i sistemi Lions.', 'Gestione autonoma, tracciabile e allineata alle nomine ufficiali.', 'Media-alta (incrementale)'],
    ],
    [2150, 3526, 2350, 1000],
  ),
];

const sezione7 = [
  h1('7. Le decisioni che servono al Direttivo'),
  p('Per avviare il lavoro nella direzione giusta, bastano poche decisioni:'),
  bullet('Chi sono gli amministratori di Distretto (i primi account)?'),
  bullet('La registrazione è aperta a tutti i soci (con matricola) oppure solo su invito?'),
  bullet('Vogliamo che ogni club inserisca i propri service in autonomia (Strada B) o l’inserimento resta centralizzato all’inizio (Strada A)?'),
  bullet('Gli account dei soci richiedono un’approvazione manuale prima di poter scrivere?'),
  bullet('Quali dati dei soci sono visibili a un socio “semplice” e quali solo agli officer e al Distretto (privacy)?'),
  spacer(160),
  rule(GOLD, 14),
  p([
    run('Digitalions è già oggi uno strumento concreto e affidabile per leggere e raccontare il servizio del Distretto. Con la scelta di una di queste strade, diventerà anche lo strumento con cui i club ', {}),
    run('costruiscono', { italics: true }),
    run(' quei dati, giorno per giorno. ', {}),
    run('We Serve. Anche digitalmente.', { bold: true, color: BLUE }),
  ]),
];

// =====================================================================
// DOCUMENTO
// =====================================================================
const doc = new Document({
  creator: 'Digitalions',
  title: 'Digitalions — Stato attuale e roadmap utenti/autorizzazioni',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22, color: '222222' } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: BLUE },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: BRAND },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 23, bold: true, font: 'Arial', color: '333333' },
        paragraph: { spacing: { before: 160, after: 70 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 280 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 280 } } } },
      ] },
    ],
  },
  sections: [{
    properties: {
      titlePage: true,
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      first: new Header({ children: [new Paragraph({ children: [] })] }),
      default: new Header({ children: [
        new Paragraph({
          spacing: { after: 0 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND, space: 4 } },
          children: [
            run('Digitalions', { bold: true, color: BRAND, size: 18 }),
            run('   ·   Distretto Lions 108 LA', { color: GREY, size: 18 }),
          ],
        }),
      ] }),
    },
    footers: {
      first: new Footer({ children: [new Paragraph({ children: [] })] }),
      default: new Footer({ children: [
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
          children: [
            run('Documento interno · 8 giugno 2026', { color: GREY, size: 16 }),
            run('\tPagina ', { color: GREY, size: 16 }),
            new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16 }),
            run(' di ', { color: GREY, size: 16 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], color: GREY, size: 16 }),
          ],
        }),
      ] }),
    },
    children: [
      ...titlePage,
      ...indice,
      ...sezione1,
      ...sezione2,
      ...sezione3,
      ...sezione4,
      ...sezione5,
      ...sezione6,
      ...sezione7,
    ],
  }],
});

const out = path.join(__dirname, 'Digitalions-Stato-e-Roadmap.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(out, buf);
  console.log('OK ->', out, '(' + buf.length + ' bytes)');
}).catch(e => { console.error('ERRORE:', e); process.exit(1); });
