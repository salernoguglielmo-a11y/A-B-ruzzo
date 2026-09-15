import { NextResponse } from "next/server";
import { errore } from "@/lib/api";
import seme from "@/lib/seed-data.json";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/*
 * I contenuti di partenza del dossier, inseriti dal server.
 *
 * È lo stesso lavoro di `npm run seed`, con le stesse garanzie: solo inserti,
 * `ignoreDuplicates` su ogni tabella, nessuna riga esistente toccata. Serve
 * perché altrimenti il primo avvio richiederebbe un computer con la chiave
 * service_role in mano, e chi apre il dossier resterebbe davanti a un
 * database vuoto senza poterci fare niente.
 *
 * La rotta rifiuta di partire se il dossier è già popolato: da lì in poi
 * l'unica via per cambiare i contenuti è il dossier stesso.
 */

type Seme = {
  fields: Record<string, string>;
  flags: Record<string, string>;
  questions: { id: string; position: number }[];
};

export async function POST() {
  const db = supabaseAdmin();
  const dati = seme as Seme;

  const { count, error: erroreConta } = await db
    .from("fields")
    .select("key", { count: "exact", head: true });
  if (erroreConta) return errore(erroreConta.message, 500);
  if ((count ?? 0) > 0) {
    return errore("Il dossier è già popolato: il seed non tocca nulla.", 409);
  }

  const inserisci = async (
    tabella: string,
    righe: Record<string, unknown>[],
    conflitto: string
  ) => {
    if (righe.length === 0) return null;
    const { error } = await db
      .from(tabella)
      .upsert(righe, { onConflict: conflitto, ignoreDuplicates: true });
    return error?.message ?? null;
  };

  const guai =
    (await inserisci(
      "questions",
      dati.questions.map((q) => ({ id: q.id, position: q.position })),
      "id"
    )) ??
    (await inserisci(
      "fields",
      Object.entries(dati.fields).map(([key, value]) => ({ key, value })),
      "key"
    )) ??
    (await inserisci(
      "flags",
      Object.entries(dati.flags).map(([key, value]) => ({ key, value })),
      "key"
    ));

  if (guai) return errore(guai, 500);

  return NextResponse.json({
    ok: true,
    campi: Object.keys(dati.fields).length,
    flag: Object.keys(dati.flags).length,
    domande: dati.questions.length,
  });
}
