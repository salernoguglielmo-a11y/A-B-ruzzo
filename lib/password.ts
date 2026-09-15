import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/* Hash della password condivisa. Solo Node: il middleware gira su runtime edge
   e non ne ha bisogno, perché verifica il cookie firmato (vedi lib/session.ts).

   Formato:  scrypt.<N>.<r>.<p>.<sale>.<hash>   con sale e hash in base64url.
   Niente `$` e niente `=`: chi carica i file .env espande i riferimenti del
   tipo `$NOME`, e un hash con i dollari dentro arriverebbe a pezzi. */

const N = 16384;
const R = 8;
const P = 1;
const LUNGHEZZA = 32;

/** Produce la stringa da mettere in DOSSIER_PASSWORD_HASH. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, LUNGHEZZA, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join(".");
}

/** Confronto a tempo costante fra la password digitata e l'hash memorizzato. */
export function verificaPassword(password: string, memorizzato: string): boolean {
  const parti = memorizzato.trim().split(".");
  if (parti.length !== 6 || parti[0] !== "scrypt") return false;

  const n = Number(parti[1]);
  const r = Number(parti[2]);
  const p = Number(parti[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  let salt: Buffer;
  let atteso: Buffer;
  try {
    salt = Buffer.from(parti[4] ?? "", "base64url");
    atteso = Buffer.from(parti[5] ?? "", "base64url");
  } catch {
    return false;
  }
  if (salt.length === 0 || atteso.length === 0) return false;

  let calcolato: Buffer;
  try {
    // maxmem va alzato: il default non basta per N=16384, r=8.
    calcolato = scryptSync(password.normalize("NFKC"), salt, atteso.length, {
      N: n,
      r,
      p,
      maxmem: 256 * 1024 * 1024,
    });
  } catch {
    return false;
  }

  return calcolato.length === atteso.length && timingSafeEqual(calcolato, atteso);
}
