"use client";

import { useEffect } from "react";

/*
 * Senza questo file, un errore lanciato da un componente client lascia una
 * pagina bianca e « Application error: a client-side exception has occurred ».
 * Che è, per chi guarda, indistinguibile da un sito rotto e senza rimedio.
 */
export default function Errore({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="wrap">
      <div className="diagnosi">
        <h1>Il dossier si è fermato</h1>
        <p>
          Qualcosa è andato storto nel browser. Il testo già salvato è al sicuro nel database: si
          perde soltanto quello scritto negli ultimi istanti, se non aveva ancora fatto in tempo a
          partire.
        </p>
        <p className="errore-grezzo">{error.message || "Errore sconosciuto."}</p>
        {error.digest && <p className="minuta">Riferimento: {error.digest}</p>}
        <p className="semina">
          <button type="button" className="btn primary" onClick={reset}>
            Riprova
          </button>{" "}
          <button
            type="button"
            className="btn"
            onClick={() => window.location.reload()}
          >
            Ricarica la pagina
          </button>
        </p>
      </div>
    </div>
  );
}
