import "server-only";
import { supabaseAdmin } from "./supabase-server";
import type { Lock, RigaDomanda, RigaValore, Snapshot, Valore } from "./types";

function indicizza(righe: RigaValore[] | null): Record<string, Valore> {
  const out: Record<string, Valore> = {};
  for (const r of righe ?? []) {
    out[r.key] = { value: r.value, updatedAt: r.updated_at, updatedBy: r.updated_by };
  }
  return out;
}

/** Lo stato corrente del dossier, letto dal database con la service role. */
export async function caricaSnapshot(): Promise<Snapshot> {
  const db = supabaseAdmin();
  const adesso = new Date().toISOString();

  const [campi, flag, domande, lock] = await Promise.all([
    db.from("fields").select("key,value,updated_at,updated_by"),
    db.from("flags").select("key,value,updated_at,updated_by"),
    db.from("questions").select("id,position").order("position", { ascending: true }),
    db.from("locks").select("field_key,holder,client_id,expires_at").gt("expires_at", adesso),
  ]);

  const errore = campi.error ?? flag.error ?? domande.error ?? lock.error;
  if (errore) throw new Error(`Lettura dal database non riuscita: ${errore.message}`);

  const fields = indicizza(campi.data as RigaValore[] | null);

  return {
    fields,
    flags: indicizza(flag.data as RigaValore[] | null),
    questions: (domande.data ?? []) as RigaDomanda[],
    locks: (lock.data ?? []) as Lock[],
    popolato: Object.keys(fields).length > 0,
  };
}
