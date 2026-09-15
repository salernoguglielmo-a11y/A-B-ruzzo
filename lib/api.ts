import "server-only";
import { NextResponse } from "next/server";

/** Errore in forma uniforme per tutte le rotte. */
export const errore = (messaggio: string, stato: number) =>
  NextResponse.json({ errore: messaggio }, { status: stato });

/** Il nome scelto dall'utente, normalizzato. Null se non è stato dichiarato. */
export function autoreDa(body: unknown): string | null {
  const v = (body as { autore?: unknown } | null)?.autore;
  if (typeof v !== "string") return null;
  const pulito = v.trim().slice(0, 60);
  return pulito.length > 0 ? pulito : null;
}

export function clientIdDa(body: unknown): string {
  const v = (body as { clientId?: unknown } | null)?.clientId;
  return typeof v === "string" ? v.slice(0, 80) : "";
}

export async function corpo(req: Request): Promise<unknown> {
  return req.json().catch(() => null);
}
