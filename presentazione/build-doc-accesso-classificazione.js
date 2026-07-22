// Genera "DigitaLions — Accesso utenti e Classificazione Soci" (.docx)
// Uso: node build-doc-accesso-classificazione.js
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TabStopType,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
} = require('docx');

const BLUE = '0A3D7A', BRAND = '0055FF', GOLD = 'C8A200', GREY = '595959', LIGHT = 'F2F5FB', HEADFILL = '0A3D7A';
const CW = 9026, DXA = WidthType.DXA;
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

// ---- Contenuto ----
const titlePage = [
  spacer(2400),
  p([run('DOCUMENTO INTERNO  ·  DISTRETTO LIONS 108 LA', { bold: true, color: GREY, size: 18 })], { align: AlignmentType.CENTER, after: 200 }),
  p([run('DigitaLions', { bold: true, color: BRAND, size: 76 })], { align: AlignmentType.CENTER, after: 80 }),
  p([run('Accesso degli utenti e Classificazione dei Soci', { color: BLUE, size: 30, bold: true })], { align: AlignmentType.CENTER, after: 40 }),
  p([run('Come funziona la registrazione, i ruoli e la nuova classificazione per categoria associativa', { color: GREY, size: 22 })], { align: AlignmentType.CENTER, after: 240 }),
  rule(GOLD, 18),
  p([run('digitalions108la.it', { color: BRAND, size: 22, bold: true })], { align: AlignmentType.CENTER, after: 40 }),
  p([run('26 giugno 2026  ·  versione 1.0', { color: GREY, size: 20 })], { align: AlignmentType.CENTER }),
  new Paragraph({ children: [new PageBreak()] }),
];

const sez1 = [
  h1('1. In sintesi'),
  p('Questo documento spiega due novità della piattaforma DigitaLions:'),
  num([run('Come gli utenti accedono alla piattaforma', { bold: true }), run(' — chi può registrarsi, con quale ruolo, e che cosa ciascuno può vedere o fare.')]),
  num([run('La nuova Classificazione dei Soci per categoria associativa', { bold: true }), run(' — la piattaforma traduce automaticamente il “tipo associazione” tecnico (in inglese) nelle categorie ufficiali Lions in italiano (Effettivo, Fondatore, Vitalizio…).')]),
  p('Entrambe sono già attive e in produzione.'),
];

const sez2 = [
  h1('2. Registrazione e accesso degli utenti'),

  h2('2.1 Chi può accedere'),
  bullet([run('I Soci del Distretto', { bold: true }), run(': si registrano in autonomia, indicando la propria matricola. La registrazione è consentita solo se la matricola risulta tra i soci.')]),
  bullet([run('Lo staff 01 Informatica', { bold: true }), run(': si registra con un’email aziendale @info01.it e ottiene automaticamente i privilegi di amministratore tecnico (non serve matricola).')]),

  h2('2.2 I ruoli e cosa permettono'),
  p('Il ruolo di ciascun utente viene assegnato automaticamente dal sistema in base alla persona (matricola) o all’email. Non c’è nulla da configurare a mano per i singoli soci.'),
  makeTable(
    ['Ruolo', 'Chi è', 'Cosa può fare', 'Cosa vede'],
    [
      ['Super-Admin', 'Staff 01 Informatica (@info01.it)', 'Tutto: gestione tecnica e dati', 'Tutto il Distretto'],
      ['Coordinatore GST', 'Angelo D’Arcangeli', 'Approva / Sospende / Rifiuta le attività; carica i file', 'Tutte le circoscrizioni'],
      ['Componente GST', '1 per circoscrizione (7 persone)', 'Approva / Sospende / Rifiuta', 'La propria circoscrizione'],
      ['Presidente di Circoscrizione', '7 persone', 'Sola consultazione', 'La propria circoscrizione'],
      ['Presidente di Zona', '~15 persone', 'Sola consultazione', 'La propria zona'],
      ['Socio', 'Tutti gli altri soci', 'Sola consultazione', 'Il proprio Club'],
    ],
    [2100, 2300, 2626, 2000],
  ),
  p([run('In totale sono già caricate 30 cariche ufficiali', {}), run(' (Comitato GST + Presidenti di Circoscrizione e di Zona), riconosciute automaticamente al primo accesso della persona.', {})], { before: 80 }),

  h2('2.3 Come ci si registra (passo per passo)'),
  num('Si va su digitalions108la.it e si sceglie “Registrati”.'),
  num('Si inserisce email, password e — per i soci — la propria matricola (per lo staff @info01.it la matricola non è richiesta).'),
  num('Si riceve un’email di conferma: cliccando il link l’account viene attivato.'),
  num('Al primo accesso il sistema riconosce la persona e le assegna automaticamente il ruolo corretto.'),
  num('Chi non ricopre cariche particolari entra come “Socio”, in sola consultazione del proprio Club.'),

  h2('2.4 Sicurezza: ognuno vede solo ciò che gli compete'),
  p('La separazione tra i ruoli non è solo “a schermo”: è garantita a livello di database (regole di sicurezza Row Level Security). Significa che un utente non può in alcun modo accedere a dati fuori dal proprio ambito, nemmeno tecnicamente.'),
  bullet('Le attività vengono mostrate solo se “approvate”, tranne ai revisori (GST) che vedono anche quelle in attesa per poterle lavorare.'),
  bullet('Le operazioni di modifica e approvazione sono consentite solo a chi ne ha diritto e solo nel proprio territorio.'),
  bullet('I dati personali dei soci sono protetti: ogni socio vede il proprio Club.'),
];

const sez3 = [
  h1('3. Classificazione dei Soci per Categoria Associativa'),

  h2('3.1 Che cos’è'),
  p('I dati ufficiali Lions indicano per ogni socio un “tipo associazione” in forma tecnica e in inglese (es. “Lion-Charter-Regular [Active]”). Questi codici non sono leggibili per chi consulta gli elenchi.'),
  p('DigitaLions ora traduce automaticamente ciascun tipo nella corrispondente categoria ufficiale italiana (Effettivo, Fondatore, Privilegiato, Vitalizio, Onorario, Aggregato, Affiliato, Familiare, Leo-Lion, Studente), secondo lo schema fornito dal Distretto.'),

  h2('3.2 Le corrispondenze (tipo → categoria)'),
  makeTable(
    ['Tipo associazione (dato Lions)', 'Categoria'],
    [
      ['Lion-Regular [Active]', 'EFFETTIVO'],
      ['Lion-Branch-Regular [Active]', 'EFFETTIVO'],
      ['Lion-Branch-Charter-Regular [Active]', 'FONDATORE'],
      ['Lion-Life-Charter [Active]', 'FONDATORE'],
      ['Lion-Charter-Regular [Active]', 'FONDATORE'],
      ['Lion-Privileged-Regular [Active]', 'PRIVILEGIATO'],
      ['Lion-Privileged-Charter-Regular [Active]', 'PRIVILEGIATO'],
      ['Lion-Life-Charter-Regular [Active]', 'VITALIZIO'],
      ['Lion-Life-Regular [Active]', 'VITALIZIO'],
      ['Lion-Life [Active]', 'VITALIZIO'],
      ['Honorary Lion Member [Active]', 'ONORARIO'],
      ['Lion-Member at Large-Charter-Regular [Active]', 'AGGREGATO'],
      ['Lion-Member at Large-Regular [Active]', 'AGGREGATO'],
      ['Lion-Affiliate-Regular [Active]', 'AFFILIATO'],
      ['Lion-Family Member [Active]', 'FAMILIARE'],
      ['Lion-Discounted-Family Member [Active]', 'FAMILIARE'],
      ['Lion-Discounted-Charter-Family Member [Active]', 'FAMILIARE'],
      ['Lion-Discounted-Leo Lion [Active]', 'LEO-LION'],
      ['Lion-Leo Lion [Active]', 'LEO-LION'],
      ['Lion-Discounted-Charter-Leo Lion [Active]', 'LEO-LION'],
      ['Lion-Discounted-Branch-Student [Active]', 'STUDENTE'],
    ],
    [6526, 2500],
  ),
  p([run('Le categorie “Associato” e “Giovane Adulto” sono previste ma attualmente nessun socio vi ricade.', { italics: true, color: GREY, size: 20 })], { before: 80 }),

  h2('3.3 Distribuzione attuale dei soci'),
  makeTable(
    ['Categoria', 'Soci'],
    [
      ['Effettivo', '2.342'], ['Fondatore', '315'], ['Privilegiato', '75'], ['Onorario', '71'],
      ['Aggregato', '67'], ['Familiare', '49'], ['Leo-Lion', '33'], ['Vitalizio', '15'],
      ['Affiliato', '13'], ['Studente', '1'], ['TOTALE', '2.981'],
    ],
    [6526, 2500],
  ),

  h2('3.4 Dove si vede e come si aggiorna'),
  bullet([run('Nella pagina ', {}), run('Soci', { bold: true }), run(' è disponibile un nuovo filtro “Classificazione” e una colonna che mostra la categoria di ogni socio.')]),
  bullet('Le corrispondenze sono salvate in una tabella dedicata: se in futuro cambiano le regole, si aggiorna in un punto solo e tutta la piattaforma si adegua automaticamente.'),
  spacer(160),
  rule(GOLD, 14),
  p([run('DigitaLions rende i dati del Distretto chiari, sicuri e accessibili al ruolo giusto. ', {}), run('We Serve. Anche digitalmente.', { bold: true, color: BLUE })]),
];

const doc = new Document({
  creator: 'DigitaLions',
  title: 'DigitaLions — Accesso utenti e Classificazione Soci',
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
      default: new Footer({ children: [new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9026 }], children: [run('Documento interno · 26 giugno 2026', { color: GREY, size: 16 }), run('\tPagina ', { color: GREY, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16 }), run(' di ', { color: GREY, size: 16 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], color: GREY, size: 16 })] })] }),
    },
    children: [...titlePage, ...sez1, ...sez2, ...sez3],
  }],
});

const out = path.join(__dirname, 'DigitaLions-Accesso-e-Classificazione.docx');
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(out, buf); console.log('OK ->', out, '(' + buf.length + ' bytes)'); })
  .catch(e => { console.error('ERRORE:', e); process.exit(1); });
