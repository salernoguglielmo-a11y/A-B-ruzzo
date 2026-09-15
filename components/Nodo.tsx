"use client";

import { STATI, type NodoStatico } from "@/lib/constants";
import { chiaveNodo, chiaveStatoNodo, statoNodo, statoSuccessivo } from "@/lib/keys";
import { daQuando } from "@/lib/tempo";
import Editable from "./collab/Editable";
import { useCollab } from "./collab/CollabProvider";
import Rischio from "./Rischio";
import Sequenza from "./Sequenza";
import TabellaClassi from "./TabellaClassi";

export default function Nodo({ nodo }: { nodo: NodoStatico }) {
  const { flag, scriviFlag } = useCollab();

  const chiave = chiaveStatoNodo(nodo.id);
  const valore = flag(chiave);
  const stato = statoNodo(valore?.value);
  const firma = valore?.updatedBy ? `${valore.updatedBy} · ${daQuando(valore.updatedAt)}` : undefined;

  return (
    <section className="node" id={nodo.id}>
      <div className="node-head">
        <h2>
          <span className="n">{nodo.n}</span>
          <Editable chiave={chiaveNodo(nodo.id, "title")} tag="span" ariaLabel="Titolo del nodo" />
        </h2>
        <button
          type="button"
          className={`status st-${stato}`}
          title={firma}
          onClick={() => scriviFlag([{ key: chiave, value: statoSuccessivo(stato) }])}
        >
          {STATI[stato]}
        </button>
      </div>

      <Editable chiave={chiaveNodo(nodo.id, "body")} tag="div" className="body" />

      {nodo.table && (
        <>
          <TabellaClassi />
          {nodo.hasBody2 && (
            <Editable chiave={chiaveNodo(nodo.id, "body2")} tag="div" className="body" />
          )}
        </>
      )}

      {nodo.seq && <Sequenza />}

      <Rischio id={nodo.id} />

      <div className="note">
        <span className="lab">Decisione e note</span>
        <Editable chiave={chiaveNodo(nodo.id, "note")} tag="div" ariaLabel="Decisione e note" />
      </div>
    </section>
  );
}
