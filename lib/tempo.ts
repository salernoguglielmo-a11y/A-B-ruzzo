/** Tempo trascorso in italiano, corto abbastanza da stare in un'etichetta. */
export function daQuando(iso: string, adesso = Date.now()): string {
  const delta = adesso - new Date(iso).getTime();
  if (!Number.isFinite(delta)) return "";
  if (delta < 45_000) return "adesso";

  const minuti = Math.round(delta / 60_000);
  if (minuti < 60) return `${minuti} min fa`;

  const ore = Math.round(minuti / 60);
  if (ore < 24) return ore === 1 ? "un'ora fa" : `${ore} ore fa`;

  const giorni = Math.round(ore / 24);
  return giorni === 1 ? "ieri" : `${giorni} giorni fa`;
}
