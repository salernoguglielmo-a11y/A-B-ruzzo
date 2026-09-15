"use client";

import { useState } from "react";

/** Il bottone che popola un database vuoto, sulla pagina di diagnosi. */
export default function Seme() {
  const [stato, setStato] = useState<"fermo" | "corso" | "fatto" | "errore">("fermo");
  const [messaggio, setMessaggio] = useState("");

  const semina = async () => {
    setStato("corso");
    setMessaggio("");
    try {
      const r = await fetch("/api/seed", { method: "POST" });
      const j = (await r.json()) as { errore?: string };
      if (!r.ok) {
        setStato("errore");
        setMessaggio(j.errore ?? "Inserimento non riuscito.");
        return;
      }
      setStato("fatto");
      // Ricaricando, la pagina trova le tabelle piene e mostra il dossier.
      window.location.reload();
    } catch {
      setStato("errore");
      setMessaggio("Il server non ha risposto. Riprova fra un momento.");
    }
  };

  return (
    <p className="semina">
      <button
        type="button"
        className="btn primary"
        disabled={stato === "corso" || stato === "fatto"}
        onClick={() => void semina()}
      >
        {stato === "corso"
          ? "inserimento in corso…"
          : stato === "fatto"
            ? "fatto, apro il dossier…"
            : "Popola il dossier"}
      </button>
      {stato === "errore" && <span className="errore-grezzo">{messaggio}</span>}
    </p>
  );
}
