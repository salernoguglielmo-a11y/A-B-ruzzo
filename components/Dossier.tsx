"use client";

import { NODI } from "@/lib/constants";
import { chiaveMeta, chiaveNodo } from "@/lib/keys";
import type { Snapshot } from "@/lib/types";
import Allegato from "./Allegato";
import Domande from "./Domande";
import Nodo from "./Nodo";
import Avviso from "./collab/Avviso";
import Barra from "./collab/Barra";
import CollabProvider, { useCollab } from "./collab/CollabProvider";
import Editable from "./collab/Editable";
import NomeGate from "./collab/NomeGate";

/** L'indice laterale: i titoli sono quelli scritti nei nodi, aggiornati in diretta. */
function Indice() {
  const { campo } = useCollab();
  return (
    <nav className="rail" aria-label="Indice">
      <div className="rail-title">I nodi</div>
      {NODI.map((n) => (
        <a href={`#${n.id}`} key={n.id}>
          <span className="n">{n.n}</span>{" "}
          <span
            dangerouslySetInnerHTML={{ __html: campo(chiaveNodo(n.id, "title"))?.value ?? "" }}
          />
        </a>
      ))}
      <a href="#dom">
        <span className="n">&mdash;</span> A Vittoria
      </a>
      <a href="#all">
        <span className="n">A</span> Allegato
      </a>
    </nav>
  );
}

function Contenuto() {
  return (
    <>
      <header className="head">
        <div className="eyebrow">
          <span>Documento di lavoro</span>
          <span>Deposito marchio &middot; UIBM</span>
          <span>settembre 2026</span>
        </div>
        <h1>
          ab<span className="br">[B]</span>ruzzo
        </h1>
        <Editable chiave={chiaveMeta("dek")} tag="p" className="dek" />
        <Editable chiave={chiaveMeta("lede")} tag="p" className="lede" />
      </header>

      <div className="grid">
        <Indice />
        <main>
          {NODI.map((n) => (
            <Nodo nodo={n} key={n.id} />
          ))}

          <section className="node" id="dom">
            <div className="node-head">
              <h2>Le domande a Vittoria</h2>
            </div>
            <p className="body">
              Senza queste, il parere sulle classi resta un’ipotesi. Il numero segna la domanda come
              chiusa; sotto ciascuna si annota la risposta.
            </p>
            <Domande />
          </section>

          <Allegato />

          <footer>
            Nel documento ricevuto manca il paragrafo 9, si passa dall’8 al 10; il testo cita
            nominativamente il professionista incaricato; non recano data, autore né versione. Questo
            dossier è una base di lavoro interna: le voci di prodotti e servizi vanno formulate in
            sede di deposito.
          </footer>
        </main>
      </div>
    </>
  );
}

export default function Dossier({ iniziale }: { iniziale: Snapshot }) {
  return (
    <CollabProvider iniziale={iniziale}>
      <div className="wrap">
        <Barra />
        <Avviso />
        <Contenuto />
      </div>
      <NomeGate />
    </CollabProvider>
  );
}
