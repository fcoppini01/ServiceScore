// Genera "DigitaLions — Stato del progetto" (.docx) per la riunione Distretto 108 LA.
// Documento completo da consegnare al boss per l'incontro con il referente DigitaLions.
// Uso: node build-doc-stato-progetto.js
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TabStopType,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
} = require('docx');

const BLUE = '0A3D7A', BRAND = '0055FF', GOLD = 'C8A200', GREY = '595959', LIGHT = 'F2F5FB', HEADFILL = '0A3D7A';
const DATA_DOC = '29 giugno 2026';
const DXA = WidthType.DXA;
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const cellBorders = { top: border, bottom: border, left: border, right: border };
const run = (text, o = {}) => new TextRun({ text, ...o });
function p(text, o = {}) {
  return new Paragraph({
    children: Array.isArray(text) ? text : [run(text, o.run || {})],
    spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 276 }, alignment: o.align, border: o.border,
  });
}
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(t)], spacing: { before: 320, after: 160 } });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run(t)], spacing: { before: 220, after: 100 } });
const bullet = (text, lvl = 0) => new Paragraph({ numbering: { reference: 'b', level: lvl }, children: Array.isArray(text) ? text : [run(text)], spacing: { after: 70, line: 270 } });
const num = (text) => new Paragraph({ numbering: { reference: 'n', level: 0 }, children: Array.isArray(text) ? text : [run(text)], spacing: { after: 80, line: 272 } });
const spacer = (h = 120) => new Paragraph({ children: [], spacing: { after: h } });
const rule = (color = BRAND, size = 12) => new Paragraph({ children: [], spacing: { before: 60, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } } });

function cell(content, width, o = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map(line =>
    new Paragraph({ children: [run(String(line), { bold: o.bold, color: o.color, size: o.size })], spacing: { after: 0, line: 260 } }));
  return new TableCell({
    borders: cellBorders, width: { size: width, type: DXA },
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 110, right: 110 }, verticalAlign: VerticalAlign.CENTER, children: paras,
  });
}
function makeTable(headers, rows, widths) {
  const headerRow = new TableRow({ tableHeader: true, children: headers.map((h, i) =>
    cell(h, widths[i], { bold: true, color: 'FFFFFF', fill: HEADFILL })) });
  const bodyRows = rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? LIGHT : 'FFFFFF' })) }));
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}

// ---- Copertina ----
const titlePage = [
  spacer(2200),
  p([run('DOCUMENTO PER LA RIUNIONE  ·  DISTRETTO LIONS 108 LA', { bold: true, color: GREY, size: 18 })], { align: AlignmentType.CENTER, after: 200 }),
  p([run('DigitaLions', { bold: true, color: BRAND, size: 76 })], { align: AlignmentType.CENTER, after: 80 }),
  p([run('Stato del progetto', { color: BLUE, size: 32, bold: true })], { align: AlignmentType.CENTER, after: 40 }),
  p([run('La piattaforma digitale del Distretto: cosa fa oggi, com’è protetta, cosa resta da concordare', { color: GREY, size: 22 })], { align: AlignmentType.CENTER, after: 240 }),
  rule(GOLD, 18),
  p([run('digitalions108la.it', { color: BRAND, size: 22, bold: true })], { align: AlignmentType.CENTER, after: 40 }),
  p([run(DATA_DOC + '  ·  a cura di 01 Informatica', { color: GREY, size: 20 })], { align: AlignmentType.CENTER }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---- 1. In sintesi ----
const sez1 = [
  h1('1. In sintesi'),
  p('DigitaLions è la piattaforma web del Distretto Lions 108 LA per consultare e gestire in un unico posto i dati ufficiali del Distretto: soci, attività di servizio, officer (cariche), con dashboard, classificazioni, stampe ed esportazioni in Excel.'),
  p('La piattaforma è già in produzione e raggiungibile all’indirizzo digitalions108la.it. È aggiornata in continuazione e mantenuta da 01 Informatica.'),
  p([run('In una riga: ', { bold: true }), run('i dati del Distretto, sempre aggiornati, chiari da leggere, protetti e visibili solo a chi ne ha diritto.')]),
  h2('A colpo d’occhio'),
  makeTable(
    ['Cosa', 'Valore'],
    [
      ['Indirizzo pubblico', 'digitalions108la.it'],
      ['Club gestiti', '93'],
      ['Soci', '2.981'],
      ['Officer / cariche', '1.886'],
      ['Attività di servizio (storico 2022–2026)', 'oltre 6.800'],
      ['Stato', 'In produzione, aggiornata di continuo'],
    ],
    [5026, 4000],
  ),
];

// ---- 2. Cosa permette di fare ----
const sez2 = [
  h1('2. Cosa permette di fare'),
  p('La piattaforma è organizzata in aree, raggiungibili dal menu in alto. Ogni elenco è filtrabile e ogni risultato può essere stampato in PDF o esportato in Excel.'),

  h2('2.1 Elenco Generale Soci'),
  bullet('Ricerca e filtri per Club, Zona, Circoscrizione, Distretto, tipo associazione, classificazione, fascia d’età e anzianità lionistica.'),
  bullet('Colonne con i contatti (cellulare, email) e la classificazione del socio.'),
  bullet('Stampa PDF ed esportazione Excel dell’elenco filtrato.'),

  h2('2.2 Storico Attività'),
  bullet('Tutte le attività di servizio dei club, con filtri per territorio, anno sociale, tipo e livello dell’attività, oltre a impatto e dati finanziari.'),
  bullet([run('Totali in cima', { bold: true }), run(' (persone servite, volontari, ore, fondi) calcolati sui valori ufficiali “capped” di Lions International, gli stessi dei report ufficiali del Distretto.')]),
  bullet('Stampa PDF ed esportazione Excel.'),

  h2('2.3 Elenco Officer'),
  bullet('Le cariche dei club con filtro per anno sociale e opzione “solo incarichi attivi” (in corso alla data odierna).'),
  bullet('Stampa PDF ed esportazione Excel.'),

  h2('2.4 Dashboard'),
  bullet('Panoramica generale del Distretto.'),
  bullet('Soci per Club: composizione per fasce d’età e per anzianità lionistica.'),
  bullet('Attività per Club: confronto Amministrazione vs Service per anno sociale.'),

  h2('2.5 Rapporti e Classificazioni'),
  bullet('Quadri di riordino dei soci (per età, anzianità, caratteristiche), delle attività (per club e anno) e degli officer (incarichi per club).'),
  bullet('Ogni quadro è stampabile ed esportabile in Excel.'),

  h2('2.6 Revisione delle attività (workflow di approvazione)'),
  bullet('I responsabili (Comitato GST) possono approvare, sospendere o rifiutare le attività, e correggere i valori prima dell’approvazione.'),
  bullet('I nuovi report Lions possono essere caricati direttamente dalla piattaforma (file CSV), senza passaggi tecnici esterni.'),
];

// ---- 3. Accesso degli utenti e ruoli ----
const sez3 = [
  h1('3. Accesso degli utenti e ruoli'),

  h2('3.1 Chi può accedere'),
  bullet([run('I Soci del Distretto', { bold: true }), run(': si registrano in autonomia indicando la propria matricola. La registrazione è consentita solo se la matricola risulta tra i soci.')]),
  bullet([run('Lo staff 01 Informatica', { bold: true }), run(': si registra con email aziendale @info01.it e ottiene i privilegi di amministratore tecnico (senza matricola).')]),

  h2('3.2 I ruoli e cosa permettono'),
  p('Il ruolo viene assegnato automaticamente dal sistema in base alla persona (matricola) o all’email: non c’è nulla da configurare a mano per i singoli soci.'),
  makeTable(
    ['Ruolo', 'Chi è', 'Cosa può fare', 'Cosa vede'],
    [
      ['Super-Admin', 'Staff 01 Informatica (@info01.it)', 'Tutto: gestione tecnica e dati', 'Tutto il Distretto'],
      ['Coordinatore GST', 'Angelo D’Arcangeli', 'Approva / Sospende / Rifiuta; carica i file', 'Tutte le circoscrizioni'],
      ['Componente GST', '1 per circoscrizione (7 persone)', 'Approva / Sospende / Rifiuta', 'La propria circoscrizione'],
      ['Presidente di Circoscrizione', '7 persone', 'Sola consultazione', 'La propria circoscrizione'],
      ['Presidente di Zona', '~15 persone', 'Sola consultazione', 'La propria zona'],
      ['Socio', 'Tutti gli altri soci', 'Sola consultazione', 'Il proprio Club'],
    ],
    [2100, 2300, 2626, 2000],
  ),
  p([run('Sono già caricate 30 cariche ufficiali', { bold: true }), run(' (Comitato GST + Presidenti di Circoscrizione e di Zona), riconosciute automaticamente al primo accesso della persona.')], { before: 80 }),

  h2('3.3 Come ci si registra'),
  num('Si va su digitalions108la.it e si sceglie “Registrati”.'),
  num('Si inserisce email, password e — per i soci — la matricola (per lo staff @info01.it non è richiesta).'),
  num('Si riceve un’email di conferma: cliccando il link l’account viene attivato.'),
  num('Al primo accesso il sistema riconosce la persona e le assegna automaticamente il ruolo corretto.'),
];

// ---- 4. Classificazione dei Soci ----
const sez4 = [
  h1('4. Classificazione dei Soci per Categoria Associativa'),
  p('I dati ufficiali Lions indicano per ogni socio un “tipo associazione” tecnico e in inglese (es. “Lion-Charter-Regular [Active]”), poco leggibile negli elenchi. DigitaLions lo traduce automaticamente nella categoria ufficiale italiana, secondo lo schema fornito dal Distretto.'),
  h2('4.1 Distribuzione attuale dei soci'),
  makeTable(
    ['Categoria', 'Soci'],
    [
      ['Effettivo', '2.342'], ['Fondatore', '315'], ['Privilegiato', '75'], ['Onorario', '71'],
      ['Aggregato', '67'], ['Familiare', '49'], ['Leo-Lion', '33'], ['Vitalizio', '15'],
      ['Affiliato', '13'], ['Studente', '1'], ['TOTALE', '2.981'],
    ],
    [6526, 2500],
  ),
  h2('4.2 Dove si vede'),
  bullet([run('Nella pagina ', {}), run('Soci', { bold: true }), run(' c’è un filtro “Classificazione” e una colonna con la categoria di ogni socio.')]),
  bullet('Le corrispondenze tipo→categoria sono salvate in un punto solo: se cambiano le regole, si aggiorna una volta e tutta la piattaforma si adegua.'),
  p([run('Dettaglio completo delle corrispondenze nel documento “Accesso utenti e Classificazione Soci”.', { italics: true, color: GREY, size: 20 })], { before: 60 }),
];

// ---- 5. Sicurezza e protezione dei dati ----
const sez5 = [
  h1('5. Sicurezza e protezione dei dati'),
  p('La separazione tra i ruoli non è solo “a schermo”: è garantita a livello di database. Un utente non può in alcun modo accedere a dati fuori dal proprio ambito, nemmeno tecnicamente.'),
  bullet([run('Visibilità per ruolo', { bold: true }), run(': ogni utente vede solo il proprio ambito; le attività sono mostrate al pubblico solo se “approvate”, mentre i revisori vedono anche quelle in attesa per poterle lavorare.')]),
  bullet([run('Dati personali protetti', { bold: true }), run(': i contatti e i dati anagrafici dei soci sono accessibili solo a chi ne ha diritto.')]),
  bullet([run('Accesso in sola lettura per il pubblico', { bold: true }), run(': nessuno, dall’esterno, può modificare o cancellare dati (verificato con un test di intrusione).')]),
  bullet([run('Connessione cifrata (HTTPS/SSL)', { bold: true }), run(' obbligatoria su tutta la piattaforma e verso il database.')]),
  bullet([run('Backup giornaliero automatico e cifrato', { bold: true }), run(' del database (copia protetta, conservata per 90 giorni).')]),
  p([run('In sintesi: ', { bold: true }), run('dati al sicuro, accesso solo a chi di competenza, copia di sicurezza ogni giorno.')], { before: 80 }),
];

// ---- 6. Dove gira e come si aggiorna ----
const sez6 = [
  h1('6. Dove gira e come si aggiorna'),
  bullet([run('Indirizzo pubblico: ', { bold: true }), run('digitalions108la.it.')]),
  bullet([run('Aggiornamenti automatici', { bold: true }), run(': ogni miglioria sviluppata viene pubblicata online automaticamente, senza interruzioni di servizio.')]),
  bullet([run('Nessun server da gestire per il Distretto', { bold: true }), run(': l’infrastruttura è in cloud e mantenuta da 01 Informatica, con costi contenuti.')]),
];

// ---- 7. Novita recenti ----
const sez7 = [
  h1('7. Novità recenti'),
  bullet([run('Filtro per Anno Sociale', { bold: true }), run(' nelle pagine Attività e Officer: al posto delle date libere si seleziona direttamente l’anno sociale (1° luglio – 30 giugno), come già nelle classificazioni.')]),
  bullet([run('Classificazione dei soci', { bold: true }), run(' per categoria associativa (Effettivo, Fondatore, Vitalizio…) con filtro e colonna dedicati.')]),
  bullet([run('Sistema di accesso con ruoli', { bold: true }), run(' e pagina di Revisione delle attività, con caricamento dei report direttamente dalla piattaforma.')]),
  bullet([run('Esportazione Excel', { bold: true }), run(' aggiunta su tutte le pagine di stampa e classificazione.')]),
];

// ---- 8. Punti da concordare in riunione ----
const sez8 = [
  h1('8. Punti da concordare in riunione'),
  p('Elementi aperti su cui sarebbe utile un allineamento con il referente DigitaLions del Distretto:'),
  makeTable(
    ['Tema', 'Punto da decidere'],
    [
      ['Cambio anno sociale', 'Procedura di aggiornamento annuale delle cariche/ruoli al rinnovo (1° luglio).'],
      ['Aggiornamento dati', 'Cadenza e responsabile del caricamento dei nuovi report sulla piattaforma.'],
      ['Email di registrazione', 'Conferma dell’indirizzo ufficiale del dominio per le email di attivazione account.'],
      ['Visibilità elenchi', 'Se restringere anche gli elenchi soci/officer per ruolo (oltre alle attività).'],
      ['Comunicazione ai soci', 'Come e quando comunicare ai soci che possono registrarsi e accedere.'],
    ],
    [2700, 6326],
  ),
  spacer(160),
  rule(GOLD, 14),
  p([run('DigitaLions rende i dati del Distretto chiari, sicuri e accessibili al ruolo giusto. ', {}), run('We Serve. Anche digitalmente.', { bold: true, color: BLUE })]),
];

const doc = new Document({
  creator: 'DigitaLions',
  title: 'DigitaLions — Stato del progetto',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22, color: '222222' } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Arial', color: BLUE }, paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Arial', color: BRAND }, paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: 'n', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ],
  },
  sections: [{
    properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: {
      first: new Header({ children: [new Paragraph({ children: [] })] }),
      default: new Header({ children: [new Paragraph({ spacing: { after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND, space: 4 } }, children: [run('DigitaLions', { bold: true, color: BRAND, size: 18 }), run('   ·   Distretto Lions 108 LA', { color: GREY, size: 18 })] })] }),
    },
    footers: {
      first: new Footer({ children: [new Paragraph({ children: [] })] }),
      default: new Footer({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9026 }], children: [run('Documento per la riunione · ' + DATA_DOC, { color: GREY, size: 16 }), run('\tPagina ', { color: GREY, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16 }), run(' di ', { color: GREY, size: 16 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], color: GREY, size: 16 })] })] }),
    },
    children: [...titlePage, ...sez1, ...sez2, ...sez3, ...sez4, ...sez5, ...sez6, ...sez7, ...sez8],
  }],
});

const out = path.join(__dirname, 'DigitaLions-Stato-del-progetto.docx');
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(out, buf); console.log('OK ->', out, '(' + buf.length + ' bytes)'); })
  .catch(e => { console.error('ERRORE:', e); process.exit(1); });
