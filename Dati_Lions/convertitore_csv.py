import pandas as pd
import numpy as np

def pulisci_numero(valore):
    """Sostituisce la virgola con il punto e rimuove eventuali punti delle migliaia."""
    if pd.isna(valore) or str(valore).strip() == '':
        return '0'
    # Rimuove spazi, simboli valuta o altri caratteri non numerici comuni
    s = str(valore).replace(' ', '').replace('€', '').strip()
    
    # Gestione formati europei (es. 1.234,56 -> 1234.56)
    if '.' in s and ',' in s:
        s = s.replace('.', '').replace(',', '.')
    # Gestione solo virgola (es. 1234,56 -> 1234.56)
    elif ',' in s:
        s = s.replace(',', '.')
    
    # Verifica che sia un numero valido, altrimenti ritorna 0
    try:
        float(s)
        return s
    except ValueError:
        return '0'

def converti_dati_lions():
    print("Inizio l'elaborazione dei file CSV...")

    try:
        # 1. LEGGI I FILE ORIGINALI
        df_officer_raw = pd.read_csv('officer.csv', dtype=str, encoding='latin1', sep=';')
        df_soci_raw = pd.read_csv('soci.csv', dtype=str, encoding='latin1', sep=';')
        df_report_raw = pd.read_csv('report.csv', dtype=str, encoding='latin1', sep=';')

        # Pulizia automatica delle intestazioni
        df_officer_raw.columns = df_officer_raw.columns.str.strip()
        df_soci_raw.columns = df_soci_raw.columns.str.strip()
        df_report_raw.columns = df_report_raw.columns.str.strip()

        # ---------------------------------------------------------
        # TABELLA 1: CLUB (MIGLIORATA)
        # Estraiamo i club da TUTTI i file per evitare errori di Foreign Key
        # ---------------------------------------------------------
        print("Elaborazione tabella 'club' (unione dati da Officer e Report)...")
        
        # Estrazione da Officer
        mapping_club_off = {
            'ID account': 'id_account',
            'Nome account': 'nome_club',
            'Nome account (locale)': 'nome_account_locale',
            'Identificativo Lions': 'identificativo_lions',
            'Tipo': 'tipo',
            'Circoscrizione di appartenenza': 'circoscrizione',
            'Zona di appartenenza': 'zona',
            'Distretto di appartenenza': 'distretto',
            'Multidistretto di appartenenza': 'multidistretto',
            'ID dell?organizzazione di appartenenza': 'id_organizzazione_appartenenza',
            'Parent Parent Id': 'parent_parent_id',
            'Parent District Id': 'parent_district_id',
            'Identificativo del MD di appartenenza': 'id_md_appartenenza',
            'Identificativo Lions Affiliato': 'identificativo_lions_affiliato'
        }
        cols_club_off = [c for c in mapping_club_off.keys() if c in df_officer_raw.columns]
        df_c1 = df_officer_raw[cols_club_off].copy().rename(columns=mapping_club_off)

        # Estrazione da Report (per i club che non hanno officer ma hanno attività)
        mapping_club_rep = {
            'Sponsor: ID dell?organizzazione di appartenenza': 'id_account_club',
            'Sponsor: Nome account': 'nome_club',
            'Zona dello sponsor': 'zona',
            'Circoscrizione sponsor': 'circoscrizione',
            'Distretto sponsor': 'distretto',
            'MD sponsor': 'multidistretto'
        }
        cols_club_rep = [c for c in mapping_club_rep.keys() if c in df_report_raw.columns]
        df_c2 = df_report_raw[cols_club_rep].copy().rename(columns={
            'Sponsor: ID dell?organizzazione di appartenenza': 'id_account',
            'Sponsor: Nome account': 'nome_club',
            'Zona dello sponsor': 'zona',
            'Circoscrizione sponsor': 'circoscrizione',
            'Distretto sponsor': 'distretto',
            'MD sponsor': 'multidistretto'
        })

        # Unione dei dati dei club e rimozione duplicati
        df_club = pd.concat([df_c1, df_c2], ignore_index=True)
        df_club.drop_duplicates(subset=['id_account'], keep='first', inplace=True)
        df_club.to_csv('1_club_supabase.csv', index=False)

        # ---------------------------------------------------------
        # TABELLA 2: SOCI
        # ---------------------------------------------------------
        print("Elaborazione tabella 'soci'...")
        mapping_soci = {
            'Contatto: Matricola socio': 'matricola_socio',
            'Identificativo Lions': 'identificativo_lions_club',
            'Contatto: Nome': 'nome',
            'Contatto: Secondo nome': 'secondo_nome',
            'Contatto: Cognome': 'cognome',
            'Contatto: Nome (locale)': 'nome_locale',
            'Contatto: Secondo nome (locale)': 'secondo_nome_locale',
            'Contatto: Cognome (locale)': 'cognome_locale',
            'Contatto: Suffisso': 'suffisso',
            'Contatto: Soprannome': 'soprannome',
            'Contatto: Titolo': 'titolo',
            'Contatto: Genere': 'sesso',
            'Contatto: Compleanno': 'data_nascita',
            'Data di ingresso nell?associazione': 'data_ingresso',
            'Tipo associazione intera': 'tipo_associazione_intera',
            'Categoria associativa': 'categoria_associativa',
            'Programma': 'programma',
            'Nome dello sponsor del socio': 'nome_sponsor',
            'Contatto: Preferred Email': 'email_preferita',
            'Contatto: Personal Email': 'email_personale',
            'Contatto: Work Email': 'email_lavoro',
            'Contatto: Alternate Email': 'email_alternativa',
            'Contatto: Preferred Phone': 'telefono_preferito',
            'Contatto: Cellulare': 'telefono_cellulare',
            'Contatto: Telefono (abit.)': 'telefono_abitazione',
            'Contatto: Altro telefono': 'altro_telefono',
            'Contatto: Fax': 'fax',
            'Contatto: Indirizzo postale (riga 1)': 'indirizzo_riga1',
            'Contatto: Indirizzo postale (riga 2)': 'indirizzo_riga2',
            'Contatto: Indirizzo postale (riga 3)': 'indirizzo_riga3',
            'Contatto: Indirizzo': 'indirizzo_locale',
            'Contatto: Città indirizzo postale': 'citta',
            'Contatto: Stato/Provincia indirizzo postale': 'stato_provincia',
            'Contatto: CAP indirizzo postale': 'cap',
            'Contatto: Paese indirizzo postale': 'paese',
            'Contatto: Nome del coniuge': 'nome_coniuge',
            'Contatto: Stato del coniuge': 'stato_coniuge',
            'Contatto: Professione': 'professione'
        }
        
        cols_soci = [c for c in mapping_soci.keys() if c in df_soci_raw.columns]
        df_soci = df_soci_raw[cols_soci].copy()
        df_soci.rename(columns=mapping_soci, inplace=True)
        
        for col in ['data_nascita', 'data_ingresso']:
            if col in df_soci.columns:
                df_soci[col] = pd.to_datetime(df_soci[col], dayfirst=True, errors='coerce').dt.strftime('%Y-%m-%d')
            
        df_soci.drop_duplicates(subset=['matricola_socio'], keep='first', inplace=True)
        df_soci.to_csv('2_soci_supabase.csv', index=False)

        # ---------------------------------------------------------
        # TABELLA 3: OFFICER CLUB
        # ---------------------------------------------------------
        print("Elaborazione tabella 'officer'...")
        mapping_officer = {
            'Socio: Matricola socio': 'matricola_socio',
            'Titolo ufficiale': 'titolo_ufficiale',
            "Data d'inizio": 'data_inizio',
            'Data di conclusione': 'data_conclusione'
        }
        
        cols_off = [c for c in mapping_officer.keys() if c in df_officer_raw.columns]
        df_officer = df_officer_raw[cols_off].copy()
        df_officer.rename(columns=mapping_officer, inplace=True)
        
        for col in ['data_inizio', 'data_conclusione']:
            if col in df_officer.columns:
                df_officer[col] = pd.to_datetime(df_officer[col], dayfirst=True, errors='coerce').dt.strftime('%Y-%m-%d')
            
        df_officer.dropna(subset=['matricola_socio'], inplace=True)
        df_officer.to_csv('3_officer_supabase.csv', index=False)

        # ---------------------------------------------------------
        # TABELLA 4: REPORT ATTIVITA'
        # ---------------------------------------------------------
        print("Elaborazione tabella 'report'...")
        mapping_report = {
            'ID attività di servizio': 'id_attivita',
            'Sponsor: ID dell?organizzazione di appartenenza': 'id_account_club',
            'Titolo': 'titolo', 'Descrizione': 'descrizione', 'Stato': 'stato',
            'Rapporto completo': 'rapporto_completo', 'Livello dell\'attività': 'livello_attivita',
            'Causa': 'causa', 'Tipo di progetto': 'tipo_progetto',
            'Attività distintiva': 'attivita_distintiva',
            'Finanziata con il contributo della LCIF': 'finanziata_lcif',
            "Data d'inizio": 'data_inizio', 'Data di conclusione': 'data_conclusione',
            'Persone servite': 'persone_servite',
            'Persone servite - Limite massimo': 'persone_servite_limite',
            'Totale volontari': 'totale_volontari',
            'Totale ore di servizio': 'totale_ore_servizio',
            'Total Volunteer Hours - Capped': 'totale_ore_servizio_capped',
            'Alberi piantati/curati': 'alberi_piantati',
            'Totale fondi donati Valuta': 'valuta_fondi_donati',
            'Totale fondi donati': 'totale_fondi_donati',
            'Total Funds Donated (USD) - Capped': 'fondi_donati_usd_capped',
            'Donazione alla LCIF': 'donazione_lcif',
            'Organizzazione beneficiata': 'organizzazione_beneficiata',
            'Totale fondi raccolti Valuta': 'valuta_fondi_raccolti',
            'Totale fondi raccolti': 'totale_fondi_raccolti',
            'Total Funds Raised (USD) - Capped': 'fondi_raccolti_usd_capped',
            'Creato da: Nome completo': 'creato_da'
        }
        
        cols_rep = [c for c in mapping_report.keys() if c in df_report_raw.columns]
        df_report = df_report_raw[cols_rep].copy()
        df_report.rename(columns=mapping_report, inplace=True)
        
        for col in ['data_inizio', 'data_conclusione']:
            if col in df_report.columns:
                df_report[col] = pd.to_datetime(df_report[col], dayfirst=True, errors='coerce').dt.strftime('%Y-%m-%d')
            
        num_cols = [
            'persone_servite', 'persone_servite_limite', 'totale_volontari', 
            'totale_ore_servizio', 'totale_ore_servizio_capped', 'alberi_piantati',
            'totale_fondi_donati', 'fondi_donati_usd_capped', 'donazione_lcif',
            'totale_fondi_raccolti', 'fondi_raccolti_usd_capped'
        ]
        for col in num_cols:
            if col in df_report.columns:
                df_report[col] = df_report[col].apply(pulisci_numero)

        bool_cols = ['rapporto_completo', 'attivita_distintiva', 'finanziata_lcif']
        for col in bool_cols:
            if col in df_report.columns:
                df_report[col] = df_report[col].apply(lambda x: 'TRUE' if str(x).strip() == '1' else ('FALSE' if str(x).strip() == '0' else ''))

        df_report.to_csv('4_report_supabase.csv', index=False)

        print("--------------------------------------------------")
        print("OPERAZIONE COMPLETATA CON SUCCESSO!")
        print("1. Svuota la tabella 'club' su Supabase (TRUNCATE TABLE club CASCADE).")
        print("2. Re-importa i file in ordine: 1_club, 2_soci, 3_officer, 4_report.")
        print("--------------------------------------------------")

    except Exception as e:
        print(f"\nERRORE DURANTE L'ELABORAZIONE: {e}")

if __name__ == "__main__":
    converti_dati_lions()