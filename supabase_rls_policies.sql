-- ==========================================
-- ROW LEVEL SECURITY POLICIES PER SERVICESCORE
-- Esegui questo SQL nella Supabase Dashboard > SQL Editor
-- ==========================================

-- 1. ABILITA RLS SU TUTTE LE TABELLE
ALTER TABLE club ENABLE ROW LEVEL SECURITY;
ALTER TABLE soci ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_club ENABLE ROW LEVEL SECURITY;
ALTER TABLE attivita_report ENABLE ROW LEVEL SECURITY;

-- 2. POLICY PER CLUB (Lettura pubblica per utenti autenticati)
CREATE POLICY "Club visibili a utenti autenticati" 
ON club FOR SELECT 
TO authenticated 
USING (true);

-- 3. POLICY PER SOCI (Lettura per utenti autenticati)
CREATE POLICY "Soci visibili a utenti autenticati" 
ON soci FOR SELECT 
TO authenticated 
USING (true);

-- 4. POLICY PER OFFICER_CLUB (Lettura per utenti autenticati)
CREATE POLICY "Officer visibili a utenti autenticati" 
ON officer_club FOR SELECT 
TO authenticated 
USING (true);

-- 5. POLICY PER ATTIVITA_REPORT
-- Lettura per utenti autenticati
CREATE POLICY "Report visibili a utenti autenticati" 
ON attivita_report FOR SELECT 
TO authenticated 
USING (true);

-- Inserimento permesso solo agli officer (chi ha un ruolo nella tabella officer_club)
CREATE POLICY "Inserimento report permesso agli officer" 
ON attivita_report FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM officer_club 
    WHERE officer_club.matricola_socio = auth.uid()::text
    AND (officer_club.data_conclusione IS NULL OR officer_club.data_conclusione >= CURRENT_DATE)
  )
);

-- Aggiornamento permesso solo agli officer del club relativo
CREATE POLICY "Aggiornamento report permesso agli officer" 
ON attivita_report FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM officer_club 
    WHERE officer_club.matricola_socio = auth.uid()::text
    AND (officer_club.data_conclusione IS NULL OR officer_club.data_conclusione >= CURRENT_DATE)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM officer_club 
    WHERE officer_club.matricola_socio = auth.uid()::text
    AND (officer_club.data_conclusione IS NULL OR officer_club.data_conclusione >= CURRENT_DATE)
  )
);

-- 6. POLICY PER VISTE (Le viste ereditano le policy delle tabelle base)
-- Nota: Le viste non supportano RLS direttamente, ma le RLS sulle tabelle base si applicano
-- quando si accede tramite le viste se si usa SECURITY INVOKER (default).

-- ==========================================
-- ISTRUZIONI PER L'ESECUZIONE:
-- 1. Vai su https://app.supabase.com/project/uywtfwjkyiacdfgsbtgo/sql/new
-- 2. Copia e incolla tutto il codice SQL sopra
-- 3. Clicca "Run" per eseguire
-- ==========================================
