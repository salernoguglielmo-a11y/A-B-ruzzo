"use client";

import { CLASSI, PERIMETRI } from "@/lib/constants";
import { acceso, chiaveNotaClasse, chiaveSpuntaClasse } from "@/lib/keys";
import { daQuando } from "@/lib/tempo";
import Editable from "./collab/Editable";
import { useCollab } from "./collab/CollabProvider";

export default function TabellaClassi() {
  const { flag, scriviFlag, montato } = useCollab();

  const inclusa = (cl: string) => acceso(flag(chiaveSpuntaClasse(cl))?.value);
  const quante = CLASSI.filter((c) => inclusa(c.cl)).length;

  /* Nessun perimetro viene memorizzato: un bottone risulta premuto quando le
     spunte coincidono esattamente con il suo insieme. Così le spunte messe a
     mano restano quelle che sono e i tre preimpostati continuano a valere. */
  const perimetroAttivo = (lv: number) => CLASSI.every((c) => inclusa(c.cl) === (c.lv <= lv));

  const applicaPerimetro = (lv: number) =>
    scriviFlag(
      CLASSI.map((c) => ({ key: chiaveSpuntaClasse(c.cl), value: String(c.lv <= lv) }))
    );

  const commuta = (cl: string) =>
    scriviFlag([{ key: chiaveSpuntaClasse(cl), value: String(!inclusa(cl)) }]);

  const firma = (cl: string) => {
    if (!montato) return undefined; // l'orologio non combacia fra server e browser
    const v = flag(chiaveSpuntaClasse(cl));
    return v?.updatedBy ? `${v.updatedBy} · ${daQuando(v.updatedAt)}` : undefined;
  };

  return (
    <>
      <div className="scen" role="group" aria-label="Perimetro da rivendicare">
        {PERIMETRI.map(([lv, nome]) => (
          <button
            type="button"
            className="btn"
            key={lv}
            aria-pressed={perimetroAttivo(lv)}
            onClick={() => applicaPerimetro(lv)}
          >
            {nome}
          </button>
        ))}
        <span className="count">
          {quante} {quante === 1 ? "classe" : "classi"}
        </span>
      </div>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>Cl.</th>
              <th>Area</th>
              <th>Ramo del modello</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {CLASSI.map((c) => {
              const on = inclusa(c.cl);
              return (
                <tr className={on ? "on" : "off"} key={c.cl}>
                  <td className="pick">
                    <button
                      type="button"
                      className="tick"
                      aria-label={`Includi la classe ${c.cl}`}
                      aria-pressed={on}
                      title={firma(c.cl)}
                      onClick={() => commuta(c.cl)}
                    >
                      ✓
                    </button>
                  </td>
                  <td className="cl">{c.cl}</td>
                  <td className="area">{c.area}</td>
                  <td>{c.ramo}</td>
                  <td className="nt">
                    <Editable chiave={chiaveNotaClasse(c.cl)} tag="span" />
                    {c.flag === "add" && <span className="flag f-add">aggiunta</span>}
                    {c.flag === "fix" && <span className="flag f-fix">correzione</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="legend">
        <span>
          <b>Nucleo</b> — il minimo senza cui il deposito non ha senso
        </span>
        <span>
          <b>Coerente</b> — i rami già confermati da Vittoria
        </span>
        <span>
          <b>Esteso</b> — solo dove l’uso è credibile entro cinque anni
        </span>
      </div>
    </>
  );
}
