"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ANON_DI_COSTRUZIONE, URL_DI_COSTRUZIONE } from "./env-build";

/* Client del browser: chiave anon, che le policy RLS limitano alla sola
   lettura. Serve unicamente ad ascoltare Realtime; ogni scrittura passa dalle
   rotte API.

   Il dossier è aperto: non c'è autenticazione, quindi questa chiave è
   pubblica di fatto, come lo sono i contenuti. Le policy fanno sì che valga
   solo a leggere, mai a scrivere.

   Se le due variabili non c'erano al momento della build, qui non si solleva
   un errore: si restituisce `null`. Sollevarlo significherebbe far cadere
   l'intero albero dei componenti — e con nessun error boundary sopra, la
   pagina diventerebbe bianca. Meglio un dossier che funziona senza
   sincronizzazione in diretta, e che lo dice. */

let cache: SupabaseClient | null = null;

/** Null quando il sito è stato costruito senza le due variabili pubbliche. */
export function supabaseBrowser(): SupabaseClient | null {
  if (!URL_DI_COSTRUZIONE || !ANON_DI_COSTRUZIONE) return null;
  if (!cache) {
    cache = createClient(URL_DI_COSTRUZIONE, ANON_DI_COSTRUZIONE, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return cache;
}
