import { NextResponse } from "next/server";
import { verificaPassword } from "@/lib/password";
import { COOKIE_SESSIONE, DURATA_SESSIONE_MS, creaToken } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  const memorizzato = process.env.DOSSIER_PASSWORD_HASH;
  if (!memorizzato) {
    return NextResponse.json(
      { errore: "DOSSIER_PASSWORD_HASH non è impostata sul server." },
      { status: 500 }
    );
  }
  if (!process.env.SESSION_SECRET) {
    return NextResponse.json(
      { errore: "SESSION_SECRET non è impostata sul server." },
      { status: 500 }
    );
  }

  // Ritardo fisso: rende inutile misurare i tempi di risposta.
  await new Promise((r) => setTimeout(r, 250));

  if (!password || !verificaPassword(password, memorizzato)) {
    return NextResponse.json({ errore: "Password non valida." }, { status: 401 });
  }

  const scadenza = Date.now() + DURATA_SESSIONE_MS;
  const risposta = NextResponse.json({ ok: true });
  risposta.cookies.set({
    name: COOKIE_SESSIONE,
    value: await creaToken(scadenza),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(DURATA_SESSIONE_MS / 1000),
  });
  return risposta;
}
