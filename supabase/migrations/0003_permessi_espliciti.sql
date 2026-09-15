-- ---------------------------------------------------------------------------
-- Dossier ab[B]ruzzo — i permessi, detti per esteso
--
-- Le prime due migrazioni davano per scontato che i ruoli di Supabase
-- ereditassero i permessi da soli: `service_role` dalle default privileges
-- dello schema per le tabelle, e da `PUBLIC` per le funzioni. Nessuna delle
-- due cose è garantita.
--
--   - Le default privileges valgono solo per il ruolo che le ha impostate.
--     Se le tabelle nascono da un ruolo diverso, non si applicano, e il
--     server si ferma su « permission denied for table fields » pur avendo
--     la chiave giusta in mano.
--
--   - Le funzioni, sì, nascono con EXECUTE a PUBLIC — ma 0002 l'ha tolto,
--     ed era giusto toglierlo: serviva a chiudere fuori la chiave anon. Solo
--     che `service_role` non aveva un permesso suo, aveva quello di PUBLIC.
--     Chiudendo la porta a tutti l'ho chiusa anche al server, che da allora
--     non poteva più prenotare un campo.
--
-- Qui non si eredita più niente: ogni ruolo ha scritto accanto che cosa può
-- fare. È più lungo da leggere e non si rompe quando l'ambiente cambia sotto.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

-- --------------------------- il server -------------------------------------
-- Legge e scrive tutto: è lui a servire le rotte API.
grant all privileges on table public.fields    to service_role;
grant all privileges on table public.flags     to service_role;
grant all privileges on table public.questions to service_role;
grant all privileges on table public.locks     to service_role;

-- E prenota i campi. Senza questo, /api/locks risponde 500 e chi scrive non
-- riesce più a bloccare un campo: è il permesso che 0002 aveva portato via.
grant execute on function public.acquire_lock(text, text, text, integer) to service_role;
grant execute on function public.release_lock(text, text) to service_role;

-- ---------------------------- il browser -----------------------------------
-- Sola lettura, che è quanto basta a Realtime. Le scritture passano tutte
-- dalle rotte API.
grant select on table public.fields    to anon, authenticated;
grant select on table public.flags     to anon, authenticated;
grant select on table public.questions to anon, authenticated;
grant select on table public.locks     to anon, authenticated;

revoke insert, update, delete on public.fields, public.flags, public.questions, public.locks
  from anon, authenticated;

-- Le due funzioni restano fuori dalla portata della chiave anon, come in 0002:
-- sono security definer e scavalcherebbero RLS.
revoke execute on function public.acquire_lock(text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.release_lock(text, text) from public, anon, authenticated;
