import Dossier from "@/components/Dossier";
import Seme from "@/components/Seme";
import { caricaSnapshot } from "@/lib/snapshot";
import { VARIABILI_RICHIESTE, variabiliMancanti } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Quale progetto Vercel e quale deploy stiamo guardando, se siamo su Vercel. */
function firmaDeploy(): string | null {
  const dove = process.env.VERCEL_URL;
  if (!dove) return null;
  const ambiente = process.env.VERCEL_ENV;
  return ambiente ? `${dove} (${ambiente})` : dove;
}

function Firma() {
  const dove = process.env.VERCEL_URL;
  if (!dove) return null;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const ambiente = process.env.VERCEL_ENV;
  return (
    <p className="firma-deploy">
      Stai guardando <code>{dove}</code>
      {ambiente ? <> · ambiente <b>{ambiente}</b></> : null}
      {commit ? <> · commit <code>{commit}</code></> : null}
    </p>
  );
}

/** L'elenco delle tre variabili, con accanto quali ci sono e quali no. */
function ElencoVariabili({ mancanti }: { mancanti: string[] }) {
  return (
    <ul className="variabili">
      {VARIABILI_RICHIESTE.map((v) => {
        const assente = mancanti.includes(v.nome);
        return (
          <li key={v.nome} className={assente ? "assente" : "presente"}>
            <code>{v.nome}</code>
            <span className="esito">{assente ? "manca" : "c’è"}</span>
            <span className="serve">{v.serve}</span>
          </li>
        );
      })}
    </ul>
  );
}

function ComeSiRisolve() {
  return (
    <>
      <h2>Come si risolve su Vercel</h2>
      <ol>
        <li>
          <b>Settings → Environment Variables.</b> Aggiungi quelle che mancano, con i valori che
          trovi nella dashboard di Supabase in <b>Settings → API</b>. Spunta tutti e tre gli
          ambienti: Production, Preview e Development.
        </li>
        <li>
          <b>Deployments → … → Redeploy</b>, togliendo la spunta « Use existing Build Cache ».
          Questo passaggio non è facoltativo: senza un nuovo deploy il sito continua a girare con
          le variabili di prima.
        </li>
      </ol>
      <p className="minuta">
        Se una variabile risulta ancora mancante dopo il redeploy, quasi sempre è stata salvata su
        un ambiente diverso da quello che stai guardando, oppure il nome ha una lettera fuori posto:
        vanno scritti esattamente così, maiuscole comprese. Controlla anche di essere sul progetto
        Vercel giusto: l’indirizzo qui sotto dice quale stai guardando davvero.
      </p>
    </>
  );
}

export default async function Pagina() {
  /* Prima le variabili: senza, ogni altra diagnosi sarebbe un contorno. */
  const mancanti = variabiliMancanti();
  if (mancanti.length > 0) {
    return (
      <div className="wrap">
        <div className="diagnosi">
          <h1>
            {mancanti.length === 1
              ? "Manca una variabile d’ambiente"
              : `Mancano ${mancanti.length} variabili d’ambiente`}
          </h1>
          <p>
            Il dossier non può collegarsi a Supabase finché non ci sono tutte e tre. Ecco come sta
            messo adesso questo deploy:
          </p>
          <ElencoVariabili mancanti={mancanti} />
          <ComeSiRisolve />
          <Firma />
        </div>
      </div>
    );
  }

  let iniziale;
  try {
    iniziale = await caricaSnapshot();
  } catch (e) {
    return (
      <div className="wrap">
        <div className="diagnosi">
          <h1>Il dossier non riesce a leggere il database</h1>
          <p>
            Le tre variabili ci sono tutte, quindi il problema sta più in là: o i valori non sono
            quelli giusti, o le tabelle non esistono ancora.
          </p>
          <p className="errore-grezzo">{e instanceof Error ? e.message : "Errore sconosciuto."}</p>
          <p>
            Verifica di aver applicato la migrazione <code>supabase/migrations/0001_init.sql</code>,
            dal SQL Editor di Supabase o con <code>npx supabase db push</code>. Se l’hai già fatto,
            ricopia le chiavi da <b>Settings → API</b>: capita che si tronchino incollandole.
          </p>
          <Firma />
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
            Le tabelle esistono ma non contengono ancora nulla. Il bottone qui sotto inserisce i
            contenuti di partenza del dossier, gli stessi di <code>npm run seed</code>: aggiunge
            soltanto ciò che manca e non sovrascrive mai nulla, quindi si può premere senza paura.
          </p>
          <Seme />
          <p className="minuta">
            In alternativa, dal tuo computer: <code>npm run seed</code>, con <code>.env.local</code>{" "}
            che punta a questo progetto Supabase.
          </p>
          <Firma />
        </div>
      </div>
    );
  }

  return <Dossier iniziale={iniziale} deploy={firmaDeploy()} />;
}
