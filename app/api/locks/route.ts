import { NextResponse } from "next/server";
import { autoreDa, clientIdDa, corpo, errore } from "@/lib/api";
import { chiaveCampoValida } from "@/lib/keys";
import { supabaseAdmin } from "@/lib/supabase-server";

const TTL_SECONDI = 30;

type RigaLock = {
  granted: boolean;
  field_key: string;
  holder: string;
  client_id: string;
  expires_at: string;
};

/**
 * Prende, rinnova o rilascia la prenotazione di un campo.
 *
 * È tutto su POST e non su DELETE perché al `beforeunload` il rilascio parte
 * con `navigator.sendBeacon`, che sa fare soltanto POST.
 */
export async function POST(req: Request) {
  const body = await corpo(req);
  const azione = (body as { azione?: unknown } | null)?.azione;
  const key = (body as { key?: unknown } | null)?.key;

  if (typeof key !== "string" || !chiaveCampoValida(key)) {
    return errore("Chiave non valida.", 400);
  }

  const clientId = clientIdDa(body);
  if (!clientId) return errore("Serve `clientId`.", 400);

  const db = supabaseAdmin();

  if (azione === "rilascia") {
    const { error } = await db.rpc("release_lock", { p_field_key: key, p_client_id: clientId });
    if (error) return errore(error.message, 500);
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await db.rpc("acquire_lock", {
    p_field_key: key,
    p_holder: autoreDa(body) ?? "qualcuno",
    p_client_id: clientId,
    p_ttl_seconds: TTL_SECONDI,
  });
  if (error) return errore(error.message, 500);

  const riga = (Array.isArray(data) ? data[0] : data) as RigaLock | undefined;
  if (!riga) return NextResponse.json({ granted: true, lock: null });

  return NextResponse.json({
    granted: riga.granted,
    lock: {
      field_key: riga.field_key,
      holder: riga.holder,
      client_id: riga.client_id,
      expires_at: riga.expires_at,
    },
  });
}
