# Dossier ab[B]ruzzo

Il dossier di lavoro sulla pratica di deposito del marchio, diventato
un'applicazione su cui due-sei persone scrivono insieme senza sovrascriversi.

Ogni campo si salva da sé poco dopo l'ultima battuta; chi entra in un campo lo
prenota e gli altri lo vedono bordato con il suo nome; le modifiche degli altri
arrivano mentre si lavora e non toccano mai il campo che si ha sotto il cursore.
Si entra con una sola password condivisa e si dichiara come ci si chiama.

- **Next.js** (App Router) e TypeScript
- **Supabase**: Postgres per i dati, Realtime per la sincronizzazione
- Nessuna libreria oltre a queste. Niente Yjs, niente CRDT: la granularità del
  singolo campo basta, e il codice resta leggibile.

---

## 1. Creare il progetto Supabase

1. Su [supabase.com](https://supabase.com) crea un nuovo progetto. Regione
   europea, così i dati restano vicini.
2. Aperto il progetto, vai in **Settings → API** e tieni sotto mano tre valori:
   - **Project URL** → sarà `NEXT_PUBLIC_SUPABASE_URL`
   - la chiave **anon / publishable** → sarà `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - la chiave **service_role / secret** → sarà `SUPABASE_SERVICE_ROLE_KEY`

La chiave anon arriva al browser, ma le policy del database la limitano alla
sola lettura e serve unicamente ad ascoltare Realtime: tutte le scritture
passano dalle rotte API del server. La chiave service_role scavalca ogni
controllo e non deve mai comparire in una variabile che comincia per
`NEXT_PUBLIC_`.

## 2. Applicare la migrazione

Lo schema sta in `supabase/migrations/0001_init.sql`. Si può applicare in due
modi, a scelta.

**Dal browser.** Apri **SQL Editor** nella dashboard di Supabase, incolla tutto
il contenuto del file, esegui. Il file si può rilanciare quante volte si vuole:
è scritto per non fallire se le tabelle ci sono già.

**Dalla riga di comando**, con la CLI di Supabase (`supabase/config.toml` è già
nel repository, serve alla CLI e non contiene segreti):

```bash
npx supabase link --project-ref <riferimento-del-progetto>
npx supabase db push
```

Con `npx supabase start` si può anche tenere in piedi un Supabase locale, se si
preferisce provare senza toccare quello vero.

Che cosa crea:

| tabella     | che cosa contiene                                                       |
| ----------- | ----------------------------------------------------------------------- |
| `fields`    | un record per campo di testo modificabile, con chiave parlante           |
| `flags`     | stati dei nodi, spunte delle classi, « risposta ottenuta » delle domande |
| `questions` | identità e ordinamento delle domande; i testi stanno in `fields`         |
| `locks`     | le prenotazioni dei campi, con scadenza a trenta secondi                 |

Le chiavi si leggono da sole: `meta.dek`, `nodes.n4.body`, `classes.24.nt`,
`questions.q3.a`.

## 3. Scegliere la password

```bash
npm install
npm run hash-password
```

Chiede la password e stampa due righe da incollare fra le variabili d'ambiente:
l'hash scrypt della password e un `SESSION_SECRET` nuovo. La password in chiaro
non viene scritta da nessuna parte: il server confronta solo l'hash, e il
browser non la riceve mai.

Cambiando `SESSION_SECRET` si invalidano tutti i cookie: è il modo di far
rientrare tutti con una password nuova.

## 4. Provare in locale

```bash
cp .env.example .env.local     # poi riempilo con i valori dei passi 1 e 3
npm run seed                   # popola le tabelle con i contenuti di partenza
npm run dev                    # http://localhost:3000
```

`npm run seed` non sovrascrive nulla: inserisce solo ciò che manca. Si può
rilanciare senza paura, anche dopo mesi di lavoro sul dossier.

## 5. Pubblicare su Vercel

1. Porta il repository su GitHub.
2. Su [vercel.com](https://vercel.com) fai **Add New → Project** e scegli il
   repository. Next.js viene riconosciuto da solo: non c'è niente da
   configurare, né comandi di build né directory di output.
3. Prima di premere **Deploy**, apri **Environment Variables** e incolla le
   cinque variabili di `.env.example`, con i valori dei passi 1 e 3. Mettile su
   tutti e tre gli ambienti (Production, Preview, Development).
4. Deploy.

Al primo avvio, se le tabelle sono vuote, la pagina lo dice invece di mostrare
un dossier senza testo. Per popolarle basta lanciare `npm run seed` dal proprio
computer, con `.env.local` che punta al progetto Supabase di produzione.

Cambiando una variabile d'ambiente su Vercel serve un nuovo deploy perché venga
letta.

## Le variabili

Sono cinque, tutte commentate in [`.env.example`](.env.example):

| variabile                       | dove |
| ------------------------------- | ---- |
| `NEXT_PUBLIC_SUPABASE_URL`      | server e browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | server e browser, sola lettura |
| `SUPABASE_SERVICE_ROLE_KEY`     | solo server |
| `DOSSIER_PASSWORD_HASH`         | solo server |
| `SESSION_SECRET`                | solo server |

Nel repository non c'è nessun segreto: `.env.local` è ignorato da git.

---

## Come funziona il lavoro in più persone

**Il salvataggio.** Ogni campo si salva da solo circa ottocento millisecondi
dopo l'ultima battuta, e comunque quando si esce dal campo. Viaggia solo quel
campo, mai il documento intero.

**La prenotazione.** Entrando in un campo si prende un lock, che dura trenta
secondi e si rinnova mentre si scrive. Agli altri il campo appare bordato, con
il nome di chi ci sta lavorando, e non è scrivibile. Il controllo non è solo nel
browser: anche il server rifiuta una scrittura su un campo prenotato da altri.
Uscendo dal campo il lock si rilascia subito; se un browser viene chiuso di
colpo, scade da sé.

**Gli aggiornamenti degli altri** arrivano via Realtime e si applicano ai campi
che non si sta usando. Un campo con il cursore dentro non viene mai sovrascritto.

**Chi è collegato** si vede in alto nella barra. Accanto a ogni campo toccato di
recente compare chi lo ha toccato e quando.

**Se cade la rete** l'applicazione lo dice, continua ad accettare quello che si
scrive tenendolo in coda, e riprova da sola con attese crescenti. Tornata la
linea, la coda si svuota e si riallinea con il database.

**Il nome** si sceglie al primo accesso, si tiene in `localStorage` e si cambia
dalla barra. Non è un account: serve alla presenza e a firmare le modifiche.

## Struttura

```
app/            pagine, rotte API, i due fogli di stile
components/     il dossier; collab/ tiene Realtime, lock e coda
lib/            costanti estratte dal dossier, chiavi, autenticazione, tipi
scripts/        hash della password, seed del database
supabase/       la migrazione versionata e la configurazione della CLI
public/allegato il .docx della committente
proxy.ts        il middleware che protegge ogni rotta
```

Il CSS del dossier sta in `app/dossier.css`, riportato riga per riga dal file di
partenza. Tutto ciò che è stato aggiunto — presenza, prenotazioni, avvisi,
password — sta in `app/collab.css`, separato apposta.

`lib/constants.ts` e `lib/seed-data.json` sono stati estratti automaticamente
dall'oggetto `DEF` del dossier originale. Il primo tiene ciò che non si modifica
(metriche di rischio, sequenza, elenco delle classi, testo dell'allegato); il
secondo i valori di partenza dei campi, che servono solo al seed.

## Manutenzione

```bash
npm run dev            # sviluppo
npm run build          # build di produzione
npm run typecheck      # solo i tipi
npm run seed           # inserisce ciò che manca, non tocca il resto
npm run hash-password  # nuova password condivisa
```
