import type { StatoNodo } from "./constants";
import { CICLO } from "./constants";

/* Costruzione delle chiavi. Sono parlanti di proposito: leggendo una riga di
   `fields` si capisce a colpo d'occhio a che punto del dossier appartiene. */

export type ParteNodo = "title" | "body" | "body2" | "note";
export type ParteDomanda = "q" | "a" | "to";

export const chiaveMeta = (parte: "dek" | "lede") => `meta.${parte}`;
export const chiaveNodo = (id: string, parte: ParteNodo) => `nodes.${id}.${parte}`;
export const chiaveStatoNodo = (id: string) => `nodes.${id}.status`;
export const chiaveNotaClasse = (cl: string) => `classes.${cl}.nt`;
export const chiaveSpuntaClasse = (cl: string) => `classes.${cl}.in`;
export const chiaveDomanda = (id: string, parte: ParteDomanda) => `questions.${id}.${parte}`;
export const chiaveRisposta = (id: string) => `questions.${id}.done`;

/* Validazione: le rotte API accettano solo chiavi con questa forma, così un
   client non può scrivere righe arbitrarie nel database. */

const RE_CAMPO =
  /^(meta\.(dek|lede)|nodes\.[a-z0-9]{1,16}\.(title|body|body2|note)|classes\.[0-9]{1,3}\.nt|questions\.[A-Za-z0-9_-]{1,32}\.(q|a|to))$/;

const RE_FLAG_NODO = /^nodes\.[a-z0-9]{1,16}\.status$/;
const RE_FLAG_CLASSE = /^classes\.[0-9]{1,3}\.in$/;
const RE_FLAG_DOMANDA = /^questions\.[A-Za-z0-9_-]{1,32}\.done$/;

export function chiaveCampoValida(key: string): boolean {
  return RE_CAMPO.test(key);
}

/** Valida chiave e valore insieme: ogni famiglia di flag ha il suo dominio. */
export function flagValido(key: string, value: string): boolean {
  if (RE_FLAG_NODO.test(key)) return (CICLO as readonly string[]).includes(value);
  if (RE_FLAG_CLASSE.test(key) || RE_FLAG_DOMANDA.test(key)) {
    return value === "true" || value === "false";
  }
  return false;
}

/** I flag booleani viaggiano come testo: qui si torna al booleano. */
export const acceso = (v: string | undefined) => v === "true";

/** Legge uno stato di nodo difendendosi da un valore fuori dominio. */
export function statoNodo(v: string | undefined): StatoNodo {
  return (CICLO as readonly string[]).includes(v ?? "") ? (v as StatoNodo) : "open";
}

/** Lo stato successivo nel ciclo, per il click sul badge. */
export function statoSuccessivo(v: StatoNodo): StatoNodo {
  const i = CICLO.indexOf(v);
  return CICLO[(i + 1) % CICLO.length] ?? "open";
}
