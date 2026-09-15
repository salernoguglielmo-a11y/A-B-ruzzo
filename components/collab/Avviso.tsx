"use client";

import { useCollab } from "./CollabProvider";

/** La striscia che compare quando qualcosa non gira come dovrebbe. */
export default function Avviso() {
  const { connesso, inCoda, sincronizzazioneViva, deploy } = useCollab();

  /* Questo caso viene prima: non è la rete che manca, è il sito che è stato
     costruito senza le variabili pubbliche. Dirlo « connessione persa »
     manderebbe a cercare il problema nel posto sbagliato. */
  if (!sincronizzazioneViva) {
    return (
      <div className="avviso" role="status">
        <b>Sincronizzazione in diretta non attiva.</b> Questo deploy è stato costruito senza{" "}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>: quelle
        due vengono scritte dentro al codice del browser durante la build, quindi impostarle dopo
        non basta. Si salva e si legge lo stesso — la pagina si riallinea ogni quindici secondi —
        ma le modifiche degli altri non compaiono nell’istante in cui le scrivono. Serve un
        Redeploy su Vercel, senza cache di build
        {deploy ? (
          <>
            , sul progetto <code>{deploy}</code>
          </>
        ) : null}
        .
      </div>
    );
  }

  if (connesso) return null;

  return (
    <div className="avviso" role="status">
      <b>Connessione persa.</b> Riconnessione automatica in corso.{" "}
      {inCoda > 0
        ? `${inCoda} ${inCoda === 1 ? "modifica" : "modifiche"} in attesa: ${
            inCoda === 1 ? "verrà inviata" : "verranno inviate"
          } appena la rete torna.`
        : "Puoi continuare a scrivere: nulla va perso."}
    </div>
  );
}
