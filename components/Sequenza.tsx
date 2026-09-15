"use client";

import { SEQ } from "@/lib/constants";

/** I cinque passi del nodo 07: costanti, non si modificano. */
export default function Sequenza() {
  return (
    <div className="seq">
      {SEQ.map(([titolo, dettaglio], i) => (
        <div className="step" key={titolo}>
          <span className="dot">{i + 1}</span>
          <span className="txt">
            <b>{titolo}</b>
            <span>{dettaglio}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
