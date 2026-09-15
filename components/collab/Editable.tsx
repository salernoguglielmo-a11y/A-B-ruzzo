"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { FINESTRA_TOCCO, useCollab } from "./CollabProvider";
import { daQuando } from "@/lib/tempo";

const DEBOUNCE = 800;

type Props = {
  /** La chiave in `fields`, per esempio `nodes.n1.body`. */
  chiave: string;
  tag?: "p" | "div" | "span";
  className?: string;
  ariaLabel?: string;
};

/**
 * Un campo modificabile del dossier.
 *
 * Il contenuto non è controllato da React: il primo render lo stampa e da lì
 * in poi il DOM è di chi scrive. Gli aggiornamenti che arrivano dagli altri si
 * applicano solo quando il campo non ha il cursore dentro, così nessuna
 * battuta viene mangiata a metà frase.
 *
 * Il tempo relativo nell'etichetta si riscrive da solo: il battito del
 * provider fa ridisegnare tutti i campi ogni cinque secondi.
 */
export default function Editable({ chiave, tag = "div", className, ariaLabel }: Props) {
  const {
    campo,
    scriviCampo,
    lockAltrui,
    prendiLock,
    rinnovaLock,
    rilasciaLock,
    montato,
  } = useCollab();

  const elemento = useRef<HTMLElement | null>(null);
  const attivo = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const valore = campo(chiave);
  const [iniziale] = useState(() => valore?.value ?? "");
  const ultimoSalvato = useRef(iniziale);

  /* Il campo è bloccato quando la prenotazione è di qualcun altro, e per tutto
     il tempo in cui lo è: la sola prenotazione basta a dirlo.

     Prima c'era anche un `negato`, alzato quando il server rifiutava il lock.
     Ma non si abbassava più: `contentEditable` a false rende l'elemento non
     focalizzabile, quindi `onFocus` — l'unico punto che lo azzerava — non
     sarebbe mai più scattato. Un campo negato una volta restava di sasso fino
     al ricaricamento della pagina, anche molto dopo che l'altro se n'era
     andato. E non serviva a niente: `prendiLock` registra la prenotazione di
     chi ha vinto prima di restituire il rifiuto, quindi il blocco si vede già
     da `lock`, e scade con lui. */
  const lock = lockAltrui(chiave);
  const bloccato = lock !== null;

  const salva = useCallback(() => {
    const el = elemento.current;
    if (!el) return;
    const html = el.innerHTML;
    if (html === ultimoSalvato.current) return;
    ultimoSalvato.current = html;
    scriviCampo(chiave, html);
  }, [chiave, scriviCampo]);

  /* Aggiornamenti remoti: mai mentre il campo è in uso. */
  useEffect(() => {
    const el = elemento.current;
    if (!el || attivo.current) return;
    const v = valore?.value ?? "";
    if (el.innerHTML !== v) el.innerHTML = v;
    ultimoSalvato.current = v;
  }, [valore?.value]);

  /* Uscendo dalla pagina il testo in sospeso va salvato e il campo liberato. */
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (attivo.current) {
        salva();
        rilasciaLock(chiave);
      }
    };
  }, [chiave, salva, rilasciaLock]);

  const suInput = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(salva, DEBOUNCE);
    rinnovaLock(chiave);
  }, [chiave, salva, rinnovaLock]);

  const suFocus = useCallback(() => {
    attivo.current = true;
    void prendiLock(chiave).then((concesso) => {
      if (concesso) return;
      // Qualcun altro è arrivato un istante prima: si esce dal campo. La
      // prenotazione altrui è già stata registrata, quindi al render seguente
      // il campo risulta bloccato da sé.
      attivo.current = false;
      elemento.current?.blur();
    });
  }, [chiave, prendiLock]);

  const suBlur = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    salva();
    attivo.current = false;
    rilasciaLock(chiave);
  }, [chiave, salva, rilasciaLock]);

  /* L'etichetta: chi lo sta occupando, oppure chi lo ha toccato per ultimo. */
  let nota: string | undefined;
  if (lock) {
    nota = `${lock.holder} sta scrivendo`;
  } else if (montato && valore?.updatedBy) {
    // Solo dopo il montaggio: sul server « adesso » è un altro istante, e la
    // differenza farebbe fallire l'idratazione.
    const quando = Date.now() - new Date(valore.updatedAt).getTime();
    if (quando < FINESTRA_TOCCO) nota = `${valore.updatedBy} · ${daQuando(valore.updatedAt)}`;
  }

  const classi = [className, bloccato ? "campo-lock" : "", nota ? "ha-nota" : ""]
    .filter(Boolean)
    .join(" ");

  return createElement(tag, {
    ref: elemento,
    className: classi || undefined,
    contentEditable: !bloccato,
    suppressContentEditableWarning: true,
    "data-p": chiave,
    "data-nota": nota,
    "aria-label": ariaLabel,
    "aria-readonly": bloccato ? true : undefined,
    onInput: suInput,
    onFocus: suFocus,
    onBlur: suBlur,
    dangerouslySetInnerHTML: { __html: iniziale },
  } as React.HTMLAttributes<HTMLElement> & { ref: React.RefObject<HTMLElement | null> });
}
