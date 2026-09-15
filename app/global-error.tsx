"use client";

/* L'ultima rete: prende anche gli errori del layout, dove `error.tsx` non
   arriva. Deve portarsi dietro <html> e <body> perché sostituisce il layout
   intero, e per la stessa ragione non può contare sui fogli di stile. */
export default function ErroreGlobale({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          padding: "48px 24px",
          fontFamily: "system-ui, sans-serif",
          background: "#faf8f4",
          color: "#1a1a1a",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Il dossier non si è aperto</h1>
          <p style={{ lineHeight: 1.6 }}>
            L’errore è arrivato prima che la pagina fosse in piedi. Quello che era già stato
            salvato resta nel database.
          </p>
          <p
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 13,
              background: "#f0ece4",
              padding: "10px 12px",
              borderRadius: 4,
              overflowWrap: "anywhere",
            }}
          >
            {error.message || "Errore sconosciuto."}
            {error.digest ? ` (${error.digest})` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              font: "inherit",
              padding: "8px 14px",
              cursor: "pointer",
              border: "1px solid #1a1a1a",
              background: "#1a1a1a",
              color: "#faf8f4",
              borderRadius: 3,
            }}
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  );
}
