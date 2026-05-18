// Digitalions · Slide deck snello per il Direttivo Lions 108 LA
// 9 slide · focus: cosa è già pronto e soprattutto cosa manca da fare
const pptxgen = require("pptxgenjs")

const pres = new pptxgen()
pres.layout = "LAYOUT_16x9" // 10" x 5.625"
pres.author = "01Informatica"
pres.title = "Digitalions · Riunione Direttivo 108 LA"
pres.subject = "Digitalions: stato del progetto e cosa manca da fare"

// === Palette ===
const C = {
  navy: "0A1733",
  navyMid: "162447",
  blue: "0055FF",
  gold: "FFE500",
  goldDeep: "F5B606",
  white: "FFFFFF",
  off: "F8FAFC",
  grayLight: "E2E8F0",
  gray: "64748B",
  grayDark: "334155",
  ink: "0F172A",
  green: "059669",
  red: "DC2626",
  orange: "EA580C",
  purple: "7C3AED",
}
const F = { header: "Trebuchet MS", body: "Calibri", mono: "Consolas" }
const TOTAL = 10

// ============ HELPERS ============
const titleBar = (slide, txt, opts = {}) => {
  slide.addText(txt, {
    x: 0.5, y: 0.35, w: 9, h: 0.55,
    fontFace: F.header, fontSize: 26, bold: true, color: C.ink, margin: 0, ...opts,
  })
}
const subtitleText = (slide, txt, opts = {}) => {
  slide.addText(txt, {
    x: 0.5, y: 0.92, w: 9, h: 0.32,
    fontFace: F.body, fontSize: 13, italic: true, color: C.gray, margin: 0, ...opts,
  })
}
const pageNumber = (slide, n) => {
  slide.addText(`${n} / ${TOTAL}`, {
    x: 9.0, y: 5.32, w: 0.85, h: 0.22,
    fontFace: F.body, fontSize: 9, color: C.gray, align: "right",
  })
}
const footerTag = (slide, color = C.gray) => {
  slide.addText("Digitalions · digitalions108la.it · Distretto Lions 108 LA", {
    x: 0.5, y: 5.32, w: 7, h: 0.22,
    fontFace: F.body, fontSize: 9, color, italic: true,
  })
}
const card = (slide, x, y, w, h, fillColor, opts = {}) => {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: fillColor },
    line: opts.borderColor ? { color: opts.borderColor, width: 1 } : { type: "none" },
    rectRadius: 0.1,
    shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  })
}

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

  s.addText("LIONS CLUB · DISTRETTO 108 LA", {
    x: 0.5, y: 0.55, w: 9, h: 0.3,
    fontFace: F.body, fontSize: 11, color: C.gold, bold: true, charSpacing: 4,
  })

  s.addText("Digitalions", {
    x: 0.5, y: 1.45, w: 9, h: 1.4,
    fontFace: F.header, fontSize: 76, bold: true, color: C.white, margin: 0,
  })
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 2.78, w: 1.2, h: 0.06, fill: { color: C.gold }, line: { type: "none" },
  })

  s.addText("Stato del progetto e cosa manca da fare", {
    x: 0.5, y: 3.05, w: 9, h: 0.5,
    fontFace: F.body, fontSize: 18, color: C.grayLight, italic: true,
  })

  // URL box
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 4.05, w: 4.2, h: 0.6, fill: { color: C.navyMid }, line: { color: C.gold, width: 1 }, rectRadius: 0.08,
  })
  s.addText("🌐  ", {
    x: 0.6, y: 4.05, w: 0.4, h: 0.6, fontSize: 18, valign: "middle", margin: 0,
  })
  s.addText("digitalions108la.it", {
    x: 1.0, y: 4.05, w: 3.6, h: 0.6,
    fontFace: F.mono, fontSize: 15, bold: true, color: C.gold, margin: 0, valign: "middle",
  })

  s.addText("Riunione del Direttivo · Maggio 2026", {
    x: 5.0, y: 4.05, w: 4.7, h: 0.6,
    fontFace: F.body, fontSize: 13, color: C.white, align: "right", margin: 0, valign: "middle",
  })

  s.addText("01Informatica · Sviluppo & manutenzione", {
    x: 0.5, y: 5.25, w: 9.2, h: 0.25,
    fontFace: F.body, fontSize: 10, color: C.gray, align: "right", italic: true,
  })
}

// ================================================================
// SLIDE 2 — COSA E' GIA' PRONTO
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }
  titleBar(s, "Cosa è già pronto e online")
  subtitleText(s, "Live su digitalions108la.it · usabile oggi, da PC, tablet e telefono")

  // KPI strip in alto
  const kpis = [
    { num: "92", label: "Club" },
    { num: "2.966", label: "Soci" },
    { num: "1.297", label: "Officer" },
    { num: "1.606", label: "Attività FY" },
  ]
  kpis.forEach((k, i) => {
    const x = 0.5 + i * 2.32
    card(s, x, 1.45, 2.15, 1.0, C.navy)
    s.addText(k.num, {
      x: x + 0.1, y: 1.5, w: 1.95, h: 0.55,
      fontFace: F.header, fontSize: 26, bold: true, color: C.gold, align: "center", margin: 0, valign: "middle",
    })
    s.addText(k.label.toUpperCase(), {
      x: x + 0.1, y: 2.05, w: 1.95, h: 0.32,
      fontFace: F.body, fontSize: 10, color: C.white, align: "center", charSpacing: 2, margin: 0, bold: true,
    })
  })

  // Check list (2 colonne)
  const items = [
    "Dashboard FY/PFY con KPI Club / Membership / Service",
    "Sezione Soci: 13 colonne · filtri · sort · paginazione",
    "3 Quadri di Riordino Soci stampabili in PDF",
    "Sezione Officer + Quadro Incarichi raggruppato",
    "Sezione Attività: 14 colonne · 25+ filtri · totali aggregati",
    "2 Quadri di stampa Attività per anno sociale",
    "Stampa / Salva PDF su ogni pagina · responsive mobile",
    "Pipeline CSV Lions robusta · sicurezza RLS · backup",
  ]
  items.forEach((it, i) => {
    const row = Math.floor(i / 2), col = i % 2
    const x = 0.5 + col * 4.6
    const y = 2.7 + row * 0.6
    // checkmark circle
    s.addShape(pres.shapes.OVAL, {
      x, y: y + 0.05, w: 0.3, h: 0.3, fill: { color: C.green }, line: { type: "none" },
    })
    s.addText("✓", {
      x, y: y + 0.05, w: 0.3, h: 0.3,
      fontFace: F.header, fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle", margin: 0,
    })
    s.addText(it, {
      x: x + 0.4, y, w: 4.1, h: 0.45,
      fontFace: F.body, fontSize: 11, color: C.grayDark, margin: 0, valign: "middle",
    })
  })

  footerTag(s)
  pageNumber(s, 2)
}

// ================================================================
// SLIDE 3 — LA DASHBOARD DEL DISTRETTO
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }
  titleBar(s, "La Dashboard · il quadro d'insieme del Distretto")
  subtitleText(s, "Tutto a colpo d'occhio: dal totale Distretto fino al singolo Club, in un'unica pagina")

  const blocks = [
    {
      n: "1",
      color: C.blue,
      title: "Indicatori del Distretto · FY vs PFY",
      desc: "Tre pannelli in alto con KPI di sintesi (Club Metrics, Membership Metrics, Service Metrics) calcolati sull'anno sociale in corso e confrontati con il precedente.",
    },
    {
      n: "2",
      color: C.purple,
      title: "Grafici annuali progressivi",
      desc: "Andamento mensile del numero soci (Lug→Giu, FY vs PFY) e delle attività di servizio per causa. Tabella riepilogo: numero, % e fondi raccolti per ciascuna causa.",
    },
    {
      n: "3",
      color: C.green,
      title: "Dashboard Soci per Club  ✨ nuovo",
      desc: "Selezioni un Club e vedi la sua composizione anagrafica: Fasce d'età (Under 50, 50-60, 60-70, Over 70) e Anzianità lionistica (Under 2, 2-5, 5-10, 10-15, 15-20, Over 20). Con quantità e %.",
    },
    {
      n: "4",
      color: C.orange,
      title: "Dashboard Attività per Club  ✨ nuovo",
      desc: "Per il Club selezionato nell'anno sociale: numero attività, persone servite, volontari, ore. Divise in Amministrazione vs Service con % rispetto al totale del Club.",
    },
    {
      n: "5",
      color: C.gold,
      title: "Distribuzione storica complessiva",
      desc: "Pie chart per Genere e Fascia d'età · Bar chart attività per Causa e Zona · Tabella delle ultime 10 attività comunicate.",
    },
  ]
  blocks.forEach((b, i) => {
    const y = 1.55 + i * 0.7
    card(s, 0.5, y, 9, 0.65, C.white, { borderColor: C.grayLight })
    // Number badge
    s.addShape(pres.shapes.OVAL, {
      x: 0.65, y: y + 0.13, w: 0.4, h: 0.4, fill: { color: b.color }, line: { type: "none" },
    })
    s.addText(b.n, {
      x: 0.65, y: y + 0.13, w: 0.4, h: 0.4,
      fontFace: F.header, fontSize: 17, bold: true, color: C.white, align: "center", valign: "middle", margin: 0,
    })
    s.addText(b.title, {
      x: 1.25, y: y + 0.08, w: 8.0, h: 0.3,
      fontFace: F.header, fontSize: 12.5, bold: true, color: C.ink, margin: 0,
    })
    s.addText(b.desc, {
      x: 1.25, y: y + 0.38, w: 8.0, h: 0.28,
      fontFace: F.body, fontSize: 9.5, color: C.grayDark, margin: 0, valign: "top",
    })
  })

  footerTag(s)
  pageNumber(s, 3)
}

// ================================================================
// SLIDE 4 — QUADRI PDF DISPONIBILI OGGI
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }
  titleBar(s, "Quadri PDF già disponibili oggi")
  subtitleText(s, "6 report stampabili in PDF dal pulsante \"Stampa / Salva PDF\" presente in ogni pagina")

  const sections = [
    {
      title: "SEZIONE SOCI",
      count: 3,
      color: C.blue,
      quadri: [
        { icon: "📅", t: "Per Fasce di Età",
          d: "Matricola, Titolo, Nome, Cognome, Compleanno, Età. Ordinato per età crescente. Filtro range età.",
          path: "/soci/quadri/eta" },
        { icon: "🏅", t: "Per Anzianità Lionistica",
          d: "Nome, Cognome, Data Ingresso, Anni di anzianità. Ordinato dai più anziani.",
          path: "/soci/quadri/anzianita" },
        { icon: "📋", t: "Caratteristiche Associative",
          d: "Tipo Associazione, Categoria, Programma, Cognome, Nome. Filtri multi.",
          path: "/soci/quadri/caratteristiche" },
      ],
    },
    {
      title: "SEZIONE OFFICER",
      count: 1,
      color: C.goldDeep,
      quadri: [
        { icon: "📑", t: "Incarichi con Nomine dai Club",
          d: "Titolo Ufficiale, Nome Club, Zona, Circ., Cognome, Nome. Toggle \"Raggruppa per titolo\" — una tabella per ciascun incarico (es. tutti i Presidenti, tutti i Tesorieri). Filtro \"Solo incarichi attivi\".",
          path: "/officer/quadri/incarichi-club" },
      ],
    },
    {
      title: "SEZIONE ATTIVITÀ",
      count: 2,
      color: C.purple,
      quadri: [
        { icon: "📊", t: "Tutte le attività · Club / Anno",
          d: "11 colonne: Data, Stato, Titolo, Causa, Tipo, Persone, Volontari, Ore capped, Donati, Org., Raccolti. Riga TOTALI in fondo. A4 landscape.",
          path: "/attivita/quadri/club-anno" },
        { icon: "🧾", t: "Amministrazione vs Service",
          d: "Stesse colonne ma Persone = Limite Massimo. Split in 2 tabelle (Service / Amministrazione) con subtotali + totale complessivo.",
          path: "/attivita/quadri/club-anno-amm-service" },
      ],
    },
  ]

  sections.forEach((sec, ci) => {
    const x = 0.5 + ci * 3.05
    // Section header bar
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.45, w: 2.9, h: 0.4, fill: { color: sec.color }, line: { type: "none" },
    })
    s.addText(sec.title, {
      x: x + 0.15, y: 1.45, w: 2.1, h: 0.4,
      fontFace: F.body, fontSize: 10, bold: true, color: C.white, charSpacing: 2, valign: "middle", margin: 0,
    })
    s.addText(`${sec.count}`, {
      x: x + 2.45, y: 1.45, w: 0.35, h: 0.4,
      fontFace: F.header, fontSize: 16, bold: true, color: C.white, align: "right", valign: "middle", margin: 0,
    })

    const baseY = 1.95
    if (sec.quadri.length === 1) {
      // Single tall card
      const q = sec.quadri[0]
      card(s, x, baseY, 2.9, 3.05, C.white, { borderColor: C.grayLight })
      s.addText(q.icon, {
        x: x + 0.15, y: baseY + 0.2, w: 2.6, h: 0.65, fontSize: 36, align: "center", margin: 0,
      })
      s.addText(q.t, {
        x: x + 0.15, y: baseY + 0.9, w: 2.6, h: 0.4,
        fontFace: F.header, fontSize: 12, bold: true, color: C.ink, align: "center", margin: 0,
      })
      s.addText(q.d, {
        x: x + 0.2, y: baseY + 1.35, w: 2.5, h: 1.35,
        fontFace: F.body, fontSize: 9.5, color: C.grayDark, align: "center", margin: 0, valign: "top",
      })
      s.addText(q.path, {
        x: x + 0.15, y: baseY + 2.7, w: 2.6, h: 0.3,
        fontFace: F.mono, fontSize: 8.5, color: sec.color, align: "center", margin: 0,
      })
    } else if (sec.quadri.length === 2) {
      // 2 cards stacked
      sec.quadri.forEach((q, i) => {
        const cy = baseY + i * 1.55
        card(s, x, cy, 2.9, 1.45, C.white, { borderColor: C.grayLight })
        s.addText(q.icon, {
          x: x + 0.1, y: cy + 0.08, w: 0.5, h: 0.45, fontSize: 20, valign: "middle", margin: 0,
        })
        s.addText(q.t, {
          x: x + 0.65, y: cy + 0.08, w: 2.15, h: 0.42,
          fontFace: F.header, fontSize: 10.5, bold: true, color: C.ink, margin: 0, valign: "middle",
        })
        s.addText(q.d, {
          x: x + 0.15, y: cy + 0.55, w: 2.6, h: 0.62,
          fontFace: F.body, fontSize: 8.5, color: C.grayDark, margin: 0, valign: "top",
        })
        s.addText(q.path, {
          x: x + 0.15, y: cy + 1.18, w: 2.6, h: 0.22,
          fontFace: F.mono, fontSize: 7.5, color: sec.color, margin: 0,
        })
      })
    } else {
      // 3 cards stacked
      sec.quadri.forEach((q, i) => {
        const cy = baseY + i * 1.05
        card(s, x, cy, 2.9, 0.95, C.white, { borderColor: C.grayLight })
        s.addText(q.icon, {
          x: x + 0.08, y: cy + 0.08, w: 0.42, h: 0.42, fontSize: 16, valign: "middle", margin: 0,
        })
        s.addText(q.t, {
          x: x + 0.55, y: cy + 0.05, w: 2.25, h: 0.3,
          fontFace: F.header, fontSize: 10.5, bold: true, color: C.ink, margin: 0, valign: "middle",
        })
        s.addText(q.d, {
          x: x + 0.15, y: cy + 0.38, w: 2.6, h: 0.42,
          fontFace: F.body, fontSize: 8, color: C.grayDark, margin: 0, valign: "top",
        })
        s.addText(q.path, {
          x: x + 0.15, y: cy + 0.78, w: 2.6, h: 0.16,
          fontFace: F.mono, fontSize: 7, color: sec.color, margin: 0,
        })
      })
    }
  })

  s.addText("⚙️  Ogni quadro ha filtri propri · stampa A4 (portrait/landscape automatico) · header tabella ripetuto su ogni pagina", {
    x: 0.5, y: 5.07, w: 9, h: 0.22,
    fontFace: F.body, fontSize: 9, italic: true, color: C.gray, align: "center",
  })

  footerTag(s)
  pageNumber(s, 4)
}

// ================================================================
// SLIDE 5 — COSA MANCA (overview 3 fronti)
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.navy }

  s.addText("Cosa manca da fare", {
    x: 0.5, y: 0.55, w: 9, h: 0.7,
    fontFace: F.header, fontSize: 32, bold: true, color: C.white, margin: 0,
  })
  s.addText("Tre fronti di lavoro paralleli per portare Digitalions al livello successivo", {
    x: 0.5, y: 1.25, w: 9, h: 0.4,
    fontFace: F.body, fontSize: 14, color: C.grayLight, italic: true, margin: 0,
  })

  const fronti = [
    { icon: "🛠️", title: "Feature da sviluppare", desc: "5 funzionalità prioritarie (login con ruoli, import auto, inserimento attività, notifiche, export Excel)", color: C.blue, sub: "Dipende da: 01Informatica" },
    { icon: "📊", title: "Dati da Lions / LCI", desc: "4 export aggiuntivi necessari per attivare i KPI Club Metrics e Membership oggi su \"n/d\"", color: C.gold, sub: "Dipende da: LCI / Multidistretto" },
    { icon: "❓", title: "Decisioni del Direttivo", desc: "3 scelte aperte da prendere oggi: gestione degli import, livello di privacy dei dati, priorità della roadmap", color: C.red, sub: "Dipende da: voi, oggi" },
  ]
  fronti.forEach((f, i) => {
    const x = 0.5 + i * 3.05
    const y = 1.95
    card(s, x, y, 2.9, 3.0, C.navyMid)
    // Top accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.9, h: 0.08, fill: { color: f.color }, line: { type: "none" },
    })
    s.addText(f.icon, {
      x: x + 0.1, y: y + 0.25, w: 2.7, h: 0.7, fontSize: 38, align: "center", valign: "middle", margin: 0,
    })
    s.addText(f.title, {
      x: x + 0.15, y: y + 1.0, w: 2.6, h: 0.5,
      fontFace: F.header, fontSize: 14, bold: true, color: f.color, align: "center", margin: 0,
    })
    s.addText(f.desc, {
      x: x + 0.2, y: y + 1.55, w: 2.5, h: 1.05,
      fontFace: F.body, fontSize: 11, color: C.white, align: "center", margin: 0, valign: "top",
    })
    // bottom owner
    s.addText(f.sub, {
      x: x + 0.15, y: y + 2.65, w: 2.6, h: 0.3,
      fontFace: F.body, fontSize: 9, italic: true, color: C.grayLight, align: "center", margin: 0,
    })
  })

  s.addText("Le 3 slide successive li espandono uno per uno", {
    x: 0.5, y: 5.05, w: 9, h: 0.3,
    fontFace: F.body, fontSize: 11, color: C.gold, italic: true, align: "center",
  })

  s.addText("Digitalions · digitalions108la.it · Distretto Lions 108 LA", {
    x: 0.5, y: 5.32, w: 7, h: 0.22, fontFace: F.body, fontSize: 9, color: C.gray, italic: true,
  })
  pageNumber(s, 5)
}

// ================================================================
// SLIDE 6 — FRONTE 1 · FEATURE DA SVILUPPARE
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }
  titleBar(s, "1 · Feature da sviluppare", { color: C.blue })
  subtitleText(s, "Priorizzate per impatto. Ciascuna è autonoma e rilasciabile in modo incrementale.")

  const items = [
    {
      pri: "ALTA", color: C.red, t: "Login con ruoli",
      d: "Tre livelli di accesso: Socio (vede sé stesso), Officer di Club (modifica il proprio club), Distretto (vede tutto). Sblocca anche la privacy: dati personali nascosti ai non autorizzati.",
    },
    {
      pri: "ALTA", color: C.red, t: "Import semi-automatico dei CSV Lions",
      d: "Pulsante \"Carica file\" nell'app: il sistema applica lo script di conversione, mostra anteprima delle modifiche, conferma e applica. Niente più passaggio manuale via sviluppatore.",
    },
    {
      pri: "MEDIA", color: C.orange, t: "Inserimento attività online (form web)",
      d: "Inserire una nuova attività di servizio direttamente dall'app, senza dover ripassare da MyLion ad ogni evento.",
    },
    {
      pri: "MEDIA", color: C.orange, t: "Notifiche email automatiche",
      d: "Promemoria rendicontazione · club che non comunicano da 90 giorni · anniversari soci · scadenze incarichi.",
    },
    {
      pri: "BASSA", color: C.green, t: "Export Excel (.xlsx) dalle tabelle",
      d: "Pulsante \"Esporta\" su ogni tabella per chi vuole continuare ad elaborare dati offline.",
    },
  ]
  items.forEach((it, i) => {
    const y = 1.55 + i * 0.69
    card(s, 0.5, y, 9, 0.62, C.white, { borderColor: C.grayLight })
    // priority badge
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.85, h: 0.62, fill: { color: it.color }, line: { type: "none" },
    })
    s.addText(it.pri, {
      x: 0.5, y, w: 0.85, h: 0.62,
      fontFace: F.body, fontSize: 10, bold: true, color: C.white, align: "center", valign: "middle", margin: 0,
    })
    s.addText(it.t, {
      x: 1.55, y: y + 0.04, w: 7.9, h: 0.3,
      fontFace: F.header, fontSize: 12, bold: true, color: C.ink, margin: 0,
    })
    s.addText(it.d, {
      x: 1.55, y: y + 0.32, w: 7.9, h: 0.3,
      fontFace: F.body, fontSize: 9.5, color: C.grayDark, margin: 0, valign: "top",
    })
  })

  footerTag(s)
  pageNumber(s, 6)
}

// ================================================================
// SLIDE 7 — FRONTE 2 · DATI DA LIONS
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }
  titleBar(s, "2 · Dati che servono da LCI / Multidistretto", { color: C.goldDeep })
  subtitleText(s, "Il CSV soci che riceviamo oggi non ha le \"date di uscita\". Risultato: vediamo chi c'è, non chi se ne è andato.")

  // === Top: cosa abbiamo / cosa manca side-by-side ===
  card(s, 0.5, 1.55, 4.4, 0.85, C.white, { borderColor: C.green })
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.55, w: 0.12, h: 0.85, fill: { color: C.green }, line: { type: "none" },
  })
  s.addText("✓  COSA ABBIAMO", {
    x: 0.75, y: 1.6, w: 4.0, h: 0.25,
    fontFace: F.body, fontSize: 9, bold: true, color: C.green, charSpacing: 1.5, margin: 0,
  })
  s.addText("Soci attualmente attivi (2.966) · data ingresso di ciascuno · 138 nuovi soci nell'anno calcolato", {
    x: 0.75, y: 1.85, w: 4.0, h: 0.55,
    fontFace: F.body, fontSize: 10, color: C.grayDark, margin: 0, valign: "top",
  })

  card(s, 5.1, 1.55, 4.4, 0.85, C.white, { borderColor: C.red })
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.55, w: 0.12, h: 0.85, fill: { color: C.red }, line: { type: "none" },
  })
  s.addText("✗  COSA MANCA", {
    x: 5.35, y: 1.6, w: 4.0, h: 0.25,
    fontFace: F.body, fontSize: 9, bold: true, color: C.red, charSpacing: 1.5, margin: 0,
  })
  s.addText("Date di uscita dei soci · stato storico dei club (nuovi, chiusi, riorganizzati, sospesi)", {
    x: 5.35, y: 1.85, w: 4.0, h: 0.55,
    fontFace: F.body, fontSize: 10, color: C.grayDark, margin: 0, valign: "top",
  })

  // === Due richieste prioritarie ===
  s.addText("Due richieste a LCI / Multidistretto · in ordine di priorità", {
    x: 0.5, y: 2.55, w: 9, h: 0.3,
    fontFace: F.header, fontSize: 13, bold: true, color: C.ink, margin: 0,
  })

  const reqs = [
    {
      pri: "1",
      color: C.purple,
      file: "members_exits.csv",
      cosa: "Elenco dei soci usciti nell'anno",
      esempio: "Mario Rossi · matr. 401929 · uscito 12/03/2026 · motivo: Dimissioni",
      sblocca: "Soci usciti · Crescita netta · Crescita % (cioè il bilancio annuale soci)",
    },
    {
      pri: "2",
      color: C.blue,
      file: "club_history.csv",
      cosa: "Storico eventi sui club",
      esempio: "Lions Club Cortona-Nuovo · stato: Nuovo · data: 15/09/2025 · note: fondato",
      sblocca: "Club nuovi · Riorganizzati · Chiusi · Sospeso nell'anno",
    },
  ]
  reqs.forEach((r, i) => {
    const y = 2.95 + i * 1.05
    card(s, 0.5, y, 9, 1.0, C.white, { borderColor: C.grayLight })
    // priority badge
    s.addShape(pres.shapes.OVAL, {
      x: 0.65, y: y + 0.3, w: 0.4, h: 0.4, fill: { color: r.color }, line: { type: "none" },
    })
    s.addText(r.pri, {
      x: 0.65, y: y + 0.3, w: 0.4, h: 0.4,
      fontFace: F.header, fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle", margin: 0,
    })
    // Title row
    s.addText(r.cosa, {
      x: 1.25, y: y + 0.1, w: 5.0, h: 0.3,
      fontFace: F.header, fontSize: 12, bold: true, color: C.ink, margin: 0,
    })
    s.addText(r.file, {
      x: 6.3, y: y + 0.1, w: 3.0, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: r.color, align: "right", italic: true, bold: true, margin: 0,
    })
    // Example
    s.addText("Esempio riga: ", {
      x: 1.25, y: y + 0.43, w: 1.2, h: 0.25,
      fontFace: F.body, fontSize: 9, bold: true, color: C.gray, margin: 0,
    })
    s.addText(r.esempio, {
      x: 2.4, y: y + 0.43, w: 6.9, h: 0.25,
      fontFace: F.mono, fontSize: 9, color: C.grayDark, italic: true, margin: 0,
    })
    // Sblocca
    s.addText("Sblocca: ", {
      x: 1.25, y: y + 0.68, w: 0.8, h: 0.25,
      fontFace: F.body, fontSize: 9, bold: true, color: C.gray, margin: 0,
    })
    s.addText(r.sblocca, {
      x: 2.05, y: y + 0.68, w: 7.3, h: 0.25,
      fontFace: F.body, fontSize: 9.5, color: r.color, bold: true, margin: 0,
    })
  })

  // Action box
  card(s, 0.5, 5.07, 9, 0.3, C.white, { borderColor: C.gold })
  s.addText("📨  Azione proposta: lettera ufficiale dal Distretto al Multidistretto per richiedere questi due export", {
    x: 0.65, y: 5.07, w: 8.7, h: 0.3,
    fontFace: F.body, fontSize: 10, color: C.grayDark, bold: true, margin: 0, valign: "middle",
  })

  footerTag(s)
  pageNumber(s, 7)
}

// ================================================================
// SLIDE 8 — FRONTE 3 · DECISIONI DEL DIRETTIVO
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }
  titleBar(s, "3 · Decisioni che ci servono oggi", { color: C.red })
  subtitleText(s, "Tre scelte aperte. Le risposte cambiano l'ordine delle priorità di sviluppo.")

  const qs = [
    { n: "1", q: "Chi gestisce gli import CSV in produzione?",
      h: "Segreteria distrettuale · Officer di Club · Solo amministratore tecnico esterno" },
    { n: "2", q: "L'accesso all'app è pubblico o riservato ai Lions?",
      h: "Oggi è pubblico. Vogliamo nascondere matricole, email e telefono ai non loggati? Implica la feature \"Login con ruoli\" (slide 4)." },
    { n: "3", q: "Quale priorità preferite vedere prima nei prossimi 3 mesi?",
      h: "Tra le 5 feature di slide 4. Indicate 1ª scelta e 2ª scelta." },
  ]
  qs.forEach((qq, i) => {
    const y = 1.65 + i * 1.05
    card(s, 0.5, y, 9, 0.95, C.white, { borderColor: C.grayLight })
    s.addShape(pres.shapes.OVAL, {
      x: 0.65, y: y + 0.27, w: 0.42, h: 0.42, fill: { color: C.red }, line: { type: "none" },
    })
    s.addText(qq.n, {
      x: 0.65, y: y + 0.27, w: 0.42, h: 0.42,
      fontFace: F.header, fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle", margin: 0,
    })
    s.addText(qq.q, {
      x: 1.3, y: y + 0.15, w: 8.0, h: 0.4,
      fontFace: F.header, fontSize: 14, bold: true, color: C.ink, margin: 0,
    })
    s.addText(qq.h, {
      x: 1.3, y: y + 0.55, w: 8.0, h: 0.4,
      fontFace: F.body, fontSize: 11, color: C.grayDark, italic: true, margin: 0, valign: "top",
    })
  })

  footerTag(s)
  pageNumber(s, 8)
}

// ================================================================
// SLIDE 9 — ROADMAP
// ================================================================
{
  const s = pres.addSlide()
  s.background = { color: C.off }
  titleBar(s, "Roadmap proposta")
  subtitleText(s, "Sequenza temporale dipendente dalle decisioni di oggi")

  const phases = [
    {
      title: "Giugno–Settembre 2026",
      label: "FY 2026/27 · prima parte",
      color: C.blue,
      items: [
        "Login con ruoli (Socio / Officer di Club / Officer di Distretto)",
        "Import semi-automatico CSV (autonomia Segreteria)",
        "Inserimento attività online (form web)",
      ],
    },
    {
      title: "Ottobre 2026 – Marzo 2027",
      label: "FY 2026/27 · seconda parte",
      color: C.purple,
      items: [
        "Notifiche email automatiche (reminder, anniversari)",
        "Export Excel da tutte le tabelle",
        "Gestione verbali e atti del Direttivo",
        "Quadri storici (se arrivano i dati da LCI)",
      ],
    },
    {
      title: "Aprile 2027 e oltre",
      label: "FY 2027/28",
      color: C.green,
      items: [
        "App mobile nativa (iOS · Android)",
        "Assistente AI per i Presidenti",
        "Apertura ad altri Distretti italiani",
        "Integrazione MyLion / Lions Portal (se API disponibile)",
      ],
    },
  ]
  phases.forEach((p, i) => {
    const x = 0.5 + i * 3.05
    const y = 1.55
    card(s, x, y, 2.9, 3.5, C.white, { borderColor: C.grayLight })
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.9, h: 0.55, fill: { color: p.color }, line: { type: "none" },
    })
    s.addText(p.title, {
      x: x + 0.15, y: y + 0.05, w: 2.6, h: 0.28,
      fontFace: F.header, fontSize: 11, bold: true, color: C.white, margin: 0,
    })
    s.addText(p.label, {
      x: x + 0.15, y: y + 0.3, w: 2.6, h: 0.22,
      fontFace: F.body, fontSize: 9, color: C.white, italic: true, margin: 0,
    })
    s.addText(p.items.map((it, j) => ({
      text: it,
      options: { bullet: true, breakLine: j < p.items.length - 1 },
    })), {
      x: x + 0.2, y: y + 0.7, w: 2.55, h: 2.7,
      fontFace: F.body, fontSize: 10.5, color: C.grayDark, paraSpaceAfter: 4,
    })
  })

  footerTag(s)
  pageNumber(s, 9)
}

// ================================================================
// SLIDE 10 — CHIUSURA + RICAPITOLO DECISIONI
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

  s.addText("Cosa decidiamo oggi", {
    x: 0.5, y: 0.55, w: 9, h: 0.7,
    fontFace: F.header, fontSize: 32, bold: true, color: C.white, margin: 0,
  })
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 1.32, w: 1.2, h: 0.06, fill: { color: C.gold }, line: { type: "none" },
  })

  // Recap box
  const decs = [
    "Chi gestisce gli import CSV →",
    "Accesso pubblico o riservato Lions →",
    "1ª feature da sviluppare nei prossimi 3 mesi →",
    "Richiesta formale a LCI per i 4 export →",
  ]
  decs.forEach((d, i) => {
    const y = 1.6 + i * 0.5
    s.addShape(pres.shapes.OVAL, {
      x: 0.55, y: y + 0.05, w: 0.32, h: 0.32, fill: { color: C.gold }, line: { type: "none" },
    })
    s.addText(`${i + 1}`, {
      x: 0.55, y: y + 0.05, w: 0.32, h: 0.32,
      fontFace: F.header, fontSize: 14, bold: true, color: C.navy, align: "center", valign: "middle", margin: 0,
    })
    s.addText(d, {
      x: 1.0, y: y, w: 7, h: 0.4,
      fontFace: F.body, fontSize: 14, color: C.white, margin: 0, valign: "middle",
    })
  })

  s.addText("Grazie", {
    x: 0.5, y: 4.4, w: 5, h: 0.65,
    fontFace: F.header, fontSize: 40, bold: true, color: C.gold, margin: 0,
  })
  s.addText("digitalions108la.it", {
    x: 5.5, y: 4.5, w: 4.2, h: 0.5,
    fontFace: F.mono, fontSize: 18, bold: true, color: C.white, align: "right", margin: 0, valign: "middle",
  })

  s.addText("01Informatica · Maggio 2026", {
    x: 0.5, y: 5.3, w: 9.2, h: 0.22,
    fontFace: F.body, fontSize: 9, color: C.grayLight, italic: true, align: "right",
  })
}

// === WRITE ===
const outPath = "C:/Users/f.coppini/Documents/Progetti/ServiceScore/presentazione/Digitalions-Direttivo-108LA.pptx"
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("OK ->", outPath)
})
