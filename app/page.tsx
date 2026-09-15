import Dossier from "@/components/Dossier";
import { caricaSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export default async function Pagina() {
  let iniziale;
  try {
    iniziale = await caricaSnapshot();
  } catch (e) {
    return (
      <div className="wrap">
        <div className="diagnosi">
          <h1>Il dossier non riesce a leggere il database</h1>
          <p>{e instanceof Error ? e.message : "Errore sconosciuto."}</p>
          <p>
            Controlla <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>, poi verifica di aver applicato la migrazione in{" "}
            <code>supabase/migrations/</code>. Le istruzioni sono nel README.
          </p>
        </div>
      </div>
    );
  }

  if (!iniziale.popolato) {
    return (
      <div className="wrap">
        <div className="diagnosi">
          <h1>Il database è vuoto</h1>
          <p>
            Le tabelle esistono ma non contengono ancora nulla. Esegui <code>npm run seed</code> per
            popolarle con i contenuti di partenza del dossier.
          </p>
        </div>
      </div>
    );
  }

  return <Dossier iniziale={iniziale} />;
}
