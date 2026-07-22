# HANDOFF — DigitaLions (Lions 108 LA)

Stato per riprendere in una nuova sessione. Fase attuale: "accumulo modifiche".

## ⚠️ REGOLA ATTIVA
**NON fare commit né push.** Fabio sta accumulando più sistemazioni e dirà lui quando committare/deployare. Lavorare in locale, validare con `node_modules/.bin/tsc --noEmit -p tsconfig.json` + `npm run build`. Nessun `git commit`/`git push` finché non richiesto.

## Progetto
- **App**: DigitaLions — Next.js 16 (App Router) + React 19 + TS strict + Tailwind + shadcn/ui. Gestionale Distretto Lions 108 LA (soci, attività di servizio, officer, dashboard, rapporti/prospetti).
- **Repo**: GitHub `fcoppini01/ServiceScore`, branch `main`. Deploy auto su Vercel (`servicescore108la`, team `01informatica-progetti`).
- **Dominio**: `digitalions108la.it` (reverse proxy esterno → Vercel). `servicescore.vercel.app` = vecchia app, ignorare.
- **Supabase**: ref `uywtfwjkyiacdfgsbtgo`. Admin SOLO via MCP `execute_sql`/`apply_migration` (in shell NON c'è Management token né service-role; `.env.local` = solo anon).

## GOTCHA
- **Worktree stale**: i tool girano in un worktree su branch diverso. Lavorare sul repo principale via path assoluti `C:/Users/f.coppini/Documents/Progetti/ServiceScore/...`; git con `git -C <quel path>`. Glob/Grep senza path assoluto guardano il worktree (stale).
- **Club "ABETONE MONTAGNA PISTOIESE" tecnico** (id_account `001Ns00000EDgRMIA1`, identificativo_lions NULL): NON cancellare. FK `attivita_report.id_account_club → club.id_account` ON DELETE CASCADE + tutte le attività hanno quell'id (bug export) → cancellarlo svuota attivita_report.
- **CSV Lions**: ISO-8859-1 (`latin1`), delimitatore `;`. La regola org "ISO-8859-1/try-with-resources/commenti solo .java" vale per i progetti Java, NON per questo JS/TS.
- **Anno sociale**: 1 lug→30 giu (`src/lib/anno-sociale.ts`). Nei filtri prospetti usare `getAnniSociali()` (2023/24 → prossimo anno); `getRecentAnniSociali` resta per la dashboard.

## 🔐 SICUREZZA — leggere PRIMA di toccare le policy Supabase
**Cos'è successo (21/07/2026):** l'app esponeva pubblicamente i dati di **2.951 soci**
(nome, cognome, telefono). Causa: policy RLS `TO anon` con `USING(true)` su `soci`,
`officer_club`, `club`, `attivita_report`.

**Il redirect al login NON protegge da questo.** La `anon key` è pubblica (sta nel
bundle JS servito a chiunque): si interroga direttamente
`<SUPABASE_URL>/rest/v1/<tabella>` saltando UI, middleware e React. L'unica difesa
reale sono GRANT + policy RLS.

**Fix applicato in produzione:**
```sql
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
grant execute on function public.fn_matricola_esiste(text) to anon; -- serve alla registrazione
drop policy if exists "Soci visibili a tutti" on public.soci;        -- idem officer_club, club, attivita_report
alter policy "Utenti possono vedere solo il proprio profilo" on public.utenti to authenticated;
```

**REGOLE:**
- ❌ Mai `select` ad `anon` su `soci`, `officer_club`, `club`, `attivita_report` né
  sulle viste `vista_*`. "anon ha solo SELECT" **non** è minimo privilegio: su dati
  personali il SELECT *è* il problema (è stato l'errore originale).
- ✅ `fn_matricola_esiste` deve restare `SECURITY DEFINER` + `execute` ad `anon`:
  è ciò che tiene viva la registrazione senza esporre la tabella soci.
- ✅ Serve una pagina pubblica? Esporre **una vista con le sole colonne non
  personali**, mai la tabella.
- ⚠️ `categoria_socio_map` resta leggibile da anon: solo mappatura categorie, ok.

**Verifica (rilanciare dopo OGNI modifica alle policy) — atteso 401 ovunque:**
```bash
set -a && . ./.env.local; set +a
for t in soci officer_club club attivita_report vista_soci_ricerca; do
  curl -s -o /dev/null -w "$t %{http_code}\n" \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/$t?select=*&limit=1" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
done
```

## DATABASE (già applicato in produzione)
- **Reimport completo** dai 3 file in `Dati_Lions/` (soci/officer/service 1782745...). Script `Dati_Lions/reimport_lions.py` (dry-run senza args; `--go` esegue; token da `Dati_Lions/.mgmt_token`, gitignored).
- Conteggi: club 93 (+1 tecnica ABETONE), soci 2951 (tutti), officer_club 2034 (≥2023-07-01), attivita_report 6861 (≥2023-07-01, tutte `stato_approvazione='approvato'`).
- **Backup** pre-reimport in `bak_reimport_soci/officer_club/attivita_report/club` (eliminare a conferma).
- Viste (security_invoker=on): `vista_soci_ricerca` con `email_effettiva`=COALESCE(personale,lavoro,alternativa) [`email_preferita`=TIPO "Personal", non l'indirizzo!] e `categoria_socio` (da `categoria_socio_map`); `vista_officer_ricerca` con `email` + `telefono` aggiunte via JOIN soci.
- **autorizzazioni**: ruoli distrettuali con matricole reali. Ruoli: super_admin (=email @info01.it, hardcoded in fn_my_permissions), gst_coordinatore (distretto, puo_scrivere), gst_componente, presidente_circoscrizione, presidente_zona, socio. RLS su attivita_report per la revisione. Il ruolo si risolve: soci.user_id (auth) → matricola → autorizzazioni.

## MODIFICHE CODICE NON COMMITTATE (locale, dopo commit 2409217)
1. **Filtro Anno sociale multi "(uno o più)"** unificato su tutti i prospetti + stampe coerenti (query = OR di `and(data_inizio.gte.from,data_inizio.lte.to)`; state `anniSociali` string[]/number[]).
2. **`getAnniSociali()`** in anno-sociale.ts (2023/24 → prossimo anno) al posto di getRecentAnniSociali(8) nei prospetti.
3. **soci/quadri/caratteristiche**: tolte Tipo/Categoria associativa, aggiunta Classificazione (categoria_socio) + filtro + Excel. (Titolo pagina ancora da rinominare.)
4. **Amm vs Service**: rinominato "— Dettagliato"; nuovo **"— Totalizzato"** (`attivita/quadri/amm-service-totali/`, solo totali/subtotali); entrambi linkati in `attivita/rapporti`.
5. **Officer email/telefono**: bug "Personal" risolto (vista officer → email/telefono reali); `ruoli-club` usa i nuovi campi; **Elenco Officer** con nuove colonne Email + Telefono (tabella + card mobile + Excel).
6. **Performance**: `.cv-row`/`.cv-table` (content-visibility + table-layout:fixed, @media screen) su tabelle lunghe in globals.css.
7. **Soci**: rimosso filtro fisso "ante 1/7/2023" (già in commit 2409217) → elenco mostra tutti i 2951.

File M: attivita/page, attivita/quadri/{club-anno, club-anno-amm-service}, attivita/rapporti, attivita/stampa, officer/page, officer/quadri/{incarichi-club, ruoli-club}, officer/stampa, lib/anno-sociale. Nuovo: attivita/quadri/amm-service-totali/. NON committare: `Dati_Lions/*`, `Officer_*.xlsx` in root, `presentazione/*.js`, `HANDOFF.md`.

## SISTEMAZIONI RECENTI (committate)
- **Struttura Dati Donazioni e Attività per Club** (`attivita/quadri/donazioni-attivita`): le % Amm./Service ora sono sul totale **del singolo club** (prima erano sul Totale Generale) — riga Totale = base 100%; stesso in Excel. Aggiunti i **totali per anno** anche sotto i "Totali Generali" (multi-anno).
- **Fascicoli** (`app/fascicoli/page.tsx`): **rimossa** la sezione "Mod. 2 - Sez. 1 — Riepilogo attività ultimo triennio" con tabella + medie. Il calcolo `triennio` resta in `lib/fascicolo.ts` solo perché delimita la finestra date del caricamento attività.

## TODO / IN CODA
- Rinominare titolo `soci/quadri/caratteristiche`.
- "Capped" → "dollari" su Storico Attività (colonne $). (Nel dettaglio amm-service le label sono già "(dollari)".)
- Togliere spunta "Solo incarichi attivi" dai prospetti Officer (verificare dove resta).
- Punto 4 "attività per club buggato": in attesa esempio/foto.
- Valutare voce menu header per Ruoli di Leadership (già linkato da Rapporti Officer).
- **Admin sito**: rendere Piero Fontana e Sirio Orsi "amministratori" (in corso — vedi chat).

## COMANDI
- Validazione: `node_modules/.bin/tsc --noEmit -p tsconfig.json` + `npm run build`.
- Deploy (solo su richiesta): commit su `main` → Vercel builda.
