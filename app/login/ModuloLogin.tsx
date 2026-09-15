"use client";

import { useEffect, useState } from "react";

/* Marcatore usato per accorgersi di un rimbalzo.
   Se la password viene accettata ma si riatterra qui, vuol dire che il
   middleware e la rotta di login non stanno leggendo lo stesso SESSION_SECRET:
   succede quando si cambiano le variabili d'ambiente senza ridistribuire.
   Senza questo controllo il sintomo è un giro infinito e muto. */
const MARCATORE = "dossier-abbruzzo:entrata";
const FINESTRA_RIMBALZO = 15_000;

export default function ModuloLogin() {
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [rimbalzo, setRimbalzo] = useState(false);
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    try {
      const segnato = window.sessionStorage.getItem(MARCATORE);
      window.sessionStorage.removeItem(MARCATORE);
      // Il marcatore esiste solo nel browser: leggerlo durante il render
      // darebbe un disallineamento con l'HTML che arriva dal server.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (segnato && Date.now() - Number(segnato) < FINESTRA_RIMBALZO) setRimbalzo(true);
    } catch {
      // sessionStorage negato: si perde solo questa diagnosi
    }
  }, []);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    if (inCorso) return;
    setInCorso(true);
    setErrore("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { errore?: string } | null;
        setErrore(j?.errore ?? "Password non valida.");
        setInCorso(false);
        return;
      }
      try {
        window.sessionStorage.setItem(MARCATORE, String(Date.now()));
      } catch {
        // non è indispensabile: serve solo alla diagnosi del rimbalzo
      }
      // Navigazione piena, non `router.replace`: così la richiesta successiva
      // porta con sé il cookie appena ricevuto e il middleware la lascia passare.
      window.location.replace("/");
    } catch {
      setErrore("Non riesco a raggiungere il server. Riprova.");
      setInCorso(false);
    }
  }

  return (
    <form className="login-carta" onSubmit={invia}>
      <div className="eyebrow">
        <span>Documento di lavoro</span>
        <span>Deposito marchio &middot; UIBM</span>
      </div>
      <h1>
        ab<span className="br">[B]</span>ruzzo
      </h1>
      <p className="dek">Sette nodi da sciogliere prima del deposito.</p>

      {rimbalzo && (
        <p className="login-avviso" role="alert">
          <b>La password era giusta, ma la sessione non viene riconosciuta.</b> Succede quando le
          variabili d’ambiente sono state cambiate senza ridistribuire il sito: il middleware sta
          ancora usando il <code>SESSION_SECRET</code> di prima. Su Vercel fai un <b>Redeploy</b>,
          con la spunta « Use existing Build Cache » tolta.
        </p>
      )}

      <label htmlFor="pw">Password condivisa</label>
      <input
        id="pw"
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {errore && (
        <p className="login-errore" role="alert">
          {errore}
        </p>
      )}

      <button type="submit" className="btn primary" disabled={inCorso || password.length === 0}>
        {inCorso ? "verifica…" : "Entra"}
      </button>
    </form>
  );
}
