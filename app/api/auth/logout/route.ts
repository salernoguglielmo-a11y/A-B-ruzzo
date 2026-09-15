import { NextResponse } from "next/server";
import { COOKIE_SESSIONE } from "@/lib/session";

export async function POST() {
  const risposta = NextResponse.json({ ok: true });
  risposta.cookies.set({ name: COOKIE_SESSIONE, value: "", path: "/", maxAge: 0 });
  return risposta;
}
