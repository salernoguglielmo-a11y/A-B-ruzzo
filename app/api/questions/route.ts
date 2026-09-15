import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { autoreDa, corpo, errore } from "@/lib/api";
import { chiaveDomanda, chiaveRisposta } from "@/lib/keys";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const RE_ID = /^[A-Za-z0-9_-]{1,32}$/;

/** Le tre chiavi di testo e il flag che accompagnano ogni domanda. */
const chiaviDi = (id: string) => ({
  campi: [chiaveDomanda(id, "q"), chiaveDomanda(id, "a"), chiaveDomanda(id, "to")],
  flag: chiaveRisposta(id),
});

/** Aggiunge una domanda in fondo all'elenco. */
export async function POST(req: Request) {
  const body = await corpo(req);
  const updated_by = autoreDa(body);
  const id = `q${randomBytes(5).toString("hex")}`;
  const db = supabaseAdmin();

  const { data: ultima, error: erroreLettura } = await db
    .from("questions")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (erroreLettura) return errore(erroreLettura.message, 500);

  const position = ((ultima?.position as number | undefined) ?? 0) + 1;

  // Prima i contenuti, poi la riga che li rende visibili: chi riceve l'evento
  // di inserimento trova la domanda già completa.
  const { error: erroreCampi } = await db.from("fields").insert([
    { key: chiaveDomanda(id, "q"), value: "Nuova domanda", updated_by },
    { key: chiaveDomanda(id, "a"), value: "", updated_by },
    { key: chiaveDomanda(id, "to"), value: "—", updated_by },
  ]);
  if (erroreCampi) return errore(erroreCampi.message, 500);

  const { error: erroreFlag } = await db
    .from("flags")
    .insert({ key: chiaveRisposta(id), value: "false", updated_by });
  if (erroreFlag) return errore(erroreFlag.message, 500);

  const { error: erroreDomanda } = await db
    .from("questions")
    .insert({ id, position, updated_by });
  if (erroreDomanda) return errore(erroreDomanda.message, 500);

  return NextResponse.json({ domanda: { id, position } });
}

/** Cancella una domanda e tutto ciò che le appartiene. */
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!RE_ID.test(id)) return errore("Identificativo non valido.", 400);

  const db = supabaseAdmin();
  const { campi, flag } = chiaviDi(id);

  const { error: erroreDomanda } = await db.from("questions").delete().eq("id", id);
  if (erroreDomanda) return errore(erroreDomanda.message, 500);

  await db.from("fields").delete().in("key", campi);
  await db.from("flags").delete().eq("key", flag);

  return NextResponse.json({ ok: true });
}

/** Sposta una domanda di un posto, scambiandola con la vicina. */
export async function PATCH(req: Request) {
  const body = await corpo(req);
  const id = (body as { id?: unknown } | null)?.id;
  const direzione = (body as { direzione?: unknown } | null)?.direzione;

  if (typeof id !== "string" || !RE_ID.test(id)) return errore("Identificativo non valido.", 400);
  if (direzione !== "su" && direzione !== "giu") return errore("Direzione non valida.", 400);

  const db = supabaseAdmin();
  const { data: tutte, error } = await db
    .from("questions")
    .select("id,position")
    .order("position", { ascending: true });
  if (error) return errore(error.message, 500);

  const elenco = (tutte ?? []) as { id: string; position: number }[];
  const i = elenco.findIndex((d) => d.id === id);
  if (i < 0) return errore("Domanda inesistente.", 404);

  const j = direzione === "su" ? i - 1 : i + 1;
  if (j < 0 || j >= elenco.length) return NextResponse.json({ ok: true });

  // Le posizioni vengono riscritte da zero: così restano contigue anche dopo
  // qualche cancellazione.
  const riordinato = [...elenco];
  const a = riordinato[i];
  const b = riordinato[j];
  if (!a || !b) return errore("Riordino non riuscito.", 500);
  riordinato[i] = b;
  riordinato[j] = a;

  const updated_by = autoreDa(body);
  for (let k = 0; k < riordinato.length; k++) {
    const d = riordinato[k];
    if (!d) continue;
    const { error: e } = await db
      .from("questions")
      .update({ position: k + 1, updated_by })
      .eq("id", d.id);
    if (e) return errore(e.message, 500);
  }

  return NextResponse.json({ ok: true });
}
