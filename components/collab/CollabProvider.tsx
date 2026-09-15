"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { Domanda, Lock, Presenza, RigaValore, Snapshot, Valore } from "@/lib/types";

/* Durata della prenotazione di un campo, in millisecondi, e ogni quanto la si
   rinnova mentre si scrive. Il rinnovo è ben dentro la scadenza, così un
   pacchetto perso non fa cadere il lock sotto le dita di chi sta scrivendo. */
const TTL_LOCK = 30_000;
const PERIODO_RINNOVO = 12_000;

/** Per quanto tempo un campo mostra chi lo ha toccato per ultimo. */
export const FINESTRA_TOCCO = 15 * 60 * 1000;

const CHIAVE_NOME = "dossier-abbruzzo:nome";

export type StatoSalvataggio = "fermo" | "salvataggio" | "salvato" | "coda";

type Operazione =
  | { tipo: "campo"; key: string; value: string }
  | { tipo: "flag"; key: string; value: string };

type Contesto = {
  nome: string;
  impostaNome: (n: string) => void;
  clientId: string;

  campo: (key: string) => Valore | undefined;
  flag: (key: string) => Valore | undefined;
  domande: Domanda[];

  scriviCampo: (key: string, value: string) => void;
  scriviFlag: (aggiornamenti: { key: string; value: string }[]) => void;
  aggiungiDomanda: () => void;
  cancellaDomanda: (id: string) => void;
  spostaDomanda: (id: string, direzione: "su" | "giu") => void;

  /** Il lock su quel campo, se è di qualcun altro ed è ancora vivo. */
  lockAltrui: (key: string) => Lock | null;
  prendiLock: (key: string) => Promise<boolean>;
  rinnovaLock: (key: string) => void;
  rilasciaLock: (key: string) => void;

  presenze: Presenza[];
  connesso: boolean;
  inCoda: number;
  statoSalvataggio: StatoSalvataggio;
  /** Cambia ogni cinque secondi: serve a ridisegnare i tempi relativi. */
  battito: number;
};

const Ctx = createContext<Contesto | null>(null);

export function useCollab(): Contesto {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCollab va usato dentro <CollabProvider>.");
  return c;
}

function indicizzaLock(elenco: Lock[]): Record<string, Lock> {
  const out: Record<string, Lock> = {};
  for (const l of elenco) out[l.field_key] = l;
  return out;
}

function nuovoClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function valoreDa(r: RigaValore): Valore {
  return { value: r.value, updatedAt: r.updated_at, updatedBy: r.updated_by };
}

export default function CollabProvider({
  iniziale,
  children,
}: {
  iniziale: Snapshot;
  children: React.ReactNode;
}) {
  const [campi, setCampi] = useState<Record<string, Valore>>(iniziale.fields);
  const [flag, setFlag] = useState<Record<string, Valore>>(iniziale.flags);
  const [domande, setDomande] = useState<Domanda[]>(iniziale.questions);
  const [lock, setLock] = useState<Record<string, Lock>>(() => indicizzaLock(iniziale.locks));
  const [presenze, setPresenze] = useState<Presenza[]>([]);
  /* Due segnali distinti: il canale Realtime agganciato, e la rete del
     browser. Basta che uno dei due cada perché l'avviso compaia subito,
     senza aspettare che scatti il battito del websocket. */
  const [canaleAgganciato, setCanaleAgganciato] = useState(false);
  const [reteViva, setReteViva] = useState(true);
  const connesso = canaleAgganciato && reteViva;
  const [inCoda, setInCoda] = useState(0);
  const [statoSalvataggio, setStatoSalvataggio] = useState<StatoSalvataggio>("fermo");
  const [battito, setBattito] = useState(0);
  const [nome, setNome] = useState("");

  const [clientId] = useState(nuovoClientId);
  const nomeRef = useRef("");
  const canale = useRef<RealtimeChannel | null>(null);

  /* ------------------------------ il nome ------------------------------- */

  useEffect(() => {
    try {
      const salvato = window.localStorage.getItem(CHIAVE_NOME);
      if (salvato) {
        setNome(salvato);
        nomeRef.current = salvato;
      }
    } catch {
      // localStorage negato: si resta senza nome e il gate lo richiede.
    }
  }, []);

  const impostaNome = useCallback((n: string) => {
    const pulito = n.trim().slice(0, 40);
    if (!pulito) return;
    setNome(pulito);
    nomeRef.current = pulito;
    try {
      window.localStorage.setItem(CHIAVE_NOME, pulito);
    } catch {
      // niente da fare: il nome resterà solo per questa sessione.
    }
  }, []);

  /* ----------------------------- la coda -------------------------------- */
  /* Le operazioni non ancora confermate dal server stanno qui. La chiave della
     mappa contiene il campo, così due modifiche allo stesso punto collassano
     in una sola invece di accumularsi. */

  const coda = useRef<Map<string, Operazione>>(new Map());
  const inInvio = useRef(false);
  const attesa = useRef(1000);
  const timerRitentativo = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Sessione caduta (cookie scaduto, o SESSION_SECRET cambiato sul server).
     Si esce con una navigazione piena, mai con `router.replace`.

     Una navigazione morbida qui fa tre danni insieme: i timer della coda
     restano vivi e ogni ritentativo prende un altro 401 che chiama di nuovo
     l'uscita, la pagina rimbalza fra dossier e login, e React riusa i nodi del
     DOM fra le due schermate — così il testo appena digitato in una nota
     finisce dentro il campo della password. Ricaricando davvero, invece, tutto
     muore e si riparte puliti.

     Il ref fa sì che accada una volta sola, anche se i 401 arrivano a raffica. */
  const uscitaAvviata = useRef(false);
  const esciPerSessioneScaduta = useCallback(() => {
    if (uscitaAvviata.current) return;
    uscitaAvviata.current = true;
    if (timerRitentativo.current) {
      clearTimeout(timerRitentativo.current);
      timerRitentativo.current = null;
    }
    coda.current.clear();
    // Qui la regola di Next va disattivata apposta: `useRouter().push` farebbe
    // una navigazione morbida, che è esattamente ciò che rompe questo caso.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }, []);

  const inviaCampo = useCallback(
    async (op: Extract<Operazione, { tipo: "campo" }>): Promise<boolean> => {
      const r = await fetch("/api/fields", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: op.key,
          value: op.value,
          autore: nomeRef.current,
          clientId,
        }),
      });
      if (r.status === 401) {
        esciPerSessioneScaduta();
        return true;
      }
      // 400 e 409 non migliorano ritentando: la modifica si scarta.
      if (r.status === 400 || r.status === 409 || r.status === 413) return true;
      return r.ok;
    },
    [clientId, esciPerSessioneScaduta]
  );

  const inviaFlag = useCallback(
    async (ops: Extract<Operazione, { tipo: "flag" }>[]): Promise<boolean> => {
      const r = await fetch("/api/flags", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          updates: ops.map((o) => ({ key: o.key, value: o.value })),
          autore: nomeRef.current,
        }),
      });
      if (r.status === 401) {
        esciPerSessioneScaduta();
        return true;
      }
      if (r.status === 400) return true;
      return r.ok;
    },
    [esciPerSessioneScaduta]
  );

  const svuota = useCallback(async () => {
    if (inInvio.current || coda.current.size === 0) return;
    inInvio.current = true;
    setStatoSalvataggio("salvataggio");

    try {
      for (const [k, op] of Array.from(coda.current.entries())) {
        if (op.tipo !== "campo") continue;
        let riuscito = false;
        try {
          riuscito = await inviaCampo(op);
        } catch {
          riuscito = false;
        }
        if (!riuscito) break;
        // La modifica potrebbe essere stata sovrascritta mentre era in volo.
        if (coda.current.get(k) === op) coda.current.delete(k);
      }

      const flagInCoda = Array.from(coda.current.entries()).filter(
        (e): e is [string, Extract<Operazione, { tipo: "flag" }>] => e[1].tipo === "flag"
      );
      if (flagInCoda.length > 0) {
        let riuscito = false;
        try {
          riuscito = await inviaFlag(flagInCoda.map(([, o]) => o));
        } catch {
          riuscito = false;
        }
        if (riuscito) {
          for (const [k, o] of flagInCoda) if (coda.current.get(k) === o) coda.current.delete(k);
        }
      }
    } finally {
      inInvio.current = false;
      const rimaste = coda.current.size;
      setInCoda(rimaste);

      if (rimaste > 0) {
        setStatoSalvataggio("coda");
        const fra = attesa.current;
        attesa.current = Math.min(fra * 2, 15_000);
        if (timerRitentativo.current) clearTimeout(timerRitentativo.current);
        timerRitentativo.current = setTimeout(() => {
          void svuotaRef.current();
        }, fra);
      } else {
        attesa.current = 1000;
        setStatoSalvataggio("salvato");
      }
    }
  }, [inviaCampo, inviaFlag]);

  // La coda si richiama da sola dopo un errore: il ref evita il riferimento
  // circolare fra la funzione e la sua stessa definizione.
  const svuotaRef = useRef(svuota);
  useEffect(() => {
    svuotaRef.current = svuota;
  }, [svuota]);

  const accoda = useCallback((op: Operazione) => {
    coda.current.set(`${op.tipo}:${op.key}`, op);
    setInCoda(coda.current.size);
    attesa.current = 1000;
    if (timerRitentativo.current) {
      clearTimeout(timerRitentativo.current);
      timerRitentativo.current = null;
    }
    void svuotaRef.current();
  }, []);

  /* --------------------------- le scritture ----------------------------- */

  const scriviCampo = useCallback(
    (key: string, value: string) => {
      setCampi((c) => ({
        ...c,
        [key]: { value, updatedAt: new Date().toISOString(), updatedBy: nomeRef.current || null },
      }));
      accoda({ tipo: "campo", key, value });
    },
    [accoda]
  );

  const scriviFlag = useCallback(
    (aggiornamenti: { key: string; value: string }[]) => {
      const adesso = new Date().toISOString();
      setFlag((f) => {
        const n = { ...f };
        for (const a of aggiornamenti) {
          n[a.key] = { value: a.value, updatedAt: adesso, updatedBy: nomeRef.current || null };
        }
        return n;
      });
      for (const a of aggiornamenti) accoda({ tipo: "flag", key: a.key, value: a.value });
    },
    [accoda]
  );

  /* ---------------------------- le domande ------------------------------ */
  /* Aggiunta, cancellazione e riordino non passano dalla coda: sono azioni
     esplicite e rare, e un fallimento va detto subito invece che ritentato. */

  const aggiungiDomanda = useCallback(() => {
    void fetch("/api/questions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ autore: nomeRef.current }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { domanda?: Domanda } | null) => {
        if (j?.domanda) {
          setDomande((d) =>
            d.some((x) => x.id === j.domanda!.id)
              ? d
              : [...d, j.domanda!].sort((a, b) => a.position - b.position)
          );
        }
      })
      .catch(() => undefined);
  }, []);

  const cancellaDomanda = useCallback((id: string) => {
    setDomande((d) => d.filter((x) => x.id !== id));
    void fetch(`/api/questions?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(
      () => undefined
    );
  }, []);

  const spostaDomanda = useCallback((id: string, direzione: "su" | "giu") => {
    setDomande((d) => {
      const i = d.findIndex((x) => x.id === id);
      const j = direzione === "su" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= d.length) return d;
      const n = [...d];
      const a = n[i];
      const b = n[j];
      if (!a || !b) return d;
      n[i] = { ...b, position: a.position };
      n[j] = { ...a, position: b.position };
      return n.sort((x, y) => x.position - y.position);
    });
    void fetch("/api/questions", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, direzione, autore: nomeRef.current }),
    }).catch(() => undefined);
  }, []);

  /* ------------------------------ i lock -------------------------------- */

  const ultimoRinnovo = useRef<Map<string, number>>(new Map());
  const mieiLock = useRef<Set<string>>(new Set());

  const registraLock = useCallback((l: Lock | null) => {
    if (!l) return;
    setLock((m) => ({ ...m, [l.field_key]: l }));
  }, []);

  const prendiLock = useCallback(
    async (key: string): Promise<boolean> => {
      ultimoRinnovo.current.set(key, Date.now());
      try {
        const r = await fetch("/api/locks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ azione: "prendi", key, autore: nomeRef.current, clientId }),
        });
        if (r.status === 401) {
          esciPerSessioneScaduta();
          return false;
        }
        if (!r.ok) return true; // problema del server: non si blocca chi scrive
        const j = (await r.json()) as { granted: boolean; lock: Lock | null };
        registraLock(j.lock);
        if (j.granted) mieiLock.current.add(key);
        return j.granted;
      } catch {
        // Offline: si continua a scrivere e le modifiche restano in coda.
        return true;
      }
    },
    [clientId, registraLock, esciPerSessioneScaduta]
  );

  const rinnovaLock = useCallback(
    (key: string) => {
      const ultimo = ultimoRinnovo.current.get(key) ?? 0;
      if (Date.now() - ultimo < PERIODO_RINNOVO) return;
      ultimoRinnovo.current.set(key, Date.now());
      void fetch("/api/locks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ azione: "prendi", key, autore: nomeRef.current, clientId }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { lock: Lock | null } | null) => registraLock(j?.lock ?? null))
        .catch(() => undefined);
    },
    [clientId, registraLock]
  );

  const rilasciaLock = useCallback(
    (key: string) => {
      ultimoRinnovo.current.delete(key);
      mieiLock.current.delete(key);
      setLock((m) => {
        if (!(key in m)) return m;
        const n = { ...m };
        delete n[key];
        return n;
      });
      void fetch("/api/locks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ azione: "rilascia", key, clientId }),
      }).catch(() => undefined);
    },
    [clientId]
  );

  const lockAltrui = useCallback(
    (key: string): Lock | null => {
      const l = lock[key];
      if (!l) return null;
      if (l.client_id === clientId) return null;
      if (new Date(l.expires_at).getTime() <= Date.now()) return null;
      return l;
    },
    [lock, clientId]
  );

  /* Chiudendo la scheda il lock si rilascia subito, senza aspettare i trenta
     secondi di scadenza. sendBeacon sopravvive alla pagina che muore. */
  useEffect(() => {
    const addio = () => {
      for (const key of mieiLock.current) {
        try {
          navigator.sendBeacon(
            "/api/locks",
            new Blob([JSON.stringify({ azione: "rilascia", key, clientId })], {
              type: "application/json",
            })
          );
        } catch {
          // la scadenza a trenta secondi fa comunque il suo lavoro
        }
      }
    };
    window.addEventListener("beforeunload", addio);
    return () => {
      window.removeEventListener("beforeunload", addio);
      addio();
    };
  }, [clientId]);

  /* Smontando il provider il ritentativo va fermato: altrimenti continuerebbe
     a bussare al server da una pagina che non esiste più. */
  useEffect(() => {
    return () => {
      if (timerRitentativo.current) {
        clearTimeout(timerRitentativo.current);
        timerRitentativo.current = null;
      }
    };
  }, []);

  /* ------------------------- battito e scadenze ------------------------- */

  useEffect(() => {
    const id = setInterval(() => setBattito((b) => b + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // I lock scaduti vanno tolti anche se nessuno ha inviato la cancellazione,
  // per esempio quando un browser è stato chiuso di colpo.
  useEffect(() => {
    setLock((m) => {
      const ora = Date.now();
      let cambiato = false;
      const n: Record<string, Lock> = {};
      for (const [k, v] of Object.entries(m)) {
        if (new Date(v.expires_at).getTime() > ora) n[k] = v;
        else cambiato = true;
      }
      return cambiato ? n : m;
    });
  }, [battito]);

  /* --------------------------- riallineamento --------------------------- */

  const riallinea = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (!r.ok) return;
      const s = (await r.json()) as Snapshot;
      setCampi(s.fields);
      setFlag(s.flags);
      setDomande(s.questions);
      setLock(indicizzaLock(s.locks));
    } catch {
      // si riproverà alla prossima riconnessione
    }
  }, []);

  const riallineaRef = useRef(riallinea);
  useEffect(() => {
    riallineaRef.current = riallinea;
  }, [riallinea]);

  /* ----------------------------- Realtime ------------------------------- */

  useEffect(() => {
    const sb = supabaseBrowser();
    const ch = sb.channel("dossier", { config: { presence: { key: clientId } } });

    const suValore =
      (applica: React.Dispatch<React.SetStateAction<Record<string, Valore>>>) =>
      (p: RealtimePostgresChangesPayload<RigaValore>) => {
        if (p.eventType === "DELETE") {
          const vecchia = p.old as Partial<RigaValore>;
          if (!vecchia.key) return;
          applica((m) => {
            if (!(vecchia.key! in m)) return m;
            const n = { ...m };
            delete n[vecchia.key!];
            return n;
          });
          return;
        }
        const riga = p.new as RigaValore;
        if (!riga?.key) return;
        applica((m) => ({ ...m, [riga.key]: valoreDa(riga) }));
      };

    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "fields" },
      suValore(setCampi) as (p: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
    )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flags" },
        suValore(setFlag) as (p: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, (p) => {
        if (p.eventType === "DELETE") {
          const vecchia = p.old as { id?: string };
          if (!vecchia.id) return;
          setDomande((d) => d.filter((x) => x.id !== vecchia.id));
          return;
        }
        const riga = p.new as unknown as Domanda;
        if (!riga?.id) return;
        setDomande((d) =>
          [...d.filter((x) => x.id !== riga.id), { id: riga.id, position: riga.position }].sort(
            (a, b) => a.position - b.position
          )
        );
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "locks" }, (p) => {
        if (p.eventType === "DELETE") {
          const vecchio = p.old as { field_key?: string };
          if (!vecchio.field_key) return;
          setLock((m) => {
            if (!(vecchio.field_key! in m)) return m;
            const n = { ...m };
            delete n[vecchio.field_key!];
            return n;
          });
          return;
        }
        const riga = p.new as unknown as Lock;
        if (!riga?.field_key) return;
        setLock((m) => ({ ...m, [riga.field_key]: riga }));
      })
      .on("presence", { event: "sync" }, () => {
        const stato = ch.presenceState<{ nome?: string; clientId?: string }>();
        const visti = new Map<string, Presenza>();
        for (const entrate of Object.values(stato)) {
          for (const e of entrate) {
            const id = e.clientId ?? "";
            if (!id) continue;
            visti.set(id, { clientId: id, nome: e.nome?.trim() || "senza nome" });
          }
        }
        setPresenze(Array.from(visti.values()).sort((a, b) => a.nome.localeCompare(b.nome, "it")));
      })
      .subscribe((stato) => {
        if (stato === "SUBSCRIBED") {
          setCanaleAgganciato(true);
          // Ci si annuncia solo avendo un nome: altrimenti gli altri vedrebbero
          // comparire « senza nome » per l'istante che separa la password dalla
          // risposta al gate. Ci pensa l'effetto qui sotto, appena arriva.
          if (nomeRef.current) void ch.track({ nome: nomeRef.current, clientId });
          void riallineaRef.current();
          void svuotaRef.current();
        } else {
          setCanaleAgganciato(false);
        }
      });

    canale.current = ch;
    return () => {
      canale.current = null;
      void sb.removeChannel(ch);
    };
  }, [clientId]);

  // Il nome cambia anche a sessione avviata: la presenza va riannunciata.
  useEffect(() => {
    if (connesso && nome && canale.current) {
      void canale.current.track({ nome, clientId });
    }
  }, [nome, connesso, clientId]);

  /* La rete del browser. `online` non aspetta il timeout del websocket, così
     l'avviso compare e sparisce nel momento giusto; al ritorno si riprova
     subito invece di aspettare il backoff della coda. */
  useEffect(() => {
    setReteViva(navigator.onLine);

    const suOnline = () => {
      setReteViva(true);
      void svuotaRef.current();
      void riallineaRef.current();
    };
    const suOffline = () => setReteViva(false);

    window.addEventListener("online", suOnline);
    window.addEventListener("offline", suOffline);
    return () => {
      window.removeEventListener("online", suOnline);
      window.removeEventListener("offline", suOffline);
    };
  }, []);

  /* ------------------------------ contesto ------------------------------ */

  const campo = useCallback((key: string) => campi[key], [campi]);
  const leggiFlag = useCallback((key: string) => flag[key], [flag]);

  const valore = useMemo<Contesto>(
    () => ({
      nome,
      impostaNome,
      clientId,
      campo,
      flag: leggiFlag,
      domande,
      scriviCampo,
      scriviFlag,
      aggiungiDomanda,
      cancellaDomanda,
      spostaDomanda,
      lockAltrui,
      prendiLock,
      rinnovaLock,
      rilasciaLock,
      presenze,
      connesso,
      inCoda,
      statoSalvataggio,
      battito,
    }),
    [
      nome,
      impostaNome,
      clientId,
      campo,
      leggiFlag,
      domande,
      scriviCampo,
      scriviFlag,
      aggiungiDomanda,
      cancellaDomanda,
      spostaDomanda,
      lockAltrui,
      prendiLock,
      rinnovaLock,
      rilasciaLock,
      presenze,
      connesso,
      inCoda,
      statoSalvataggio,
      battito,
    ]
  );

  return <Ctx.Provider value={valore}>{children}</Ctx.Provider>;
}

export { TTL_LOCK };
