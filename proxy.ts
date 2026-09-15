import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSIONE, tokenValido } from "@/lib/session";

/* Il middleware di Next 16, che dalla 16 si chiama `proxy`. Protegge tutto:
   la pagina, le rotte API e il file dell'allegato in /public. L'unica porta
   aperta è quella della password. */

const APERTE = ["/login", "/api/auth/login"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const aperta = APERTE.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  let autenticato = false;
  try {
    autenticato = await tokenValido(req.cookies.get(COOKIE_SESSIONE)?.value);
  } catch {
    // SESSION_SECRET mancante: nessuno entra, e il login lo dirà con chiarezza.
    autenticato = false;
  }

  if (autenticato) {
    if (pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (aperta) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ errore: "sessione scaduta" }, { status: 401 });
  }

  const destinazione = new URL("/login", req.url);
  if (pathname !== "/") destinazione.searchParams.set("da", pathname);
  return NextResponse.redirect(destinazione);
}

export const config = {
  // Tutto tranne gli asset interni di Next: così anche /allegato/… è protetto.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
