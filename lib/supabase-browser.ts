"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* Client del browser: chiave anon, che le policy RLS limitano alla sola
   lettura. Serve unicamente ad ascoltare Realtime; ogni scrittura passa dalle
   rotte API. Arriva al browser soltanto dopo la password, perché il bundle è
   servito da rotte protette dal middleware. */

let cache: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (!cache) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY non sono impostate."
      );
    }
    cache = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return cache;
}
