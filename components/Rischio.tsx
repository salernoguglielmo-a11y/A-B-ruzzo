"use client";

import { RISK } from "@/lib/constants";

/** La griglia delle tre metriche di rischio: costante, non si modifica. */
export default function Rischio({ id }: { id: string }) {
  const metriche = RISK[id];
  if (!metriche) return null;

  return (
    <div className="risk">
      <div className="risk-grid">
        {metriche.map((m) => (
          <div className={`metric ${m[0]}`} key={m[1]}>
            <span className="lab">{m[1]}</span>
            <div className="barcells">
              {[1, 2, 3].map((i) => (
                <i className={`cell${i <= m[2] ? " on" : ""}`} key={i} />
              ))}
            </div>
            <span className="val">{m[3]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
