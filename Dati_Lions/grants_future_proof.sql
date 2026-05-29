-- =========================================================================
--  GRANT future-proof per Data API Supabase
--  ----------------------------------------------------------------------
--  Riferimento policy Supabase:
--    - 30 mag 2026: i nuovi progetti non espongono piu' di default lo schema
--      "public" alla Data API. Servono GRANT espliciti.
--    - 30 ott 2026: stessa policy applicata alle NUOVE tabelle dei progetti
--      esistenti (quindi al nostro).
--
--  Cosa fa questo script (idempotente, puoi rilanciarlo quando vuoi):
--    1. Concede l'USAGE sullo schema public ai ruoli Data API
--    2. Concede privilegi espliciti su TUTTE le tabelle e viste attuali
--    3. Imposta ALTER DEFAULT PRIVILEGES cosi' ogni NUOVA tabella/vista
--       creata in futuro dal ruolo "postgres" eredita gia' i grant.
--
--  Ruoli coinvolti:
--    - anon          (utente non autenticato, chiavi anon)
--    - authenticated (utente loggato, JWT valido)
--    - service_role  (chiave service, bypass RLS)
--
--  La sicurezza vera sta nelle RLS policy: i GRANT espongono solo "cosa
--  potrebbe essere visto", le RLS decidono "cosa viene effettivamente
--  visto" per ogni riga.
-- =========================================================================

-- 1) USAGE sullo schema public (necessario per accedere a qualsiasi oggetto)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2) Grant espliciti su TUTTE le tabelle/viste gia' esistenti
--    (idempotente: GRANT ripetuti non fanno danni)
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT USAGE, SELECT
  ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT EXECUTE
  ON ALL FUNCTIONS IN SCHEMA public
  TO anon, authenticated, service_role;

-- 3) DEFAULT PRIVILEGES: ogni nuova tabella/vista/sequence/funzione creata
--    dal ruolo "postgres" nello schema public erediterà automaticamente
--    questi grant. Questo e' il fix "future-proof" per il 30/10/2026.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES
  TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES
  TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS
  TO anon, authenticated, service_role;

-- Nota: su Supabase tutte le DDL (Dashboard SQL editor, Management API
-- endpoint /database/query, migrations CLI) girano con il ruolo "postgres",
-- quindi FOR ROLE postgres copre il 100% dei casi pratici. Non serve
-- ripetere ALTER DEFAULT PRIVILEGES per altri ruoli (il "postgres" Supabase
-- non e' superuser e quindi non potrebbe nemmeno farlo).

-- =========================================================================
--  VERIFICA (uncomment per controllare i grant correnti)
-- =========================================================================
-- SELECT table_name, grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privs
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'service_role')
-- GROUP BY table_name, grantee
-- ORDER BY table_name, grantee;
