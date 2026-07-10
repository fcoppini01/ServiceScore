# HANDOFF — DigitaLions (ServiceScore)

_Ultimo aggiornamento: sessione del 2026-07-10. Documento per riprendere il lavoro da un'altra sessione senza perdere il contesto._

## ⚠️ Regola operativa in vigore
**NON fare `git commit` né `git push`** finché l'utente (Fabio) non lo dice esplicitamente.
Si lavora in **modalità accumulo**: tutte le modifiche restano in locale, si valida solo con
`npx tsc --noEmit` e `npx next build`. L'utente dà il via ai commit alla fine, probabilmente tutti insieme.

## Deploy / infrastruttura
- **Dominio pubblico**: `https://digitalions108la.it` → **reverse proxy esterno** → deploy **Vercel** `servicescore108la` (team `01informatica-progetti`). Dopo un deploy serve **Ctrl+F5** (il proxy può cachare).
- `servicescore.vercel.app` = vecchia app Vite, **da ignorare**.
- **Supabase**: project_id `uywtfwjkyiacdfgsbtgo`. Auth: super-admin = email `@info01.it`. Site URL e Redirect URLs impostati su `digitalions108la.it`.
- Client Supabase unificato su `@supabase/ssr` (cookie/PKCE) in `src/lib/supabase.ts` — NON tornare a `createClient` di supabase-js (romperebbe la sessione condivisa con middleware/callback).

## Stato dati (dopo reimport reale del 2026-07-10)
- **Soci 2951** (tutti, anche ante 2023 — per i soci NON si filtra per data).
- **Officer 2034**, **Attività/Service 6861**, solo con data ≥ 1/7/2023 (dati precedenti rimossi).
- Esiste 1 riga **club tecnica "ABETONE"** senza `identificativo_lions`: **NON cancellarla** (FK `attivita_report.id_account_club → club.id_account` con `ON DELETE CASCADE`: cancellandola si azzerano le attività). I dropdown deduplicano per nome.
- Backup pre-import in tabelle `bak_reimport_*` (rimuovibili quando l'utente conferma).

## Git — punto di partenza
Branch `main`, allineato a `origin/main`. Ultimi commit **già online**:
- `2409217` Elenco Soci: mostra tutti i soci (rimosso filtro fisso ante 1/7/2023)
- `b636535` Nuovo prospetto Ruoli di Leadership del Club; dollari nei rapporti classificazione
- `132f545` Storico Attività: importi in "dollari" invece di "capped"
- `65c0bb3` Officer: rimossa spunta "Solo incarichi attivi"; Attività: Distretto = tutte; rinomina titolo caratteristiche
- `9e913ce` Rapporto caratteristiche soci: colonna Classificazione al posto di Tipo/Categoria

## ✅ Sessione 2026-07-10 (parte 7) — rapporti "no filtro = tutto", Distretto selezionabile (committato)
Build OK. Modifiche:
- **Rapporti: senza filtri si carica TUTTO il DB.** Rimossa la guardia "seleziona un club" da `attivita/quadri/club-anno`, `club-anno-amm-service`, `amm-service-totali`, `attivita/quadri/sintesi-club`, `soci/quadri/composizione`. Al caricamento (o dopo "cancella filtri") mostrano tutto il Distretto; il sottotitolo di default dice "Tutto il Distretto 108 LA". Nota: l'anno sociale di default è quello corrente (2026/27) che al momento ha 0 attività → per vedere dati selezionare 2025/26.
- **Distretto 108 LA selezionabile** (prima dummy no-op) su `soci/quadri/eta`, `anzianita`, `caratteristiche`: selezionandolo ignora i filtri Club/Zona/Circoscrizione (= tutti i soci). Filtri **territoriali spostati in alto** (Zona, Circoscrizione, Club, Distretto) come "privilegiati" su eta e anzianita (caratteristiche li aveva già sopra).

### Audit checklist utente (verifiche DB fatte via REST anon)
- **soci = 2951** ✓ (Content-Range 0-2950/2951).
- **Officer email**: ora indirizzi reali (es. rombiolchini@virgilio.it), non più "Personal" ✓ — la vista espone `email` corretto e il codice lo usa.
- **stato attività**: UNICO valore `Comunicato` su tutte le 6861 righe ✓ (nessun altro stato).
- **Ultracentenari**: il 101 (Vasco Zecchi, PONTEDERA, nato 15/02/1925) è REALE. I sei "109" sono tutti nati **1917-01-01** = data placeholder/errata alla fonte (Viareggio Giacomo Puccini). Da decidere con l'utente se azzerare quelle date di nascita (così non risultano 109enni) — è una modifica DATI, non fatta.
- **Automatismo Past President**: implementato come **Immediato Past Presidente** (scelta utente in parte 6), NON come vicepresidente.

## ✅ Sessione 2026-07-10 (parte 6) — resize colonne, auth obbligatoria, Sfida dei Leoni, Past President (committato)
Build OK. Modifiche:
- **Colonne ridimensionabili in tutte le tabelle:** aggiunta una maniglia di resize sul bordo destro di ogni intestazione nel componente condiviso `src/components/ui/table.tsx` (`TableHead`). Trascinando si imposta `width/minWidth` sul `<th>`. Sulle tabelle `.cv-table` (`table-layout: fixed` a schermo) il resize è affidabile in entrambe le direzioni; la maniglia è `print:hidden` e `stopPropagation` così non attiva l'ordinamento (`SortableHead`). Le piccole tabelle aggregate a `<th>` raw (composizione, sintesi, cross-tab dashboard) non hanno la maniglia.
- **🔐 Accesso al sito ora richiede login (redirect):** **il middleware è stato SPOSTATO da `middleware.ts` (root) a `src/middleware.ts`** perché con la dir `src/` Next.js NON eseguiva quello in root (verificato: prima nessun redirect, la sessione-refresh non girava mai). Ora chi non è autenticato viene rediretto a `/login`. Restano pubblici: `/login`, `/register`, `/auth/*` e gli asset statici (regex estensione file, così i loghi non si rompono). Verificato: `/dashboard` → 307 `/login`, `/login` e `/logo_ufficiale.png` → 200.
- **"Sfida dei Leoni" nel menu:** nuova voce top-level in `header.tsx` → pagina segnaposto `src/app/sfida-leoni/page.tsx` ("Pagina in costruzione").
- **Immediato Past Presidente automatico** in `officer/quadri/ruoli-club`: la riga (prima sempre vuota) viene compilata col **Presidente del club dell'anno sociale precedente** (`max(anni selezionati) - 1`), via query dedicata su `vista_officer_ricerca`. Nota esplicativa sotto la tabella; entra anche in Excel/PDF. (Scelta utente: "Immediato Past Presidente", non il vicepresidente.)

## ✅ Sessione 2026-07-10 (parte 5) — dashboard → rapporti + fix email soci (committato)
Modifiche (build OK):
- **"Dashboard Soci per Club" e "Dashboard Attività per Club" spostate dalla Dashboard a rapporti dedicati:**
  - Nuova pagina `src/app/soci/quadri/composizione/page.tsx` — "Composizione del Club per Età e Anzianità": le due tabelle (fasce d'età + anzianità lionistica, quantità e %) con i **nuovi filtri territoriali** Club(multi)/Zona/Circoscrizione/Distretto (108 LA = tutti i soci), + Excel + Stampa PDF. Linkata da `soci/rapporti` e dal menu (Soci → "Composizione per Club").
  - Nuova pagina `src/app/attivita/quadri/sintesi-club/page.tsx` — "Sintesi Attività per Club — Amm. vs Service": la tabella a incrocio (Totale/Amministrazione/Service × Attività/Persone/Volontari/Ore, N° e %) con i filtri **presi da amm-service dettagliato** (Club/Zona/Circoscrizione/Distretto + Anno sociale multi), + Excel + Stampa PDF. Linkata da `attivita/rapporti` e dal menu (Attività → "Sintesi Attività per Club").
  - **Rimossi** dalla Dashboard i due blocchi + eliminati i componenti `src/components/dashboard/dashboard-soci.tsx` e `dashboard-attivita.tsx` (non più usati). `dashboard-client.tsx` ripulito (import + sezioni).
  - `header.tsx`: tolte le due sublink `/dashboard#dashboard-*`; aggiunte le due nuove voci ai gruppi Soci/Attività.
- **FIX EMAIL SOCI** (bug analogo a quello officer già risolto): le pagine soci mostravano `email_preferita`, che nel DB è **l'etichetta** ("Personal"/"Work"), non l'indirizzo. La vista `vista_soci_ricerca` espone già la colonna risolta **`email_effettiva`** (COALESCE degli indirizzi reali). Sostituito `email_preferita` → `email_effettiva` in tabella + Excel + PDF su: `soci/page.tsx` (anche sort), `soci/stampa`, `soci/quadri/eta`, `soci/quadri/anzianita`, `soci/quadri/caratteristiche`. Nessun `email_preferita` residuo in `src/`. (Telefono già corretto: `telefono_cellulare`.)

## ✅ Sessione 2026-07-10 (parte 4) — pulsanti Excel/Stampa sotto il sottotitolo (committato)
Layout uniformato su TUTTI i prospetti: i pulsanti **Excel / Stampa PDF** ora stanno in una riga **sotto il sottotitolo** (ordine: back link → titolo → sottotitolo → pulsanti → filtri), come nelle pagine principali (Elenco Soci/Attività/Officer). Prima erano nella barra in alto col link "Torna a…".
Pagine toccate: `soci/quadri/eta`, `soci/quadri/anzianita`, `soci/quadri/caratteristiche`, `soci/stampa`, `officer/stampa`, `officer/quadri/incarichi-club`, `officer/quadri/ruoli-club`, `attivita/quadri/club-anno`, `attivita/quadri/club-anno-amm-service`, `attivita/quadri/amm-service-totali`. Le pagine principali erano già così.

## ✅ Sessione 2026-07-10 (parte 3) — email/telefono nelle stampe + rename filtro (committato)
- **Email + Telefono aggiunti alle pagine di stampa separate**: `soci/stampa` (tabella PDF; Excel già li aveva) e `officer/stampa` (tabella PDF + Excel). Ora email/telefono sono presenti in tabella, stampa PDF ed Excel di **tutti** i rapporti soci/officer.
- Filtri avanzati Soci: placeholder **"Fascia anzianità" → "Fascia anzianità lionistica"**.

## ✅ Sessione 2026-07-10 (parte 2) — email/telefono ovunque + UI (committato)
- **Colonne Email + Telefono** aggiunte ai prospetti che ne erano privi: `soci/quadri/eta`, `soci/quadri/anzianita`, `soci/quadri/caratteristiche` (dai campi `email_preferita`/`telefono_cellulare` di `vista_soci_ricerca`) e `officer/quadri/incarichi-club` (dai campi `email`/`telefono` di `vista_officer_ricerca`). In tabella + Excel. Già presenti su Elenco Soci, Elenco Officer, Ruoli di Leadership.
- **Pulsanti Excel / Stampa PDF spostati a sinistra** (rimosso `justify-between`) su eta, anzianita, caratteristiche.
- **caratteristiche**: i filtri territoriali (Club/Zona/Circoscrizione/Distretto) ora sono **sopra** Classificazione e Programma.

## 🔴 Modifiche LOCALI della sessione parte 1 (committate insieme alla parte 2)
File modificati:
- `src/lib/anno-sociale.ts` — nuovo helper `getAnniSociali(minStart=2023)`: elenca gli anni sociali da 2023/24 fino al **prossimo** anno sociale (mandati officer futuri inclusi), ordine decrescente. Sostituisce l'uso di `getRecentAnniSociali` nei filtri dei prospetti.
- `src/app/attivita/page.tsx` — Storico Attività: filtro anno passato a **MultiSelect "Anno sociale (uno o più)"** (rimosso il vecchio select singolo + `dataInizioDa/A`). Usa `getAnniSociali()`.
- `src/app/attivita/stampa/page.tsx` — stampa Attività adeguata al multi-anno via URL (unione OR degli intervalli 1 lug→30 giu); rimosse righe residue su `dataConclusione`.
- `src/app/attivita/quadri/club-anno/page.tsx` e `.../club-anno-amm-service/page.tsx` — usano `getAnniSociali()`. Rinominato il titolo amm-service in **"...— Dettagliato"**.
- `src/app/attivita/rapporti/page.tsx` — card rinominata "Amministrazione vs Service — Dettagliato" + aggiunta card del nuovo **Totalizzato**.
- `src/app/officer/page.tsx` — Elenco Officer: filtro anno → MultiSelect multi-anno; rimosso import `Select` inutilizzato; **aggiunte colonne Email e Telefono** (tabella desktop + card mobile + Excel).
- `src/app/officer/stampa/page.tsx` — stampa Officer adeguata al multi-anno via URL.
- `src/app/officer/quadri/incarichi-club/page.tsx` — multi-anno (già era multi; coerenza `getAnniSociali`).
- `src/app/officer/quadri/ruoli-club/page.tsx` — prospetto "Ruoli di Leadership del Club": filtro anno → multi-anno; email/telefono presi **dalla vista** `vista_officer_ricerca` (non più da `vista_soci_ricerca`).

Nuova route non tracciata:
- `src/app/attivita/quadri/amm-service-totali/page.tsx` — nuovo prospetto **"Amministrazione vs Service — Totalizzato"**: stessi filtri (club/zone/circ/distretto/anni) del dettagliato, ma mostra **solo il totale complessivo + i subtotali Service e Amministrazione** (con conteggio attività), senza righe. Ha Stampa PDF ed Excel (riepilogo a 3 righe).

## 🟠 Migrazione DB già applicata su Supabase (produzione)
Vista `vista_officer_ricerca` ricreata con `security_invoker=on` aggiungendo:
- `email` = `COALESCE(NULLIF(email_personale,''), NULLIF(email_lavoro,''), NULLIF(email_alternativa,''))` — **fix del bug "Personal"** (prima l'email officer mostrava un valore sbagliato).
- `telefono` = `s.telefono_cellulare`.
Migrazione additiva: invisibile finché il codice locale non viene deployato. Verificato: email officer ora sono indirizzi reali.

## Convenzioni UI dei filtri (replicare ovunque)
- Ordine territoriale fisso: **Club · Zona · Circoscrizione · Distretto** (+ Anno sociale).
- **"Oppure tutto il Distretto"**: selezionando `108 LA` si caricano TUTTE le attività (= tutti club/zone/circ). Implementato su club-anno, amm-service, amm-service-totali (nel `loadActivities`: se `filtroDistretto.length` allora niente filtri territoriali).
- **Anno sociale**: MultiSelect "(uno o più)" con opzioni da `getAnniSociali()`. Le stampe ricevono gli anni via URL e riapplicano l'unione OR.

## Coda lavori
### Fatti (nell'accumulo locale o già committati)
- ✅ Rapporto caratteristiche soci: Classificazione al posto di Tipo/Categoria (+ rinomina titolo "Classificazione dei Soci per Categoria Associativa").
- ✅ Elenco Soci: mostra tutti i 2951.
- ✅ Storico Attività: "capped" → "dollari".
- ✅ Officer: rimossa spunta "Solo incarichi attivi" (elenco, stampa, incarichi-club).
- ✅ Distretto = tutto su classificazioni attività.
- ✅ Anno sociale multi-select unificato ovunque; anni solo da 2023/24 in su.
- ✅ Amm vs Service: Dettagliato + nuovo Totalizzato.
- ✅ Prospetto "Ruoli di Leadership del Club" (`officer/quadri/ruoli-club`), linkato da Rapporti Officer.
- ✅ Officer: fix email (vista) + colonne Email/Telefono nel prospetto principale.

### Aperti / da chiarire
- ❓ **"Linguetta" nel menu**: valutare se aggiungere la voce "Ruoli di Leadership del Club" (e/o gli altri prospetti) nel menu a tendina in alto (`src/components/header.tsx`, `NAV_ITEMS`, gruppo Officer). Oggi è raggiungibile solo dalla card in Rapporti Officer.
- ❓ Rimozione tabelle `bak_reimport_*` su conferma utente.
- ❓ Eventuale revoca del token `.mgmt_token` (escluso da git) dopo import.

## Stato build
`npx tsc --noEmit` = 0 errori · `npx next build` = OK · route nuove presenti (`/attivita/quadri/amm-service-totali`, `/officer/quadri/ruoli-club`).

## Note tecniche utili
- Titoli officer reali nel DB (`vista_officer_ricerca.titolo_ufficiale`), usati per il match in ruoli-club: `Presidente di club`, `Club First Vice President`, `Secondo Vice Presidente di Club`, `Segretario di club`, `Tesoriere di club`, `Presidente di club addetto ai soci`, `Presidente addetto ai Service di Club`, `Presidente di Comitato Marketing`, `Amministratore del club`, `Presidente di comitato di club addetto al protocollo`, `Coordinatore LCIF di club`, `Presidente di comitato di club addetto alle Tecnologie informatiche`, `Direttore di club` (multi), + `Lion Guida`/`Leader di club` (finiscono in "Altri incarichi").
- `getAnniSociali()` ha firma `(minStart=2023)`, **NON** un count: non passargli `8` (genererebbe un range enorme).
