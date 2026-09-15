"use client";

import { acceso, chiaveDomanda, chiaveRisposta } from "@/lib/keys";
import Editable from "./collab/Editable";
import { useCollab } from "./collab/CollabProvider";

export default function Domande() {
  const { domande, flag, scriviFlag, aggiungiDomanda, cancellaDomanda, spostaDomanda } =
    useCollab();

  return (
    <>
      <div className="qs">
        {domande.map((d, i) => {
          const chiusa = acceso(flag(chiaveRisposta(d.id))?.value);
          const numero = i + 1 < 10 ? `0${i + 1}` : String(i + 1);
          return (
            <div className={`q${chiusa ? " done" : ""}`} key={d.id}>
              <button
                type="button"
                className="qn"
                aria-pressed={chiusa}
                aria-label="Segna come risposta ottenuta"
                onClick={() =>
                  scriviFlag([{ key: chiaveRisposta(d.id), value: String(!chiusa) }])
                }
              >
                {chiusa ? "✓" : numero}
              </button>

              <span>
                <Editable chiave={chiaveDomanda(d.id, "q")} tag="span" className="qtext" />
                <Editable chiave={chiaveDomanda(d.id, "a")} tag="span" className="ans" />
              </span>

              <span className="to">
                <Editable chiave={chiaveDomanda(d.id, "to")} tag="span" />
                <span className="qctl">
                  <button
                    type="button"
                    aria-label="Sposta la domanda più in alto"
                    disabled={i === 0}
                    onClick={() => spostaDomanda(d.id, "su")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Sposta la domanda più in basso"
                    disabled={i === domande.length - 1}
                    onClick={() => spostaDomanda(d.id, "giu")}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="Cancella la domanda"
                    onClick={() => {
                      if (window.confirm("Cancellare questa domanda per tutti?")) {
                        cancellaDomanda(d.id);
                      }
                    }}
                  >
                    ×
                  </button>
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn" onClick={aggiungiDomanda}>
          + domanda
        </button>
      </div>
    </>
  );
}
