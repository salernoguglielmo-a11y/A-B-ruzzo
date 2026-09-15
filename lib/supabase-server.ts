import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* Client con la service role: scavalca le policy RLS. Vive solo sul server e
   non deve mai finire in un bundle spedito al browser. */

let cache: SupabaseClient | null = null;

function richiesta(nome: string): string {
  const v = process.env[nome];
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
