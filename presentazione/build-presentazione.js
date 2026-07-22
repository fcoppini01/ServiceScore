// Genera la presentazione "DigitaLions" (.pptx) per il boss davanti a ~600 persone.
// Uso: NODE_PATH=$(npm root -g) node build-presentazione.js
const pptxgen = require('pptxgenjs')
const path = require('path')

const NAVY = '0A3D7A', BLUE = '0055FF', GOLD = 'E6A700', INK = '17242E', MUTE = '5B6B7B'
const WHITE = 'FFFFFF', SOFT = 'F2F5FB', LINE = 'DCE4F0'
const F = 'Calibri', FH = 'Calibri'

const p = new pptxgen()
p.layout = 'LAYOUT_WIDE' // 13.3 x 7.5
p.author = 'DigitaLions · 01 Informatica'
p.company = 'Distretto Lions 108 LA'

const W = 13.333, H = 7.5

function bgDark(s) { s.background = { color: NAVY } }
function bgLight(s) { s.background = { color: WHITE } }

// pallino con numero/lettera
function circle(s, x, y, d, fill, txt, txtColor = WHITE, size = 16) {
  s.addShape('ellipse', { x, y, w: d, h: d, fill: { color: fill }, line: { type: 'none' } })
  s.addText(txt, { x, y, w: d, h: d, align: 'center', valign: 'middle', fontFace: FH, fontSize: size, bold: true, color: txtColor, margin: 0 })
}

// kicker + titolo standard per slide di contenuto
function header(s, kicker, title) {
  s.addText(kicker.toUpperCase(), { x: 0.7, y: 0.5, w: 12, h: 0.3, fontFace: FH, fontSize: 12, bold: true, color: BLUE, charSpacing: 2, margin: 0 })
  s.addText(title, { x: 0.7, y: 0.82, w: 12, h: 0.8, fontFace: FH, fontSize: 30, bold: true, color: NAVY, margin: 0 })
}

function footer(s, n) {
  s.addText('DigitaLions · Distretto Lions 108 LA', { x: 0.7, y: 7.05, w: 8, h: 0.3, fontFace: F, fontSize: 9, color: MUTE, margin: 0 })
  s.addText(String(n), { x: 12.2, y: 7.05, w: 0.5, h: 0.3, align: 'right', fontFace: F, fontSize: 9, color: MUTE, margin: 0 })
}

// ---------- SLIDE 1 — copertina ----------
{
  const s = p.addSlide(); bgDark(s)
  s.addShape('ellipse', { x: 10.3, y: -1.6, w: 4.6, h: 4.6, fill: { color: BLUE, transparency: 78 }, line: { type: 'none' } })
  s.addShape('ellipse', { x: 11.4, y: 4.9, w: 3.6, h: 3.6, fill: { color: GOLD, transparency: 85 }, line: { type: 'none' } })
  s.addText('DISTRETTO LIONS 108 LA', { x: 0.9, y: 1.7, w: 11, h: 0.4, fontFace: FH, fontSize: 15, bold: true, color: 'CADCFC', charSpacing: 3, margin: 0 })
  s.addText('DigitaLions', { x: 0.85, y: 2.15, w: 11.5, h: 1.5, fontFace: FH, fontSize: 76, bold: true, color: WHITE, margin: 0 })
  s.addText('La piattaforma digitale del Distretto: soci, service e officer in un unico posto, sempre aggiornati e a portata di clic.',
    { x: 0.9, y: 3.75, w: 9.6, h: 1.0, fontFace: F, fontSize: 20, color: 'E8EEF9', margin: 0, lineSpacingMultiple: 1.1 })
  s.addShape('roundRect', { x: 0.9, y: 5.15, w: 3.1, h: 0.5, rectRadius: 0.25, fill: { color: GOLD }, line: { type: 'none' } })
  s.addText('digitalions108la.it', { x: 0.9, y: 5.15, w: 3.1, h: 0.5, align: 'center', valign: 'middle', fontFace: FH, fontSize: 15, bold: true, color: NAVY, margin: 0 })
  s.addText('a cura di 01 Informatica', { x: 4.2, y: 5.15, w: 5, h: 0.5, valign: 'middle', fontFace: F, fontSize: 13, color: 'CADCFC', margin: 0 })
  s.addNotes('Buongiorno a tutti. Oggi vi presento DigitaLions, lo strumento con cui il nostro Distretto raccoglie e valorizza tutto ciò che facciamo: i soci, i service, gli officer. Un unico posto, sempre aggiornato.')
}

// ---------- SLIDE 2 — il bisogno ----------
{
  const s = p.addSlide(); bgLight(s)
  header(s, 'Perché', 'Il Distretto genera tantissimi dati. Il problema è ritrovarli.')
  const items = [
    ['Dati sparsi', 'Elenchi soci, service e cariche su file diversi, in formati poco leggibili.'],
    ['Difficili da consultare', 'Numeri in inglese e “grezzi”, non immediati per chi deve decidere.'],
    ['Report a mano', 'Preparare un quadro per club o circoscrizione richiede ore di lavoro.'],
  ]
  let x = 0.7
  items.forEach((it, i) => {
    s.addShape('roundRect', { x, y: 2.15, w: 3.9, h: 3.4, rectRadius: 0.1, fill: { color: SOFT }, line: { color: LINE, width: 1 } })
    circle(s, x + 0.35, 2.5, 0.7, i === 2 ? GOLD : BLUE, String(i + 1), WHITE, 20)
    s.addText(it[0], { x: x + 0.35, y: 3.35, w: 3.2, h: 0.5, fontFace: FH, fontSize: 19, bold: true, color: NAVY, margin: 0 })
    s.addText(it[1], { x: x + 0.35, y: 3.9, w: 3.25, h: 1.4, fontFace: F, fontSize: 14, color: INK, margin: 0, lineSpacingMultiple: 1.15 })
    x += 4.13
  })
  s.addText('DigitaLions nasce per risolvere esattamente questo.', { x: 0.7, y: 5.85, w: 12, h: 0.5, fontFace: FH, fontSize: 17, italic: true, bold: true, color: BLUE, margin: 0 })
  footer(s, 2)
}

// ---------- SLIDE 3 — cos'è + numeri a colpo d'occhio ----------
{
  const s = p.addSlide(); bgLight(s)
  header(s, 'Cos’è', 'Un’unica piattaforma web, già in produzione')
  s.addText([
    { text: 'I dati ufficiali del Distretto — ', options: {} },
    { text: 'chiari da leggere, protetti e sempre aggiornati', options: { bold: true, color: NAVY } },
    { text: ' — accessibili da computer, tablet e telefono, senza installare nulla.', options: {} },
  ], { x: 0.7, y: 1.75, w: 12, h: 0.9, fontFace: F, fontSize: 17, color: INK, margin: 0, lineSpacingMultiple: 1.15 })
  const stats = [
    ['93', 'Club'], ['2.951', 'Soci'], ['2.034', 'Incarichi officer'], ['6.861', 'Attività di servizio'],
  ]
  let x = 0.7
  stats.forEach((st) => {
    s.addShape('roundRect', { x, y: 2.95, w: 2.95, h: 1.9, rectRadius: 0.1, fill: { color: NAVY }, line: { type: 'none' } })
    s.addText(st[0], { x, y: 3.15, w: 2.95, h: 0.95, align: 'center', fontFace: FH, fontSize: 44, bold: true, color: WHITE, margin: 0 })
    s.addText(st[1].toUpperCase(), { x, y: 4.15, w: 2.95, h: 0.5, align: 'center', fontFace: FH, fontSize: 13, bold: true, color: 'FFD34D', charSpacing: 1, margin: 0 })
    x += 3.1
  })
  s.addText('Storico completo dal 2023 ad oggi, aggiornato in continuazione dai report ufficiali Lions.',
    { x: 0.7, y: 5.15, w: 12, h: 0.5, fontFace: F, fontSize: 14, italic: true, color: MUTE, margin: 0 })
  footer(s, 3)
}

// ---------- SLIDE 4 — cosa permette di fare ----------
{
  const s = p.addSlide(); bgLight(s)
  header(s, 'Le aree', 'Tutto ciò che serve, organizzato in aree')
  const rows = [
    ['Soci', 'Elenco completo, classificazione e contatti di ogni socio del Distretto.'],
    ['Attività di servizio', 'Lo storico dei service dei club, con impatto e valori ufficiali LCI.'],
    ['Officer', 'Le cariche dei club e i ruoli di leadership, anno per anno.'],
    ['Dashboard', 'Panoramiche e confronti per club, zona e circoscrizione.'],
    ['Rapporti & stampe', 'Classificazioni pronte da stampare in PDF o esportare in Excel.'],
  ]
  let y = 1.75
  rows.forEach((r, i) => {
    circle(s, 0.75, y, 0.62, i % 2 ? BLUE : NAVY, String(i + 1), WHITE, 17)
    s.addText(r[0], { x: 1.6, y: y - 0.02, w: 3.4, h: 0.62, valign: 'middle', fontFace: FH, fontSize: 18, bold: true, color: NAVY, margin: 0 })
    s.addText(r[1], { x: 5.1, y: y - 0.02, w: 7.5, h: 0.62, valign: 'middle', fontFace: F, fontSize: 15, color: INK, margin: 0 })
    y += 1.02
  })
  footer(s, 4)
}

// ---------- SLIDE 5 — impatto (WOW) ----------
{
  const s = p.addSlide(); bgDark(s)
  s.addText('L’IMPATTO DEL DISTRETTO, IN NUMERI', { x: 0.9, y: 0.7, w: 11.5, h: 0.4, fontFace: FH, fontSize: 14, bold: true, color: 'CADCFC', charSpacing: 2, margin: 0 })
  s.addText('Ciò che i club hanno realizzato dal 2023 ad oggi', { x: 0.9, y: 1.05, w: 11.5, h: 0.7, fontFace: FH, fontSize: 27, bold: true, color: WHITE, margin: 0 })
  const big = [
    ['667.282', 'persone servite'],
    ['269.107', 'ore di servizio'],
    ['93.525', 'volontari coinvolti'],
  ]
  let x = 0.9
  big.forEach((b) => {
    s.addText(b[0], { x, y: 2.1, w: 3.85, h: 1.0, align: 'center', fontFace: FH, fontSize: 46, bold: true, color: 'FFD34D', margin: 0 })
    s.addText(b[1], { x, y: 3.05, w: 3.85, h: 0.5, align: 'center', fontFace: F, fontSize: 15, color: 'E8EEF9', margin: 0 })
    x += 4.05
  })
  const money = [['$ 3,46 mln', 'donati (valori capped LCI)'], ['$ 4,55 mln', 'raccolti (valori capped LCI)']]
  x = 1.9
  money.forEach((m) => {
    s.addShape('roundRect', { x, y: 4.35, w: 4.6, h: 1.75, rectRadius: 0.12, fill: { color: '13325F' }, line: { color: '2A4E86', width: 1 } })
    s.addText(m[0], { x, y: 4.6, w: 4.6, h: 0.85, align: 'center', fontFace: FH, fontSize: 40, bold: true, color: WHITE, margin: 0 })
    s.addText(m[1], { x, y: 5.5, w: 4.6, h: 0.5, align: 'center', fontFace: F, fontSize: 14, color: 'CADCFC', margin: 0 })
    x += 4.9
  })
  s.addText('6.861 attività di servizio comunicate dai 93 club', { x: 0.9, y: 6.35, w: 11.5, h: 0.4, align: 'center', fontFace: F, fontSize: 14, italic: true, color: '9FB3D6', margin: 0 })
  s.addNotes('Questi non sono numeri astratti: è il bene che i nostri club hanno fatto sul territorio, ora finalmente misurabile e comunicabile in modo semplice.')
}

// ---------- SLIDE 6 — Soci ----------
{
  const s = p.addSlide(); bgLight(s)
  header(s, 'Soci', 'Ogni socio, ben classificato e raggiungibile')
  const pts = [
    ['Ricerca e filtri', 'Per club, zona, circoscrizione, classificazione, età e anzianità.'],
    ['Classificazione automatica', 'I codici tecnici Lions tradotti in categorie chiare: Effettivo, Fondatore, Leo-Lion…'],
    ['Contatti sempre a portata', 'Cellulare ed email reali di ogni socio, pronti all’uso.'],
    ['Stampa & Excel', 'Elenchi filtrati esportabili in un clic per il lavoro dei club.'],
  ]
  let y = 1.9
  pts.forEach((r) => {
    s.addShape('roundRect', { x: 0.7, y, w: 11.9, h: 1.05, rectRadius: 0.08, fill: { color: SOFT }, line: { type: 'none' } })
    s.addText(r[0], { x: 1.0, y: y + 0.12, w: 3.7, h: 0.8, valign: 'middle', fontFace: FH, fontSize: 17, bold: true, color: BLUE, margin: 0 })
    s.addText(r[1], { x: 4.8, y: y + 0.12, w: 7.6, h: 0.8, valign: 'middle', fontFace: F, fontSize: 14.5, color: INK, margin: 0 })
    y += 1.2
  })
  footer(s, 6)
}

// ---------- SLIDE 7 — Attività ----------
{
  const s = p.addSlide(); bgLight(s)
  header(s, 'Attività di servizio', 'Lo storico dei service, con i numeri che contano')
  const pts = [
    ['Filtro per anno sociale', 'Uno o più anni (1 lug → 30 giu), come ragiona davvero il Distretto.'],
    ['Valori ufficiali “capped” LCI', 'Gli stessi numeri dei report di Lions International, senza gonfiature.'],
    ['Amministrazione vs Service', 'Ogni club vede quanto dedica al servizio e quanto alla gestione.'],
    ['Totali e subtotali', 'Persone, volontari, ore e fondi, riepilogati e stampabili.'],
  ]
  let y = 1.95
  pts.forEach((r, i) => {
    circle(s, 0.75, y, 0.6, i % 2 ? GOLD : BLUE, String(i + 1), WHITE, 16)
    s.addText([{ text: r[0] + '  ', options: { bold: true, color: NAVY } }, { text: r[1], options: { color: INK } }],
      { x: 1.55, y: y - 0.05, w: 11, h: 0.75, valign: 'middle', fontFace: F, fontSize: 15.5, margin: 0 })
    y += 1.05
  })
  footer(s, 7)
}

// ---------- SLIDE 8 — Officer & ruoli ----------
{
  const s = p.addSlide(); bgLight(s)
  header(s, 'Officer & Leadership', 'Le cariche dei club, sempre chiare')
  s.addText('Elenco completo degli incarichi ufficiali, con nominativo, contatti e periodo del mandato — filtrabile per club, zona, circoscrizione e anno sociale.',
    { x: 0.7, y: 1.8, w: 12, h: 0.8, fontFace: F, fontSize: 16, color: INK, margin: 0, lineSpacingMultiple: 1.15 })
  s.addShape('roundRect', { x: 0.7, y: 2.85, w: 11.9, h: 2.9, rectRadius: 0.1, fill: { color: SOFT }, line: { color: LINE, width: 1 } })
  s.addText('Prospetto “Ruoli di Leadership del Club”', { x: 1.0, y: 3.1, w: 11.3, h: 0.5, fontFace: FH, fontSize: 18, bold: true, color: NAVY, margin: 0 })
  s.addText('Per ogni club, il quadro dei ruoli statutari LCI (Presidente, Vice, Segretario, Tesoriere, GST, GMT, GLT, LCIF…): chi ricopre ogni carica e quali posizioni restano scoperte.',
    { x: 1.0, y: 3.6, w: 11.3, h: 1.0, fontFace: F, fontSize: 14.5, color: INK, margin: 0, lineSpacingMultiple: 1.15 })
  s.addText([
    { text: 'A colpo d’occhio: ', options: { bold: true, color: BLUE } },
    { text: 'un Presidente di Zona capisce subito se un club ha nominato tutte le persone chiave o se mancano ruoli.', options: { color: INK, italic: true } },
  ], { x: 1.0, y: 4.75, w: 11.3, h: 0.8, fontFace: F, fontSize: 14.5, margin: 0, lineSpacingMultiple: 1.1 })
  footer(s, 8)
}

// ---------- SLIDE 9 — accesso & ruoli ----------
{
  const s = p.addSlide(); bgLight(s)
  header(s, 'Accesso', 'Ognuno vede ciò che gli compete')
  const roles = [
    ['Super-Admin', 'Gestione completa (staff 01 Informatica e referenti del Distretto)'],
    ['Comitato GST', 'Approva e gestisce le attività della propria area'],
    ['Presidenti Circ./Zona', 'Consultano i dati del proprio ambito'],
    ['Socio', 'Consulta il proprio Club'],
  ]
  let y = 1.9
  roles.forEach((r, i) => {
    s.addShape('roundRect', { x: 0.7, y, w: 5.9, h: 1.15, rectRadius: 0.08, fill: { color: i === 0 ? NAVY : SOFT }, line: { type: 'none' } })
    s.addText(r[0], { x: 0.95, y: y + 0.12, w: 5.4, h: 0.45, fontFace: FH, fontSize: 16, bold: true, color: i === 0 ? 'FFD34D' : NAVY, margin: 0 })
    s.addText(r[1], { x: 0.95, y: y + 0.55, w: 5.45, h: 0.5, fontFace: F, fontSize: 12.5, color: i === 0 ? 'E8EEF9' : INK, margin: 0 })
    y += 1.3
  })
  // colonna destra: registrazione
  s.addShape('roundRect', { x: 6.95, y: 1.9, w: 5.65, h: 3.75, rectRadius: 0.1, fill: { color: SOFT }, line: { color: LINE, width: 1 } })
  s.addText('Come ci si registra', { x: 7.25, y: 2.15, w: 5, h: 0.5, fontFace: FH, fontSize: 18, bold: true, color: NAVY, margin: 0 })
  const steps = ['Vai su digitalions108la.it → “Registrati”', 'Inserisci email, password e la tua matricola', 'Confermi l’email: l’account è attivo', 'Il sistema ti assegna il ruolo giusto in automatico']
  s.addText(steps.map((t, i) => ({ text: t, options: { bullet: { characterCode: '2022' }, breakLine: i !== steps.length - 1, paraSpaceAfter: 10 } })),
    { x: 7.35, y: 2.7, w: 5.05, h: 2.8, fontFace: F, fontSize: 14.5, color: INK, margin: 0 })
  footer(s, 9)
}

// ---------- SLIDE 10 — sicurezza ----------
{
  const s = p.addSlide(); bgLight(s)
  header(s, 'Sicurezza & dati', 'Dati protetti, ognuno al proprio posto')
  const pts = [
    ['Accesso per ruolo', 'La separazione è garantita a livello di database, non solo “a schermo”.'],
    ['Dati personali tutelati', 'Contatti e anagrafiche visibili solo a chi ne ha diritto.'],
    ['Solo lettura dall’esterno', 'Nessuno, da fuori, può modificare o cancellare dati (verificato).'],
    ['Connessione cifrata (HTTPS)', 'Traffico protetto su tutta la piattaforma.'],
    ['Backup giornaliero cifrato', 'Copia di sicurezza automatica, conservata 90 giorni.'],
    ['Cloud gestito', 'Nessun server da gestire per il Distretto, costi contenuti.'],
  ]
  let x = 0.7, y = 1.95
  pts.forEach((r, i) => {
    s.addShape('roundRect', { x, y, w: 5.85, h: 1.4, rectRadius: 0.08, fill: { color: SOFT }, line: { type: 'none' } })
    s.addText(r[0], { x: x + 0.28, y: y + 0.15, w: 5.3, h: 0.45, fontFace: FH, fontSize: 15.5, bold: true, color: BLUE, margin: 0 })
    s.addText(r[1], { x: x + 0.28, y: y + 0.6, w: 5.35, h: 0.7, fontFace: F, fontSize: 13, color: INK, margin: 0, lineSpacingMultiple: 1.1 })
    if (i % 2 === 0) { x += 6.05 } else { x = 0.7; y += 1.55 }
  })
  footer(s, 10)
}

// ---------- SLIDE 11 — come si accede ----------
{
  const s = p.addSlide(); bgDark(s)
  s.addText('PROVATELO OGGI', { x: 0.9, y: 1.6, w: 11, h: 0.4, fontFace: FH, fontSize: 14, bold: true, color: 'CADCFC', charSpacing: 3, margin: 0 })
  s.addText('È già online, per tutti i soci', { x: 0.9, y: 2.0, w: 11.5, h: 0.9, fontFace: FH, fontSize: 34, bold: true, color: WHITE, margin: 0 })
  s.addShape('roundRect', { x: 0.9, y: 3.15, w: 5.2, h: 0.85, rectRadius: 0.42, fill: { color: GOLD }, line: { type: 'none' } })
  s.addText('digitalions108la.it', { x: 0.9, y: 3.15, w: 5.2, h: 0.85, align: 'center', valign: 'middle', fontFace: FH, fontSize: 26, bold: true, color: NAVY, margin: 0 })
  s.addText('Da computer, tablet o smartphone. Basta la matricola di socio per registrarsi.',
    { x: 0.9, y: 4.3, w: 9.5, h: 0.8, fontFace: F, fontSize: 18, color: 'E8EEF9', margin: 0, lineSpacingMultiple: 1.15 })
  s.addNotes('Invito tutti i club a registrarsi e a usarlo: più lo usiamo, più i dati del Distretto sono completi e utili a tutti.')
}

// ---------- SLIDE 12 — chiusura ----------
{
  const s = p.addSlide(); bgDark(s)
  s.addShape('ellipse', { x: -1.4, y: 4.6, w: 4.4, h: 4.4, fill: { color: BLUE, transparency: 80 }, line: { type: 'none' } })
  s.addText('DigitaLions', { x: 0.9, y: 2.55, w: 11.5, h: 1.1, align: 'center', fontFace: FH, fontSize: 58, bold: true, color: WHITE, margin: 0 })
  s.addText([
    { text: 'We Serve. ', options: { color: 'FFD34D', bold: true } },
    { text: 'Anche digitalmente.', options: { color: WHITE } },
  ], { x: 0.9, y: 3.8, w: 11.5, h: 0.7, align: 'center', fontFace: FH, fontSize: 26, italic: true, margin: 0 })
  s.addText('Grazie.  ·  digitalions108la.it  ·  Distretto Lions 108 LA', { x: 0.9, y: 5.0, w: 11.5, h: 0.4, align: 'center', fontFace: F, fontSize: 14, color: 'CADCFC', margin: 0 })
}

const out = path.join(__dirname, 'DigitaLions-Presentazione.pptx')
p.writeFile({ fileName: out }).then(() => console.log('OK ->', out)).catch((e) => { console.error(e); process.exit(1) })
