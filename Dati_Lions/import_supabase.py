"""
Importa i 4 CSV pronti su Supabase via Management API SQL.
- Truncate cascading
- INSERT in batch da N righe
- Gestione tipi (date, boolean, numeric, NULL)
"""
import csv
import json
import urllib.request
import os
import sys

PROJECT = os.environ.get("SUPABASE_PROJECT_REF", "uywtfwjkyiacdfgsbtgo")
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN")
if not TOKEN:
    raise SystemExit(
        "ERRORE: imposta la variabile d'ambiente SUPABASE_ACCESS_TOKEN prima di lanciare lo script.\n"
        "  PowerShell:  $env:SUPABASE_ACCESS_TOKEN = 'sbp_...'\n"
        "  Bash/zsh:   export SUPABASE_ACCESS_TOKEN=sbp_..."
    )
URL = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"

# Definizione tipi per colonna (per ogni tabella, quali sono date/bool/numeric)
TYPES = {
    "club": {  # tutto varchar
        "_date": set(),
        "_bool": set(),
        "_num": set(),
    },
    "soci": {
        "_date": {"data_nascita", "data_ingresso"},
        "_bool": set(),
        "_num": set(),
    },
    "officer_club": {
        "_date": {"data_inizio", "data_conclusione"},
        "_bool": set(),
        "_num": set(),
    },
    "attivita_report": {
        "_date": {"data_inizio", "data_conclusione"},
        "_bool": {"rapporto_completo", "attivita_distintiva", "finanziata_lcif"},
        "_num": {"persone_servite","persone_servite_limite","totale_volontari","totale_ore_servizio",
                 "totale_ore_servizio_capped","alberi_piantati","totale_fondi_donati","fondi_donati_usd_capped",
                 "donazione_lcif","totale_fondi_raccolti","fondi_raccolti_usd_capped"},
    },
}

def exec_sql(sql: str):
    body = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8")
        raise RuntimeError(f"HTTP {e.code}: {msg}")

def sql_value(v: str, col: str, types: dict) -> str:
    """Converte valore CSV > letterale SQL."""
    if v is None: return "NULL"
    v = v.strip()
    if v == "" or v.lower() in ("nan", "none", "null"): return "NULL"
    if col in types["_bool"]:
        lv = v.lower()
        if lv == "true": return "TRUE"
        if lv == "false": return "FALSE"
        return "NULL"
    if col in types["_date"]:
        # atteso formato YYYY-MM-DD
        if len(v) >= 10 and v[4] == '-' and v[7] == '-':
            return f"'{v[:10]}'"
        return "NULL"
    if col in types["_num"]:
        try:
            float(v)
            return v
        except ValueError:
            return "NULL"
    # default: varchar/text — escape single quote
    return "'" + v.replace("\\", "\\\\").replace("'", "''") + "'"

def build_insert(table: str, headers: list, rows: list) -> str:
    types = TYPES[table]
    cols = ", ".join(headers)
    parts = []
    for row in rows:
        vals = ", ".join(sql_value(row.get(h, ""), h, types) for h in headers)
        parts.append(f"({vals})")
    return f"INSERT INTO {table} ({cols}) VALUES\n" + ",\n".join(parts) + ";"

def import_table(table: str, csv_file: str, batch_size: int = 200):
    print(f"\n> Import {table} da {csv_file} (batch {batch_size})...")
    with open(csv_file, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)
    if not rows:
        print(f"  (vuoto)")
        return
    total = len(rows)
    inserted = 0
    for i in range(0, total, batch_size):
        chunk = rows[i:i+batch_size]
        sql = build_insert(table, headers, chunk)
        try:
            exec_sql(sql)
            inserted += len(chunk)
            sys.stdout.write(f"  batch {i//batch_size + 1}/{(total + batch_size - 1)//batch_size}: {inserted}/{total}\r")
            sys.stdout.flush()
        except Exception as e:
            print(f"\n  ERRORE batch {i}-{i+len(chunk)}: {e}")
            # debug: stampa primi 500 chars dell'INSERT che ha fallito
            print(f"  SQL preview: {sql[:500]}")
            raise
    print(f"  Inserite {inserted} righe                        ")

def apply_future_proof_grants():
    """
    Riapplica i GRANT espliciti su tutte le tabelle/viste dello schema public
    + i DEFAULT PRIVILEGES per le future tabelle.
    Necessario perche' dal 30 ott 2026 Supabase non espone piu' di default
    lo schema public alla Data API: nuove tabelle = niente accesso anon/
    authenticated finche' non si fa GRANT esplicito.
    Vedi grants_future_proof.sql per la documentazione completa.
    """
    print("\n> Applico GRANT future-proof (Data API policy 30/10/2026)...")
    sql_file = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "grants_future_proof.sql")
    if not os.path.exists(sql_file):
        print(f"  ATTENZIONE: {sql_file} non trovato, salto.")
        return
    with open(sql_file, "r", encoding="utf-8") as f:
        sql = f.read()
    exec_sql(sql)
    print("  OK (grant + default privileges applicati)")

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)

    # 1. TRUNCATE
    print("> TRUNCATE TABLE club CASCADE...")
    exec_sql("TRUNCATE TABLE club CASCADE;")
    print("  OK")

    # 2. Import in ordine FK
    import_table("club",            "1_club_supabase.csv")
    import_table("soci",            "2_soci_supabase.csv")
    import_table("officer_club",    "3_officer_supabase.csv")
    import_table("attivita_report", "4_report_supabase.csv", batch_size=150)

    # 3. GRANT future-proof (idempotente, copre eventuali nuove tabelle/viste)
    apply_future_proof_grants()

    # 4. Verifica counts
    print("\n> Verifica counts post-import:")
    res = exec_sql("""SELECT
        (SELECT COUNT(*) FROM club) AS club,
        (SELECT COUNT(*) FROM soci) AS soci,
        (SELECT COUNT(*) FROM officer_club) AS officer_club,
        (SELECT COUNT(*) FROM attivita_report) AS attivita_report;""")
    print(json.dumps(res, indent=2))
