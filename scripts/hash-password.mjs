#!/usr/bin/env node
/**
 * Genera il valore da mettere in DOSSIER_PASSWORD_HASH.
 *
 *   npm run hash-password -- "la password condivisa"
 *
 * Senza argomenti la chiede da terminale, così non resta nella cronologia
 * della shell. La password in chiaro non viene mai scritta da nessuna parte.
 */
import { createInterface } from "node:readline/promises";
import { randomBytes, scryptSync } from "node:crypto";
import { stdin, stdout, argv, exit } from "node:process";

const N = 16384;
const R = 8;
const P = 1;

function hash(password) {
  const salt = randomBytes(16);
  const h = scryptSync(password.normalize("NFKC"), salt, 32, { N, r: R, p: P });
  // Separatore `.` e base64url: nessun `$`, che chi carica i .env espanderebbe.
  return ["scrypt", N, R, P, salt.toString("base64url"), h.toString("base64url")].join(".");
}

let password = argv[2];

if (!password) {
  const rl = createInterface({ input: stdin, output: stdout });
  password = await rl.question("Password condivisa: ");
  rl.close();
}

password = (password ?? "").trim();

if (password.length < 8) {
  console.error("\nLa password deve avere almeno otto caratteri.");
  exit(1);
}

console.log("\nIncolla queste due righe fra le variabili d'ambiente:\n");
console.log(`DOSSIER_PASSWORD_HASH=${hash(password)}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
console.log(
  "\nSESSION_SECRET firma i cookie di sessione: cambiandolo, tutti dovranno rifare la password.\n"
);
