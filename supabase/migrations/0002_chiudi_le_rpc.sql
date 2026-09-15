-- ---------------------------------------------------------------------------
-- Dossier ab[B]ruzzo — chiusura delle due funzioni di lock
--
-- La migrazione 0001 faceva:
--
--   revoke execute on function public.acquire_lock(...) from anon, authenticated;
--
-- che non basta. Postgres, creando una funzione, concede EXECUTE a PUBLIC, e
-- PUBLIC comprende ogni ruolo: togliere il permesso ad `anon` lascia in piedi
-- quello che `anon` eredita da PUBLIC. Le due funzioni restavano quindi
-- richiamabili via PostgREST — `/rest/v1/rpc/acquire_lock` — con la sola
-- chiave anon, che il dossier consegna a ogni browser che lo apre.
--
-- Ed essendo SECURITY DEFINER giravano come il proprietario, scavalcando sia
-- RLS sia le revoche sulle tabelle. Chiunque avesse l'indirizzo poteva
-- prenotare tutti i campi del dossier e lasciare gli altri a guardare: le
-- rotte API rispettano i lock, quindi nessuna scrittura sarebbe più passata.
-- Oppure rilasciare la prenotazione di chi stava scrivendo in quel momento.
--
-- Qui si revoca da PUBLIC, che è l'unica revoca che conta. Le rotte API non
-- ne risentono: usano la service_role, che è superutente rispetto a questi
-- controlli.
-- ---------------------------------------------------------------------------

revoke execute on function public.acquire_lock(text, text, text, integer) from public;
revoke execute on function public.release_lock(text, text) from public;

-- E anche nominalmente, per chiarezza di chi legge lo schema.
revoke execute on function public.acquire_lock(text, text, text, integer) from anon, authenticated;
revoke execute on function public.release_lock(text, text) from anon, authenticated;

-- La stessa svista varrebbe per ogni funzione creata da qui in avanti.
alter default privileges in schema public revoke execute on functions from public;
