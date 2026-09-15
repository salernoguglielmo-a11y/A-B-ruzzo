import { NextResponse } from "next/server";
import { caricaSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

/** Riallineamento completo: lo chiama il client ogni volta che si riconnette. */
export async function GET() {
  try {
    return NextResponse.json(await caricaSnapshot(), {
      headers: { "cache-control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { errore: e instanceof Error ? e.message : "Lettura non riuscita." },
      { status: 500 }
    );
  }
}
