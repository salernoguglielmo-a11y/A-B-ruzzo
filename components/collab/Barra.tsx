"use client";

import { useState } from "react";
import { useCollab } from "./CollabProvider";

function iniziali(nome: string): string {
  const parti = nome.trim().split(/\s+/).filter(Boolean);
  const prima = parti[0]?.[0] ?? "?";
  const seconda = parti.length > 1 ? (parti[parti.length - 1]?.[0] ?? "") : "";
  return (prima + seconda).toUpperCase();
}

/** Da un nome a un colore stabile, così ognuno tiene il suo per tutta la sessione. */
function tinta(nome: string): number {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) % 360;
  return h;
}

export default function Barra() {
  const { nome, impostaNome, presenze, connesso, inCoda, statoSalvataggio, clientId } = useCollab();
  const [rinomina, setRinomina] = useState(false);
  const [bozza, setBozza] = useState("");

  const stato = (() => {
    // Fuori rete si dice tutte e due le cose: che manca la connessione e che
    // niente è andato perso.
    if (!connesso) {
      return {
        classe: "err",
        testo: inCoda > 0 ? `non connesso · ${inCoda} in coda` : "non connesso",
      };
    }
    if (inCoda > 0) {
      return { classe: "dirty", testo: `${inCoda} in coda` };
    }
    if (statoSalvataggio === "salvataggio") return { classe: "dirty", testo: "salvataggio…" };
    if (statoSalvataggio === "salvato") return { classe: "done", testo: "salvato" };
    return { classe: "", testo: "sincronizzato" };
  })();

  return (
    <div className="bar">
      <span className="mark">Dossier ab[B]ruzzo &middot; documento di lavoro</span>

      <div className="presenze" aria-label="Chi è collegato">
        {presenze.length === 0 && <span className="hint">solo tu</span>}
        {presenze.map((p) => (
          <span
            key={p.clientId}
            className={`chi${p.clientId === clientId ? " io" : ""}`}
            title={p.clientId === clientId ? `${p.nome} (tu)` : p.nome}
            style={{ ["--tinta" as string]: `${tinta(p.nome)}` }}
          >
            <i aria-hidden="true">{iniziali(p.nome)}</i>
            <b>{p.nome}</b>
          </span>
        ))}
      </div>

      <span className={`savest ${stato.classe}`}>{stato.testo}</span>

      {rinomina ? (
        <form
          className="rinomina"
          onSubmit={(e) => {
            e.preventDefault();
            impostaNome(bozza);
            setRinomina(false);
          }}
        >
          <input
            autoFocus
            maxLength={40}
            value={bozza}
            aria-label="Il tuo nome"
            onChange={(e) => setBozza(e.target.value)}
            /* Uscendo dal campo si tiene quello che c'è scritto: chiudere
               scartando renderebbe impossibile premere « ok », perché il blur
               smonterebbe il modulo prima che il click arrivi. */
            onBlur={() => {
              impostaNome(bozza);
              setRinomina(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setBozza(nome);
                setRinomina(false);
              }
            }}
          />
          <button type="submit" className="btn primary">
            ok
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="btn"
          onClick={() => {
            setBozza(nome);
            setRinomina(true);
          }}
        >
          {nome ? "cambia nome" : "il tuo nome"}
        </button>
      )}

      <button
        type="button"
        className="btn esci"
        title="Chiude la sessione su questo dispositivo"
        onClick={() => {
          void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
            window.location.href = "/login";
          });
        }}
      >
        esci
      </button>
    </div>
  );
}
