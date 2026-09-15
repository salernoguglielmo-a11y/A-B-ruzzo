"use client";

import { useCollab } from "./CollabProvider";

/** La striscia che compare quando la connessione cade. */
export default function Avviso() {
  const { connesso, inCoda } = useCollab();
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
