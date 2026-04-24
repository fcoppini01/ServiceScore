-- ==========================================
-- SQL PER COLLEGARE UTENTI A SOCI/OFFICER
-- Esegui questo SQL nella Supabase Dashboard > SQL Editor
-- ==========================================

-- 1. AGGIUNGI COLONNA user_id ALLA TABELLA SOCI
ALTER TABLE soci ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) UNIQUE;

-- 2. CREA INDICE PER RICERCHE VELOCI
CREATE INDEX IF NOT EXISTS idx_soci_user_id ON soci(user_id);

-- 3. FUNZIONE PER COLLEGARE UTENTE A SOCIO (chiamata dopo conferma email)
CREATE OR REPLACE FUNCTION public.link_user_to_socio(
  p_matricola_socio VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Ottieni l'ID dell'utente attualmente loggato
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utente non autenticato';
  END IF;
  
  -- Aggiorna il socio con il user_id
  UPDATE soci 
  SET user_id = v_user_id 
  WHERE matricola_socio = p_matricola_socio
    AND user_id IS NULL;  -- Solo se non già collegato
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matricola % non trovata o già collegata', p_matricola_socio;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. DAI PERMESSI PER ESEGUIRE LA FUNZIONE
GRANT EXECUTE ON FUNCTION public.link_user_to_socio(VARCHAR) TO authenticated;

-- 5. AGGIORNA RLS PER PERMETTERE AI SOCI DI VEDERE I PROPRI DATI
DROP POLICY IF EXISTS "Soci visibili a utenti autenticati" ON soci;

CREATE POLICY "Soci possono vedere i propri dati" 
ON soci FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR  -- Il proprio record
  EXISTS (  -- O se è un officer
    SELECT 1 FROM officer_club 
    WHERE officer_club.matricola_socio = soci.matricola_socio
    AND officer_club.matricola_socio::text = auth.uid()::text
  )
);

-- ==========================================
-- ISTRUZIONI:
-- 1. Vai su https://app.supabase.com/project/uywtfwjkyiacdfgsbtgo/sql/new
-- 2. Copia e incolla tutto il codice sopra
-- 3. Clicca "Run" per eseguire
-- ==========================================
