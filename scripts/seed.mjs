#!/usr/bin/env node
/**
 * Popola il database con i contenuti di partenza del dossier.
 *
 *   npm run seed
 *
 * Non sovrascrive nulla: ogni riga già presente resta com'è. Si può rilanciare
 * quante volte si vuole, per esempio dopo aver aggiunto un nodo al seed.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env, exit } from "node:process";
import { createClient } from "@supabase/supabase-js";

const qui = dirname(fileURLToPath(import.meta.url));
const radice = resolve(qui, "..");

/* Le variabili possono stare in .env.local, che Next legge da solo ma node no. */
for (const file of [".env.local", ".env"]) {
  try {
    const testo = readFileSync(resolve(radice, file), "utf8");
    for (const riga of testo.split("\n")) {
      const m = riga.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, nome, grezzo] = m;
      if (env[nome]) continue;
      env[nome] = grezzo.replace(/^["']|["']$/g, "");
    }
  } catch {
    // il file non c'è: le variabili arrivano dall'ambiente
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const chiave = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !chiave) {
  console.error(
    "Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Mettile in .env.local (vedi .env.example) oppure nell'ambiente."
  );
  exit(1);
}

const db = createClient(url, chiave, { auth: { persistSession: false } });
const seme = JSON.parse(readFileSync(resolve(radice, "lib/seed-data.json"), "utf8"));

/** Inserisce solo ciò che manca: `ignoreDuplicates` lascia stare il resto. */
async function inserisci(tabella, righe, conflitto) {
  if (righe.length === 0) return 0;
  const { error } = await db.from(tabella).upsert(righe, {
    onConflict: conflitto,
    ignoreDuplicates: true,
  });
  if (error) {
    console.error(`\nInserimento in ${tabella} non riuscito: ${error.message}`);
    exit(1);
  }
  return righe.length;
}

async function quante(tabella) {
  const { count, error } = await db.from(tabella).select("*", { count: "exact", head: true });
  if (error) {
    console.error(`\nLettura di ${tabella} non riuscita: ${error.message}`);
    console.error("La migrazione in supabase/migrations/ è stata applicata?");
    exit(1);
  }
  return count ?? 0;
}

const primaCampi = await quante("fields");
const primaFlag = await quante("flags");
const primaDomande = await quante("questions");

// Le domande prima dei loro testi non servono: l'ordine qui è indifferente,
// perché nessuno sta ancora guardando.
await inserisci(
  "questions",
  seme.questions.map((q) => ({ id: q.id, position: q.position })),
  "id"
);
await inserisci(
  "fields",
  Object.entries(seme.fields).map(([key, value]) => ({ key, value })),
  "key"
);
await inserisci(
  "flags",
  Object.entries(seme.flags).map(([key, value]) => ({ key, value })),
  "key"
);

const dopoCampi = await quante("fields");
const dopoFlag = await quante("flags");
const dopoDomande = await quante("questions");

const riga = (nome, prima, dopo) =>
  `  ${nome.padEnd(9)} ${String(dopo).padStart(4)}  (${dopo - prima > 0 ? `+${dopo - prima}` : "nessuna aggiunta"})`;

console.log("\nSeed completato.\n");
console.log(riga("campi", primaCampi, dopoCampi));
console.log(riga("flag", primaFlag, dopoFlag));
console.log(riga("domande", primaDomande, dopoDomande));
console.log(
  primaCampi > 0
    ? "\nC'erano già dei dati: nulla è stato sovrascritto.\n"
    : "\nIl dossier è pronto.\n"
);
