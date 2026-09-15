import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* Client con la service role: scavalca le policy RLS. Vive solo sul server e
   non deve mai finire in un bundle spedito al browser. */

/** Le tre variabili senza cui il dossier non può funzionare. */
export const VARIABILI_RICHIESTE = [
  {
    nome: "NEXT_PUBLIC_SUPABASE_URL",
    serve: "l'indirizzo del progetto Supabase, usato dal server e dal browser",
  },
  {
    nome: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    serve: "la chiave in sola lettura con cui il browser ascolta Realtime",
  },
  {
    nome: "SUPABASE_SERVICE_ROLE_KEY",
    serve: "la chiave con cui il server legge e scrive; resta sul server",
  },
] as const;

/**
 * Quali delle tre mancano, adesso, nell'ambiente in cui gira questo processo.
 *
 * La lettura è dinamica di proposito: così riporta ciò che c'è davvero al
 * momento della richiesta, e non un valore congelato quando il sito è stato
 * costruito.
 */
export function variabiliMancanti(): string[] {
  return VARIABILI_RICHIESTE.filter((v) => !process.env[v.nome]?.trim()).map((v) => v.nome);
}

let cache: SupabaseClient | null = null;

function richiesta(nome: string): string {
  const v = process.env[nome]?.trim();
  if (!v) throw new Error(`Variabile d'ambiente mancante: ${nome}. Vedi .env.example.`);
  return v;
}

export function supabaseAdmin(): SupabaseClient {
  if (!cache) {
    cache = createClient(
      richiesta("NEXT_PUBLIC_SUPABASE_URL"),
      richiesta("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return cache;
}
