/** Un valore modificabile con il suo audit. */
export type Valore = {
  value: string;
  updatedAt: string;
  updatedBy: string | null;
};

/** Una domanda a Vittoria: identità e posizione. I testi stanno in `fields`. */
export type Domanda = {
  id: string;
  position: number;
};

/** Prenotazione viva di un campo. */
export type Lock = {
  field_key: string;
  holder: string;
  client_id: string;
  expires_at: string;
};

/** Tutto ciò che serve a disegnare la pagina in un dato istante. */
export type Snapshot = {
  fields: Record<string, Valore>;
  flags: Record<string, Valore>;
  questions: Domanda[];
  locks: Lock[];
  /** false quando il database non è ancora stato popolato con `npm run seed`. */
  popolato: boolean;
};

/** Chi è collegato adesso. */
export type Presenza = {
  clientId: string;
  nome: string;
};

/* --- righe grezze come arrivano da Postgres --- */
export type RigaValore = {
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
};

export type RigaDomanda = {
  id: string;
  position: number;
};
