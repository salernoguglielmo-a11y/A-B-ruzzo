-- ---------------------------------------------------------------------------
-- Dossier ab[B]ruzzo — schema iniziale
--
-- Una sola pratica per installazione: nessuna colonna di tenant, nessun
-- identificativo di documento. I contenuti sono spezzati per campo, così due
-- persone che lavorano su punti diversi della stessa pagina non si toccano.
-- ---------------------------------------------------------------------------

-- ----------------------------- fields --------------------------------------
-- Un record per ogni campo di testo modificabile. La chiave è parlante:
--   meta.dek            meta.lede
--   nodes.<id>.title    nodes.<id>.body    nodes.<id>.body2    nodes.<id>.note
--   classes.<cl>.nt
--   questions.<id>.q    questions.<id>.a   questions.<id>.to
-- Il valore è l'HTML prodotto dal campo contenteditable corrispondente.
create table if not exists public.fields (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

-- ----------------------------- flags ---------------------------------------
-- Stati a scelta chiusa, con lo stesso audit dei campi di testo:
--   nodes.<id>.status      'open' | 'work' | 'wait' | 'block' | 'done'
--   classes.<cl>.in        'true' | 'false'   (spunta della riga)
--   questions.<id>.done    'true' | 'false'   (risposta ottenuta)
-- Il valore resta testuale: i tre insiemi hanno domini diversi e tenerli in
-- una sola colonna evita una tabella per ciascuno.
create table if not exists public.flags (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- --------------------------- questions -------------------------------------
-- Solo identità e ordinamento: i testi della domanda stanno in fields, lo
-- stato "risposta ottenuta" in flags. Così aggiungere o cancellare una domanda
-- non rimescola le chiavi delle altre.
create table if not exists public.questions (
  id         text primary key,
  position   integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists questions_position_idx on public.questions (position);

-- ----------------------------- locks ---------------------------------------
-- Prenotazione temporanea di un campo. Scade da sola dopo trenta secondi e
-- viene rinnovata finché chi la detiene continua a scrivere.
create table if not exists public.locks (
  field_key   text primary key,
  holder      text not null,         -- il nome scelto dall'utente
  client_id   text not null,         -- scheda del browser: distingue due schede
  acquired_at timestamptz not null default now(),
  expires_at  timestamptz not null
);

create index if not exists locks_expires_at_idx on public.locks (expires_at);

-- --------------------------- updated_at ------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists fields_touch on public.fields;
create trigger fields_touch before update on public.fields
  for each row execute function public.touch_updated_at();

drop trigger if exists flags_touch on public.flags;
create trigger flags_touch before update on public.flags
  for each row execute function public.touch_updated_at();

drop trigger if exists questions_touch on public.questions;
create trigger questions_touch before update on public.questions
  for each row execute function public.touch_updated_at();

-- ------------------------- lock: acquisizione ------------------------------
-- Atomica: ripulisce le prenotazioni scadute e concede il campo solo se è
-- libero o se è già di chi lo chiede. Restituisce sempre chi lo detiene, così
-- il client può mostrare il nome anche quando il lock gli viene negato.
create or replace function public.acquire_lock(
  p_field_key text,
  p_holder    text,
  p_client_id text,
  p_ttl_seconds integer default 30
)
returns table (granted boolean, field_key text, holder text, client_id text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
-- I nomi delle colonne restituite coincidono con quelli della tabella: qui si
-- dice a PL/pgSQL che dentro al corpo vince sempre la colonna.
#variable_conflict use_column
declare
  v_row public.locks;
begin
  delete from public.locks where locks.expires_at <= now();

  insert into public.locks as l (field_key, holder, client_id, expires_at)
  values (p_field_key, p_holder, p_client_id, now() + make_interval(secs => p_ttl_seconds))
  on conflict (field_key) do update
    set holder      = excluded.holder,
        client_id   = excluded.client_id,
        expires_at  = excluded.expires_at,
        acquired_at = case when l.client_id = excluded.client_id then l.acquired_at else now() end
    where l.client_id = excluded.client_id
  returning * into v_row;

  if found then
    return query select true, v_row.field_key, v_row.holder, v_row.client_id, v_row.expires_at;
  else
    return query
      select false, l.field_key, l.holder, l.client_id, l.expires_at
      from public.locks l
      where l.field_key = p_field_key;
  end if;
end;
$$;

-- -------------------------- lock: rilascio ---------------------------------
create or replace function public.release_lock(p_field_key text, p_client_id text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.locks
  where field_key = p_field_key and client_id = p_client_id;
$$;

-- ------------------------------ RLS ----------------------------------------
-- Il dossier è aperto, quindi la chiave anon è pubblica di fatto: qui le si
-- concede la sola lettura, che è ciò che serve a Realtime. Ogni scrittura
-- passa dalle rotte API del server, che usano la service role e non sono
-- soggette a queste policy.
alter table public.fields    enable row level security;
alter table public.flags     enable row level security;
alter table public.questions enable row level security;
alter table public.locks     enable row level security;

drop policy if exists fields_read    on public.fields;
drop policy if exists flags_read     on public.flags;
drop policy if exists questions_read on public.questions;
drop policy if exists locks_read     on public.locks;

create policy fields_read    on public.fields    for select to anon, authenticated using (true);
create policy flags_read     on public.flags     for select to anon, authenticated using (true);
create policy questions_read on public.questions for select to anon, authenticated using (true);
create policy locks_read     on public.locks     for select to anon, authenticated using (true);

revoke insert, update, delete on public.fields, public.flags, public.questions, public.locks from anon, authenticated;
-- Da PUBLIC, non solo da anon: creando una funzione Postgres concede EXECUTE
-- a PUBLIC, e togliere il permesso ai singoli ruoli lascia in piedi quello
-- che ereditano da lì. Vedi 0002_chiudi_le_rpc.sql.
revoke execute on function public.acquire_lock(text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.release_lock(text, text) from public, anon, authenticated;

-- --------------------------- Realtime --------------------------------------
-- I client si iscrivono alle modifiche di queste quattro tabelle.
alter table public.locks replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;

-- `add table` non è ripetibile: si aggiunge solo ciò che manca, così la
-- migrazione si può rilanciare senza errori.
do $$
declare
  t text;
begin
  foreach t in array array['fields', 'flags', 'questions', 'locks'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;
