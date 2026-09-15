"use client";

import { useState } from "react";
import { useCollab } from "./CollabProvider";

/**
 * Aprendo il dossier si chiede come chiamarsi. Campo libero: il nome non è un
 * account — non c'è nulla da autenticare — e serve solo alla presenza e a
 * firmare le modifiche.
 */
export default function NomeGate() {
  const { nome, impostaNome } = useCollab();
  const [bozza, setBozza] = useState("");

  if (nome) return null;

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-titolo">
      <form
        className="gate-carta"
        onSubmit={(e) => {
          e.preventDefault();
          impostaNome(bozza);
        }}
      >
        <h2 id="gate-titolo">Come ti chiami?</h2>
        <p>
          Il nome compare accanto alle modifiche e a chi sta scrivendo in un campo. Puoi cambiarlo
          quando vuoi dalla barra in alto.
        </p>
        <input
          autoFocus
          maxLength={40}
          placeholder="Nome e cognome, o solo il nome"
          value={bozza}
          aria-label="Il tuo nome"
          onChange={(e) => setBozza(e.target.value)}
        />
        <button type="submit" className="btn primary" disabled={bozza.trim().length === 0}>
          Entra nel dossier
        </button>
      </form>
    </div>
  );
}
