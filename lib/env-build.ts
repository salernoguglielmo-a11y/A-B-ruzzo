/**
 * I valori delle due variabili pubbliche *come erano quando il sito è stato
 * costruito*.
 *
 * Qui `process.env.NEXT_PUBLIC_…` è scritto per esteso di proposito: Next lo
 * sostituisce con il valore letterale durante la build, sia nel bundle del
 * browser sia in quello del server. Quindi queste due costanti fotografano
 * l'ambiente di *costruzione*, non quello di esecuzione.
 *
 * È la differenza che conta. `lib/supabase-server.ts` legge le stesse
 * variabili in modo dinamico, `process.env[nome]`, e quella lettura Next non
 * la può sostituire: riporta l'ambiente di *esecuzione*.
 *
 * Confrontando le due si scopre il caso che altrimenti lascia la pagina
 * bianca: le variabili sono state aggiunte su Vercel ma il sito non è stato
 * ricostruito. Il server le vede e disegna il dossier; il browser, costruito
 * prima, non le ha e va in errore appena prova a collegarsi a Realtime.
 */
export const URL_DI_COSTRUZIONE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const ANON_DI_COSTRUZIONE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Le due variabili pubbliche che mancavano al momento della build. */
export function pubblicheNonCostruite(): string[] {
  const fuori: string[] = [];
  if (!URL_DI_COSTRUZIONE.trim()) fuori.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!ANON_DI_COSTRUZIONE.trim()) fuori.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return fuori;
}
