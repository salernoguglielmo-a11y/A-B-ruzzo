import { NextResponse } from "next/server";
import { autoreDa, clientIdDa, corpo, errore } from "@/lib/api";
import { chiaveCampoValida } from "@/lib/keys";
import { supabaseAdmin } from "@/lib/supabase-server";

/** Salva un singolo campo di testo. Mai il documento intero. */
export async function PATCH(req: Request) {
  const body = await corpo(req);
  const key = (body as { key?: unknown } | null)?.key;
  const value = (body as { value?: unknown } | null)?.value;

  if (typeof key !== "string" || typeof value !== "string") {
    return errore("Servono `key` e `value`.", 400);
  }
  if (!chiaveCampoValida(key)) return errore(`Chiave sconosciuta: ${key}`, 400);
  if (value.length > 200_000) return errore("Contenuto troppo lungo.", 413);

  const clientId = clientIdDa(body);
  const db = supabaseAdmin();

  // Il lock vale anche qui: il controllo nel browser è comodità, questo è la regola.
  const { data: lock } = await db
    .from("locks")
    .select("client_id,holder,expires_at")
    .eq("field_key", key)
    .maybeSingle();

  if (lock && lock.client_id !== clientId && new Date(lock.expires_at).getTime() > Date.now()) {
    return NextResponse.json(
      { errore: "Campo occupato.", holder: lock.holder as string },
      { status: 409 }
    );
  }

  const { data, error } = await db
    .from("fields")
    .upsert({ key, value, updated_by: autoreDa(body) }, { onConflict: "key" })
    .select("key,value,updated_at,updated_by")
    .single();

  if (error) return errore(error.message, 500);
  return NextResponse.json({ campo: data });
}
