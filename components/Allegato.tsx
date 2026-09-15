"use client";

import { ALLEGATO_HREF, ALLEGATO_NOME, ATT } from "@/lib/constants";

/**
 * Il business model ricevuto. Il testo è fisso; il file originale si scarica
 * con un link normale, servito da /public e protetto dal middleware come tutto
 * il resto.
 */
export default function Allegato() {
  return (
    <section className="att" id="all">
      <div className="att-head">
        <div>
          <h2>Allegato A — Business model ricevuto</h2>
          <div className="att-meta">
            {ALLEGATO_NOME} &middot; documento della committente &middot; testo non modificabile
          </div>
        </div>
      </div>

      <div className="doc" dangerouslySetInnerHTML={{ __html: ATT }} />

      <div className="dlrow">
        <a className="btn" href={ALLEGATO_HREF} download={ALLEGATO_NOME}>
          Scarica il .docx originale
        </a>
        <span className="dlnote">Il file come è stato ricevuto, senza modifiche.</span>
      </div>
    </section>
  );
}
