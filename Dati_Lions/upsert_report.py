"""
UPSERT (INSERT ... ON CONFLICT (id_attivita) DO UPDATE) di 4_report_supabase.csv
sulla tabella attivita_report. Preserva i record esistenti nel DB che non
sono presenti nel CSV (es. storico anteriore al 1/7/2024 che Lions non ha
piu' re-esportato).

NOTA: questo script NON esegue TRUNCATE. Le righe del DB con id_attivita
non presenti nel CSV restano intatte.
"""
import csv, json, urllib.request, os, sys

PROJECT = os.environ.get("SUPABASE_PROJECT_REF", "uywtfwjkyiacdfgsbtgo")
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN")
if not TOKEN:
    raise SystemExit("ERRORE: imposta SUPABASE_ACCESS_TOKEN nell'ambiente.")
URL = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"

# Tipi colonne (per ogni colonna, come va serializzata)
DATE_COLS = {"data_inizio", "data_conclusione"}
BOOL_COLS = {"rapporto_completo", "attivita_distintiva", "finanziata_lcif"}
NUM_COLS = {
    "persone_servite", "persone_servite_limite", "totale_volontari",
    "totale_ore_servizio", "totale_ore_servizio_capped", "alberi_piantati",
    "totale_fondi_donati", "fondi_donati_usd_capped", "donazione_lcif",
    "totale_fondi_raccolti", "fondi_raccolti_usd_capped",
}

def exec_sql(sql):
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
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode('utf-8')}")

def sql_value(v, col):
    if v is None: return "NULL"
    v = v.strip()
    if v == "" or v.lower() in ("nan", "none", "null"): return "NULL"
    if col in BOOL_COLS:
        lv = v.lower()
        if lv == "true": return "TRUE"
        if lv == "false": return "FALSE"
        return "NULL"
    if col in DATE_COLS:
        if len(v) >= 10 and v[4] == '-' and v[7] == '-':
            return f"'{v[:10]}'"
        return "NULL"
    if col in NUM_COLS:
        try:
            float(v); return v
        except ValueError:
            return "NULL"
    return "'" + v.replace("\\", "\\\\").replace("'", "''") + "'"

def build_upsert(headers, rows):
    cols = ", ".join(headers)
    values_clauses = []
    for row in rows:
        vals = ", ".join(sql_value(row.get(h, ""), h) for h in headers)
        values_clauses.append(f"({vals})")
    # Tutte le colonne tranne la PK vengono aggiornate
    update_cols = [h for h in headers if h != "id_attivita"]
    update_set = ", ".join(f"{c} = EXCLUDED.{c}" for c in update_cols)
    return (
        f"INSERT INTO attivita_report ({cols}) VALUES\n"
        + ",\n".join(values_clauses)
        + f"\nON CONFLICT (id_attivita) DO UPDATE SET\n  {update_set};"
    )

def upsert_csv(csv_file, batch_size=150):
    print(f"> UPSERT da {csv_file} (batch {batch_size})...")
    with open(csv_file, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)
    total = len(rows)
    print(f"  righe da processare: {total}")
    done = 0
    for i in range(0, total, batch_size):
        chunk = rows[i:i+batch_size]
        sql = build_upsert(headers, chunk)
        exec_sql(sql)
        done += len(chunk)
        sys.stdout.write(f"  batch {i//batch_size + 1}/{(total + batch_size - 1)//batch_size}: {done}/{total}\r")
        sys.stdout.flush()
    print(f"\n  UPSERT completato: {done} righe processate")

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)

    # Conteggio prima
    pre = exec_sql("SELECT COUNT(*) AS n FROM attivita_report;")
    print("Prima:", pre)

    upsert_csv("4_report_supabase.csv")

    # Conteggio dopo
    post = exec_sql("SELECT COUNT(*) AS n FROM attivita_report;")
    print("Dopo:", post)
