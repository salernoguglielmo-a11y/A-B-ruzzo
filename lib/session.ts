/* Cookie di sessione: `<scadenza>.<firma>`, dove la firma è un HMAC-SHA256
   della scadenza con SESSION_SECRET. Usa Web Crypto, così le stesse funzioni
   girano nel middleware (edge) e nelle rotte API (node). */

export const COOKIE_SESSIONE = "dossier_sessione";
export const DURATA_SESSIONE_MS = 30 * 24 * 60 * 60 * 1000; // trenta giorni

const encoder = new TextEncoder();

function segreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET mancante o troppo corto: servono almeno 16 caratteri.");
  }
  return s;
}

async function chiave(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(segreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function base64url(buf: ArrayBuffer): string {
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function firma(payload: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await chiave(), encoder.encode(payload));
  return base64url(sig);
}

/** Token valido fino a `scadenza` (millisecondi epoch). */
export async function creaToken(scadenza: number): Promise<string> {
  const payload = `v1:${scadenza}`;
  return `${scadenza}.${await firma(payload)}`;
}

/** true se il token è integro e non scaduto. Confronto a tempo costante. */
export async function tokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const punto = token.indexOf(".");
  if (punto <= 0) return false;

  const grezzo = token.slice(0, punto);
  const fornita = token.slice(punto + 1);
  const scadenza = Number(grezzo);
  if (!Number.isFinite(scadenza) || scadenza <= Date.now()) return false;

  let attesa: string;
  try {
    attesa = await firma(`v1:${scadenza}`);
  } catch {
    return false;
  }

  if (attesa.length !== fornita.length) return false;
  let diff = 0;
  for (let i = 0; i < attesa.length; i++) diff |= attesa.charCodeAt(i) ^ fornita.charCodeAt(i);
  return diff === 0;
}
