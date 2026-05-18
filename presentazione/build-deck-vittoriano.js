// Digitalions · Pitch deck per il Congresso Lions
// Tono semplice, motivazionale, di servizio. Niente costi.
const pptxgen = require("pptxgenjs")

const pres = new pptxgen()
pres.layout = "LAYOUT_16x9"
pres.author = "01Informatica"
pres.title = "Digitalions · al Congresso Lions"
pres.subject = "Digitalions: uno strumento al servizio del Distretto 108 LA"

const C = {
  navy: "0A1733", navyMid: "162447",
  blue: "0055FF", gold: "FFE500", goldDeep: "F5B606",
  white: "FFFFFF", off: "F8FAFC",
  grayLight: "E2E8F0", gray: "64748B", grayDark: "334155", ink: "0F172A",
  green: "059669",
}
const F = { header: "Trebuchet MS", body: "Calibri" }

const card = (slide, x, y, w, h, fillColor, opts = {}) => {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: fillColor },
    line: opts.borderColor ? { color: opts.borderColor, width: 1 } : { type: "none" },
    rectRadius: 0.1,
    shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  })
}

const TOTAL = 7

// ================================================================
// SLIDE 1 — COVER
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.navy }

  s.addShape(pres.shapes.OVAL, {
    x: 6.5, y: -2, w: 7, h: 7, fill: { color: C.blue, transparency: 75 }, line: { type: "none" },
  })
  s.addShape(pres.shapes.OVAL, {
    x: -2, y: 3, w: 5, h: 5, fill: { color: C.gold, transparency: 88 }, line: { type: "none" },
  })

  s.addText("DISTRETTO LIONS 108 LA", {
    x: 0.5, y: 0.55, w: 9, h: 0.3,
    fontFace: F.body, fontSize: 11, color: C.gold, bold: true, charSpacing: 4,
  })

  s.addText("Digitalions", {
    x: 0.5, y: 1.45, w: 9, h: 1.4,
    fontFace: F.header, fontSize: 80, bold: true, color: C.white, margin: 0,
  })
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 2.85, w: 1.2, h: 0.06, fill: { color: C.gold }, line: { type: "none" },
  })

  s.addText("Uno strumento al servizio del nostro Distretto", {
    x: 0.5, y: 3.15, w: 9, h: 0.5,
    fontFace: F.body, fontSize: 20, color: C.grayLight, italic: true,
  })

  // URL box
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 4.2, w: 4.5, h: 0.55, fill: { color: C.navyMid }, line: { color: C.gold, width: 1 }, rectRadius: 0.08,
  })
  s.addText("🌐  digitalions108la.it", {
    x: 0.6, y: 4.2, w: 4.3, h: 0.55,
    fontFace: F.header, fontSize: 16, bold: true, color: C.gold, margin: 0, valign: "middle",
  })

  s.addText("Per i Lions, dai Lions", {
    x: 5.5, y: 4.2, w: 4.2, h: 0.55,
    fontFace: F.body, fontSize: 14, italic: true, color: C.white, align: "right", valign: "middle", margin: 0,
  })

  s.addText("Maggio 2026", {
    x: 0.5, y: 5.25, w: 9.2, h: 0.25,
    fontFace: F.body, fontSize: 10, color: C.gray, align: "right", italic: true,
  })
}

// ================================================================
// SLIDE 2 — PERCHÉ NASCE
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }

  s.addText("Perché nasce Digitalions", {
    x: 0.5, y: 0.45, w: 9, h: 0.6,
    fontFace: F.header, fontSize: 28, bold: true, color: C.ink, margin: 0,
  })

  // Big quote
  s.addText("“", {
    x: 0.5, y: 1.3, w: 1, h: 1.2,
    fontFace: F.header, fontSize: 96, color: C.gold, bold: true, margin: 0,
  })
  s.addText("Quanto tempo passiamo a contare soci, attività e ore di servizio, a compilare moduli e tabelle... quando potremmo dedicarci al servizio vero?", {
    x: 1.5, y: 1.5, w: 8, h: 1.6,
    fontFace: F.header, fontSize: 22, italic: true, color: C.ink, margin: 0, valign: "top",
  })

  // Three bullets
  const points = [
    { icon: "📋", t: "Moduli e fogli Excel diversi per ogni Club" },
    { icon: "⏱️", t: "Ore spese in contabilità invece che in service" },
    { icon: "🤷", t: "Difficile vedere il quadro d'insieme del Distretto" },
  ]
  points.forEach((p, i) => {
    const x = 0.5 + i * 3.05
    const y = 3.6
    card(s, x, y, 2.9, 1.35, C.white, { borderColor: C.grayLight })
    s.addText(p.icon, {
      x: x + 0.15, y: y + 0.15, w: 0.5, h: 0.5, fontSize: 28, valign: "middle", margin: 0,
    })
    s.addText(p.t, {
      x: x + 0.75, y: y + 0.1, w: 2.1, h: 1.15,
      fontFace: F.body, fontSize: 12, color: C.grayDark, margin: 0, valign: "middle",
    })
  })

  s.addText("Digitalions · digitalions108la.it", {
    x: 0.5, y: 5.32, w: 7, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, italic: true,
  })
  s.addText(`2 / ${TOTAL}`, {
    x: 9.0, y: 5.32, w: 0.85, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, align: "right",
  })
}

// ================================================================
// SLIDE 3 — COS'È
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.navy }

  s.addText("Cos'è Digitalions, in una frase", {
    x: 0.5, y: 0.55, w: 9, h: 0.6,
    fontFace: F.header, fontSize: 24, bold: true, color: C.gold, margin: 0,
  })

  s.addText("Un sito web semplice da usare,", {
    x: 0.5, y: 1.55, w: 9, h: 0.55,
    fontFace: F.header, fontSize: 30, color: C.white, margin: 0,
  })
  s.addText("dove ogni Lion del Distretto", {
    x: 0.5, y: 2.15, w: 9, h: 0.55,
    fontFace: F.header, fontSize: 30, color: C.white, margin: 0,
  })
  s.addText("trova in due click", {
    x: 0.5, y: 2.75, w: 9, h: 0.55,
    fontFace: F.header, fontSize: 30, color: C.white, margin: 0,
  })

  s.addText("soci · incarichi · attività · numeri del Distretto.", {
    x: 0.5, y: 3.45, w: 9, h: 0.7,
    fontFace: F.header, fontSize: 32, bold: true, color: C.gold, margin: 0,
  })

  // URL highlight
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 2.5, y: 4.55, w: 5, h: 0.55, fill: { color: C.navyMid }, line: { color: C.gold, width: 1 }, rectRadius: 0.08,
  })
  s.addText("digitalions108la.it", {
    x: 2.5, y: 4.55, w: 5, h: 0.55,
    fontFace: F.header, fontSize: 18, bold: true, color: C.white, align: "center", margin: 0, valign: "middle",
  })

  s.addText("Digitalions · digitalions108la.it", {
    x: 0.5, y: 5.32, w: 7, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, italic: true,
  })
  s.addText(`3 / ${TOTAL}`, {
    x: 9.0, y: 5.32, w: 0.85, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, align: "right",
  })
}

// ================================================================
// SLIDE 4 — COSA FA (4 cose semplici)
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }

  s.addText("Cosa puoi fare con Digitalions", {
    x: 0.5, y: 0.45, w: 9, h: 0.6,
    fontFace: F.header, fontSize: 26, bold: true, color: C.ink, margin: 0,
  })
  s.addText("Quattro cose semplici, alla portata di chiunque, anche dal telefono", {
    x: 0.5, y: 1.05, w: 9, h: 0.3,
    fontFace: F.body, fontSize: 13, italic: true, color: C.gray, margin: 0,
  })

  const things = [
    { icon: "👥", t: "Vedi i Soci",     d: "Tutti i soci del tuo Club e del Distretto. Filtri per età, anzianità lionistica, professione, città." },
    { icon: "🎖️", t: "Vedi gli Officer", d: "Chi è Presidente, Vice, Segretario, Tesoriere, in qualsiasi Club e in qualsiasi Zona." },
    { icon: "🤝", t: "Vedi le Attività", d: "Tutte le attività di service fatte dai Club: persone aiutate, ore donate, fondi raccolti." },
    { icon: "📊", t: "Stampi i Quadri",  d: "Quadri ufficiali pronti in PDF: soci per età, anzianità, cariche, attività dell'anno sociale." },
  ]
  things.forEach((it, i) => {
    const row = Math.floor(i / 2), col = i % 2
    const x = 0.5 + col * 4.6
    const y = 1.5 + row * 1.85
    card(s, x, y, 4.4, 1.7, C.white, { borderColor: C.grayLight })
    s.addText(it.icon, {
      x: x + 0.2, y: y + 0.4, w: 0.9, h: 0.9, fontSize: 44, valign: "middle", margin: 0,
    })
    s.addText(it.t, {
      x: x + 1.25, y: y + 0.2, w: 3.0, h: 0.5,
      fontFace: F.header, fontSize: 17, bold: true, color: C.ink, margin: 0,
    })
    s.addText(it.d, {
      x: x + 1.25, y: y + 0.7, w: 3.0, h: 0.95,
      fontFace: F.body, fontSize: 11.5, color: C.grayDark, margin: 0, valign: "top",
    })
  })

  s.addText("Digitalions · digitalions108la.it", {
    x: 0.5, y: 5.32, w: 7, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, italic: true,
  })
  s.addText(`4 / ${TOTAL}`, {
    x: 9.0, y: 5.32, w: 0.85, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, align: "right",
  })
}

// ================================================================
// SLIDE 5 — IL NOSTRO DISTRETTO IN NUMERI
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.navy }

  s.addText("Il nostro Distretto, in numeri", {
    x: 0.5, y: 0.55, w: 9, h: 0.6,
    fontFace: F.header, fontSize: 28, bold: true, color: C.white, margin: 0,
  })
  s.addText("Tutti già presenti in Digitalions · anno sociale 2025/26", {
    x: 0.5, y: 1.2, w: 9, h: 0.35,
    fontFace: F.body, fontSize: 13, italic: true, color: C.grayLight, margin: 0,
  })

  const stats = [
    { num: "92",    label: "Club", color: C.gold },
    { num: "2.966", label: "Soci Lions", color: C.blue },
    { num: "1.297", label: "Incarichi attivi", color: C.gold },
    { num: "1.606", label: "Attività di servizio", color: C.blue },
  ]
  stats.forEach((st, i) => {
    const x = 0.5 + i * 2.32
    const y = 1.85
    card(s, x, y, 2.15, 2.5, C.navyMid)
    s.addText(st.num, {
      x: x + 0.1, y: y + 0.25, w: 1.95, h: 1.1,
      fontFace: F.header, fontSize: 50, bold: true, color: st.color, align: "center", margin: 0, valign: "middle",
    })
    s.addText(st.label, {
      x: x + 0.1, y: y + 1.55, w: 1.95, h: 0.85,
      fontFace: F.body, fontSize: 13, color: C.white, align: "center", margin: 0, valign: "top",
    })
  })

  s.addText("Persone reali, attività reali, service reale.", {
    x: 0.5, y: 4.7, w: 9, h: 0.4,
    fontFace: F.header, fontSize: 16, color: C.gold, italic: true, align: "center", bold: true,
  })

  s.addText("Digitalions · digitalions108la.it", {
    x: 0.5, y: 5.32, w: 7, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, italic: true,
  })
  s.addText(`5 / ${TOTAL}`, {
    x: 9.0, y: 5.32, w: 0.85, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, align: "right",
  })
}

// ================================================================
// SLIDE 6 — INSIEME CRESCIAMO
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }

  s.addText("Insieme cresciamo", {
    x: 0.5, y: 0.45, w: 9, h: 0.6,
    fontFace: F.header, fontSize: 28, bold: true, color: C.ink, margin: 0,
  })
  s.addText("Digitalions è già operativo, ma per essere completo ha bisogno di un piccolo aiuto dal Multidistretto", {
    x: 0.5, y: 1.05, w: 9, h: 0.35,
    fontFace: F.body, fontSize: 13, italic: true, color: C.gray, margin: 0,
  })

  // Left: what we have
  card(s, 0.5, 1.6, 4.4, 3.3, C.white, { borderColor: C.green })
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.6, w: 4.4, h: 0.5, fill: { color: C.green }, line: { type: "none" },
  })
  s.addText("✓  QUELLO CHE GIÀ FUNZIONA", {
    x: 0.7, y: 1.65, w: 4.0, h: 0.4,
    fontFace: F.body, fontSize: 11, bold: true, color: C.white, charSpacing: 2, margin: 0, valign: "middle",
  })
  s.addText([
    { text: "Tutti i 92 Club del Distretto", options: { bullet: true, breakLine: true } },
    { text: "Tutti i soci con i loro dati", options: { bullet: true, breakLine: true } },
    { text: "Tutti gli incarichi ufficiali in corso", options: { bullet: true, breakLine: true } },
    { text: "Tutte le attività di service comunicate", options: { bullet: true, breakLine: true } },
    { text: "Quadri stampabili in PDF", options: { bullet: true } },
  ], {
    x: 0.7, y: 2.25, w: 4.0, h: 2.55,
    fontFace: F.body, fontSize: 12, color: C.grayDark, paraSpaceAfter: 6,
  })

  // Right: what we need from MD
  card(s, 5.1, 1.6, 4.4, 3.3, C.white, { borderColor: C.gold })
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.6, w: 4.4, h: 0.5, fill: { color: C.gold }, line: { type: "none" },
  })
  s.addText("🤝  COSA CI SERVIREBBE DAL MD", {
    x: 5.3, y: 1.65, w: 4.0, h: 0.4,
    fontFace: F.body, fontSize: 11, bold: true, color: C.navy, charSpacing: 2, margin: 0, valign: "middle",
  })
  s.addText("Due piccoli file aggiuntivi dall'export Lions, già esistenti nei sistemi LCI:", {
    x: 5.3, y: 2.2, w: 4.0, h: 0.5,
    fontFace: F.body, fontSize: 11, color: C.grayDark, italic: true, margin: 0,
  })
  s.addText([
    { text: "Elenco dei soci che escono ogni anno (con la data e il motivo)", options: { bullet: true, breakLine: true } },
    { text: "Storico dei club (nuovi, riorganizzati, chiusi)", options: { bullet: true } },
  ], {
    x: 5.3, y: 2.85, w: 4.0, h: 1.4,
    fontFace: F.body, fontSize: 12, color: C.grayDark, paraSpaceAfter: 6,
  })
  s.addText("Con questi due dati Digitalions diventa lo specchio completo del Distretto.", {
    x: 5.3, y: 4.3, w: 4.0, h: 0.5,
    fontFace: F.body, fontSize: 11, color: C.navy, italic: true, bold: true, margin: 0,
  })

  s.addText("Digitalions · digitalions108la.it", {
    x: 0.5, y: 5.32, w: 7, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, italic: true,
  })
  s.addText(`6 / ${TOTAL}`, {
    x: 9.0, y: 5.32, w: 0.85, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, align: "right",
  })
}

// ================================================================
// SLIDE 7 — WE SERVE, ANCHE DIGITALMENTE
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.navy }
  s.addShape(pres.shapes.OVAL, {
    x: 7, y: 3.5, w: 5, h: 5, fill: { color: C.gold, transparency: 80 }, line: { type: "none" },
  })
  s.addShape(pres.shapes.OVAL, {
    x: -2, y: -2, w: 5, h: 5, fill: { color: C.blue, transparency: 70 }, line: { type: "none" },
  })

  s.addText("We Serve.", {
    x: 0.5, y: 1.0, w: 9, h: 1.2,
    fontFace: F.header, fontSize: 80, bold: true, color: C.white, margin: 0,
  })
  s.addText("Anche digitalmente.", {
    x: 0.5, y: 2.2, w: 9, h: 0.9,
    fontFace: F.header, fontSize: 56, bold: true, color: C.gold, margin: 0,
  })

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 3.25, w: 1.5, h: 0.06, fill: { color: C.gold }, line: { type: "none" },
  })

  s.addText("Digitalions è qui. È vostro. Provatelo, sui vostri Club, e portatelo nei vostri Distretti.", {
    x: 0.5, y: 3.55, w: 9, h: 0.7,
    fontFace: F.body, fontSize: 17, italic: true, color: C.grayLight, margin: 0,
  })

  // URL
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 4.55, w: 9, h: 0.6, fill: { color: C.navyMid }, line: { color: C.gold, width: 1 }, rectRadius: 0.1,
  })
  s.addText("🌐  digitalions108la.it", {
    x: 0.5, y: 4.55, w: 9, h: 0.6,
    fontFace: F.header, fontSize: 20, bold: true, color: C.gold, align: "center", margin: 0, valign: "middle",
  })

  s.addText("Distretto Lions 108 LA · Maggio 2026", {
    x: 0.5, y: 5.3, w: 9.2, h: 0.22,
    fontFace: F.body, fontSize: 9, color: C.gray, italic: true, align: "right",
  })
}

// === WRITE ===
const outPath = "C:/Users/f.coppini/Documents/Progetti/ServiceScore/presentazione/Digitalions-Congresso-Lions.pptx"
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("OK ->", outPath)
})
