import { NextResponse } from "next/server";
import { autoreDa, corpo, errore } from "@/lib/api";
import { flagValido } from "@/lib/keys";
import { supabaseAdmin } from "@/lib/supabase-server";

type Aggiornamento = { key: string; value: string };

/**
 * Scrive uno o più flag. Arrivano insieme quando si preme un perimetro, che
 * cambia le spunte di tutte e undici le classi in un colpo solo.
 */
export async function PATCH(req: Request) {
  const body = await corpo(req);
  const grezzi = (body as { updates?: unknown } | null)?.updates;

  if (!Array.isArray(grezzi) || grezzi.length === 0) return errore("Serve `updates`.", 400);
  if (grezzi.length > 100) return errore("Troppi flag in una sola richiesta.", 400);

  const aggiornamenti: Aggiornamento[] = [];
  for (const g of grezzi) {
    const key = (g as { key?: unknown })?.key;
    const value = (g as { value?: unknown })?.value;
    if (typeof key !== "string" || typeof value !== "string" || !flagValido(key, value)) {
      return errore(`Flag non valido: ${String(key)}`, 400);
    }
    aggiornamenti.push({ key, value });
  }

  const updated_by = autoreDa(body);
  const { data, error } = await supabaseAdmin()
    .from("flags")
    .upsert(
      aggiornamenti.map((a) => ({ ...a, updated_by })),
      { onConflict: "key" }
    )
    .select("key,value,updated_at,updated_by");

  if (error) return errore(error.message, 500);
  return NextResponse.json({ flag: data });
}
