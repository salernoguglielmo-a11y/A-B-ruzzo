"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ModuloLogin() {
  const router = useRouter();
  const parametri = useSearchParams();
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

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
      const da = parametri.get("da");
      router.replace(da && da.startsWith("/") ? (da as "/") : "/");
      router.refresh();
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
