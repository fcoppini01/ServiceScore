"""
Re-import COMPLETO dei dati Lions dai 3 nuovi file (soci/officer/service).
- Sostituzione totale (TRUNCATE club CASCADE -> svuota anche soci/officer_club/attivita_report)
- SOCI: tutti. OFFICER e SERVICE: solo con data_inizio >= 2023-07-01.
- Dopo l'import: stato_approvazione = 'approvato' per tutte le attivita (dataset ufficiale)
  + riapplica i GRANT future-proof + verifiche.

Token Management API letto da Dati_Lions/.mgmt_token (una riga, sbp_...).
Uso:  python reimport_lions.py
"""
import csv, json, os, sys, urllib.request, urllib.error
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)

PROJECT = "uywtfwjkyiacdfgsbtgo"
GO = "--go" in sys.argv  # senza --go = dry-run (nessuna scrittura, nessun token necessario)
TOKEN = (os.environ.get("SUPABASE_ACCESS_TOKEN") or "").strip()
if not TOKEN and os.path.exists(".mgmt_token"):
    TOKEN = open(".mgmt_token", encoding="utf-8").read().strip()
URL = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"

F_SOCI    = "report1782745733080 (soci).csv"
F_OFFICER = "report1782745782680 (officer di club).csv"
F_SERVICE = "report1782745914404 (service).csv"
DATA_MIN  = "2023-07-01"

def exec_sql(sql: str):
    body = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json", "User-Agent": "Mozilla/5.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode('utf-8')[:800]}")

TYPES = {
    "club": {"_date": set(), "_bool": set(), "_num": set()},
    "soci": {"_date": {"data_nascita", "data_ingresso"}, "_bool": set(), "_num": set()},
    "officer_club": {"_date": {"data_inizio", "data_conclusione"}, "_bool": set(), "_num": set()},
    "attivita_report": {"_date": {"data_inizio", "data_conclusione"},
        "_bool": {"rapporto_completo", "attivita_distintiva", "finanziata_lcif"},
        "_num": {"persone_servite","persone_servite_limite","totale_volontari","totale_ore_servizio",
                 "totale_ore_servizio_capped","alberi_piantati","totale_fondi_donati","fondi_donati_usd_capped",
                 "donazione_lcif","totale_fondi_raccolti","fondi_raccolti_usd_capped"}},
}

def sqlval(v, col, t):
    if v is None: return "NULL"
    v = str(v).strip()
    if v == "" or v.lower() in ("nan","none","null","nat"): return "NULL"
    if col in t["_bool"]:
        return "TRUE" if v.lower() in ("true","1") else ("FALSE" if v.lower() in ("false","0") else "NULL")
    if col in t["_date"]:
        return f"'{v[:10]}'" if len(v) >= 10 and v[4] == '-' and v[7] == '-' else "NULL"
    if col in t["_num"]:
        try: float(v); return v
        except ValueError: return "NULL"
    return "'" + v.replace("\\","\\\\").replace("'","''") + "'"

def insert_df(table, df, batch=200):
    cols = list(df.columns)
    t = TYPES[table]
    recs = df.to_dict("records")
    total = len(recs); done = 0
    for i in range(0, total, batch):
        chunk = recs[i:i+batch]
        vals = ",\n".join("(" + ", ".join(sqlval(r.get(c), c, t) for c in cols) + ")" for r in chunk)
        exec_sql(f"INSERT INTO {table} ({', '.join(cols)}) VALUES\n{vals};")
        done += len(chunk)
        sys.stdout.write(f"  {table}: {done}/{total}\r"); sys.stdout.flush()
    print(f"  {table}: inserite {done} righe" + " " * 20)

def norm_date(s):
    return pd.to_datetime(s, dayfirst=True, errors="coerce").dt.strftime("%Y-%m-%d")

print("Lettura file raw (latin1)...")
soci_raw    = pd.read_csv(F_SOCI, dtype=str, encoding="latin1", sep=";").rename(columns=lambda c: c.strip())
officer_raw = pd.read_csv(F_OFFICER, dtype=str, encoding="latin1", sep=";").rename(columns=lambda c: c.strip())
report_raw  = pd.read_csv(F_SERVICE, dtype=str, encoding="latin1", sep=";").rename(columns=lambda c: c.strip())

# ---- CLUB (da officer + service, dedup su id_account) ----
map_club_off = {'ID account':'id_account','Nome account':'nome_club','Nome account (locale)':'nome_account_locale',
    'Identificativo Lions':'identificativo_lions','Tipo':'tipo','Circoscrizione di appartenenza':'circoscrizione',
    'Zona di appartenenza':'zona','Distretto di appartenenza':'distretto','Multidistretto di appartenenza':'multidistretto',
    'ID dell?organizzazione di appartenenza':'id_organizzazione_appartenenza','Parent Parent Id':'parent_parent_id',
    'Parent District Id':'parent_district_id','Identificativo del MD di appartenenza':'id_md_appartenenza',
    'Identificativo Lions Affiliato':'identificativo_lions_affiliato'}
c1 = officer_raw[[c for c in map_club_off if c in officer_raw.columns]].rename(columns=map_club_off)
map_club_rep = {'Sponsor: ID dell?organizzazione di appartenenza':'id_account','Sponsor: Nome account':'nome_club',
    'Zona dello sponsor':'zona','Circoscrizione sponsor':'circoscrizione','Distretto sponsor':'distretto','MD sponsor':'multidistretto'}
c2 = report_raw[[c for c in map_club_rep if c in report_raw.columns]].rename(columns=map_club_rep)
club = pd.concat([c1, c2], ignore_index=True).drop_duplicates(subset=['id_account'], keep='first')
club = club.dropna(subset=['id_account'])

# ---- SOCI (tutti) ----
map_soci = {'Contatto: Matricola socio':'matricola_socio','Identificativo Lions':'identificativo_lions_club',
    'Contatto: Nome':'nome','Contatto: Secondo nome':'secondo_nome','Contatto: Cognome':'cognome',
    'Contatto: Nome (locale)':'nome_locale','Contatto: Secondo nome (locale)':'secondo_nome_locale',
    'Contatto: Cognome (locale)':'cognome_locale','Contatto: Suffisso':'suffisso','Contatto: Soprannome':'soprannome',
    'Contatto: Titolo':'titolo','Contatto: Genere':'sesso','Contatto: Compleanno':'data_nascita',
    'Data di ingresso nell?associazione':'data_ingresso','Tipo associazione intera':'tipo_associazione_intera',
    'Categoria associativa':'categoria_associativa','Programma':'programma','Nome dello sponsor del socio':'nome_sponsor',
    'Contatto: Preferred Email':'email_preferita','Contatto: Personal Email':'email_personale',
    'Contatto: Work Email':'email_lavoro','Contatto: Alternate Email':'email_alternativa',
    'Contatto: Preferred Phone':'telefono_preferito','Contatto: Cellulare':'telefono_cellulare',
    'Contatto: Telefono (abit.)':'telefono_abitazione','Contatto: Altro telefono':'altro_telefono','Contatto: Fax':'fax',
    'Contatto: Indirizzo postale (riga 1)':'indirizzo_riga1','Contatto: Indirizzo postale (riga 2)':'indirizzo_riga2',
    'Contatto: Indirizzo postale (riga 3)':'indirizzo_riga3','Contatto: Indirizzo':'indirizzo_locale',
    'Contatto: Città indirizzo postale':'citta','Contatto: Stato/Provincia indirizzo postale':'stato_provincia',
    'Contatto: CAP indirizzo postale':'cap','Contatto: Paese indirizzo postale':'paese',
    'Contatto: Nome del coniuge':'nome_coniuge','Contatto: Stato del coniuge':'stato_coniuge','Contatto: Professione':'professione'}
soci = soci_raw[[c for c in map_soci if c in soci_raw.columns]].rename(columns=map_soci)
for c in ('data_nascita','data_ingresso'):
    if c in soci: soci[c] = norm_date(soci[c])
soci = soci.dropna(subset=['matricola_socio']).drop_duplicates(subset=['matricola_socio'], keep='first')

# ---- OFFICER (>= 2023-07-01) ----
map_off = {'Socio: Matricola socio':'matricola_socio','Titolo ufficiale':'titolo_ufficiale',
    "Data d'inizio":'data_inizio','Data di conclusione':'data_conclusione'}
officer = officer_raw[[c for c in map_off if c in officer_raw.columns]].rename(columns=map_off)
for c in ('data_inizio','data_conclusione'):
    if c in officer: officer[c] = norm_date(officer[c])
officer = officer.dropna(subset=['matricola_socio'])
off_tot = len(officer)
officer = officer[officer['data_inizio'].notna() & (officer['data_inizio'] >= DATA_MIN)]
# tieni solo officer con matricola presente fra i soci importati
officer = officer[officer['matricola_socio'].isin(set(soci['matricola_socio']))]

# ---- SERVICE / attivita_report (>= 2023-07-01) ----
map_rep = {'ID attività di servizio':'id_attivita','Sponsor: ID dell?organizzazione di appartenenza':'id_account_club',
    'Sponsor: Nome account':'nome_club_sponsor','Titolo':'titolo','Descrizione':'descrizione','Stato':'stato',
    'Rapporto completo':'rapporto_completo',"Livello dell'attività":'livello_attivita','Causa':'causa',
    'Tipo di progetto':'tipo_progetto','Attività distintiva':'attivita_distintiva',
    'Finanziata con il contributo della LCIF':'finanziata_lcif',"Data d'inizio":'data_inizio',
    'Data di conclusione':'data_conclusione','Persone servite':'persone_servite',
    'Persone servite - Limite massimo':'persone_servite_limite','Totale volontari':'totale_volontari',
    'Totale ore di servizio':'totale_ore_servizio','Total Volunteer Hours - Capped':'totale_ore_servizio_capped',
    'Alberi piantati/curati':'alberi_piantati','Totale fondi donati Valuta':'valuta_fondi_donati',
    'Totale fondi donati':'totale_fondi_donati','Total Funds Donated (USD) - Capped':'fondi_donati_usd_capped',
    'Donazione alla LCIF':'donazione_lcif','Organizzazione beneficiata':'organizzazione_beneficiata',
    'Totale fondi raccolti Valuta':'valuta_fondi_raccolti','Totale fondi raccolti':'totale_fondi_raccolti',
    'Total Funds Raised (USD) - Capped':'fondi_raccolti_usd_capped','Creato da: Nome completo':'creato_da'}
rep = report_raw[[c for c in map_rep if c in report_raw.columns]].rename(columns=map_rep)
for c in ('data_inizio','data_conclusione'):
    if c in rep: rep[c] = norm_date(rep[c])
def num(v):
    if v is None or str(v).strip()=='' : return None
    s=str(v).replace(' ','').replace('€','').strip()
    if '.' in s and ',' in s: s=s.replace('.','').replace(',','.')
    elif ',' in s: s=s.replace(',','.')
    try: float(s); return s
    except ValueError: return None
for c in TYPES['attivita_report']['_num']:
    if c in rep: rep[c]=rep[c].apply(num)
for c in ('rapporto_completo','attivita_distintiva','finanziata_lcif'):
    if c in rep: rep[c]=rep[c].apply(lambda x: True if str(x).strip()=='1' else (False if str(x).strip()=='0' else None))
rep_tot = len(rep)
rep = rep[rep['data_inizio'].notna() & (rep['data_inizio'] >= DATA_MIN)]

print(f"CLUB: {len(club)} | SOCI: {len(soci)} (tutti) | OFFICER: {len(officer)}/{off_tot} (>= {DATA_MIN}) | SERVICE: {len(rep)}/{rep_tot} (>= {DATA_MIN})")

if not GO:
    print("\n[DRY-RUN] Nessuna modifica al database. Per eseguire davvero: python reimport_lions.py --go")
    sys.exit(0)
if not TOKEN:
    raise SystemExit("ERRORE: token mancante. Metti il Management token in Dati_Lions/.mgmt_token (una riga: sbp_...).")

print("\nTRUNCATE club CASCADE...")
exec_sql("TRUNCATE TABLE club CASCADE;")
insert_df("club", club)
insert_df("soci", soci)
insert_df("officer_club", officer)
insert_df("attivita_report", rep, batch=150)

print("\nImposto stato_approvazione = 'approvato' su tutte le attivita (dataset ufficiale)...")
exec_sql("UPDATE attivita_report SET stato_approvazione='approvato';")

if os.path.exists("grants_future_proof.sql"):
    print("Riapplico GRANT future-proof...")
    exec_sql(open("grants_future_proof.sql", encoding="utf-8").read())

print("\nVerifica finale:")
res = exec_sql("""select
 (select count(*) from club) club,
 (select count(*) from soci) soci,
 (select count(*) from officer_club) officer,
 (select count(*) from attivita_report) attivita,
 (select count(*) from attivita_report where stato_approvazione='approvato') approvate,
 (select count(*) from soci s left join club c on s.identificativo_lions_club=c.identificativo_lions where c.identificativo_lions is null) soci_senza_club,
 (select count(*) from autorizzazioni a left join soci s on a.matricola_socio=s.matricola_socio where s.matricola_socio is null) autorizzazioni_orfane;""")
print(json.dumps(res, indent=2, ensure_ascii=False))
print("\nFATTO.")
