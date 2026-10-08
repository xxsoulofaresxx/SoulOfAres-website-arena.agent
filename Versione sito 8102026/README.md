# xXSoulOfAresXx — Gecko marketplace

Catalogo Next.js per `Correlophus ciliatus`, collegato a PostgreSQL con Drizzle ORM. Il sito e il catalogo sono pubblici; l'area allevatore e le API di modifica sono protette da password.

## Pubblicarlo online: percorso consigliato

La combinazione più semplice è **GitHub + Vercel + Neon PostgreSQL**. Vercel ospita Next.js, Neon ospita il database.

### 1. Carica il progetto su GitHub

1. Scarica/esporta la cartella del progetto dal tuo ambiente di sviluppo e scompattala sul computer.
2. Crea un repository nuovo su [github.com/new](https://github.com/new). Puoi lasciarlo privato.
3. Apri il terminale nella cartella del progetto ed esegui, sostituendo l'URL con quello del tuo repository:

```bash
git init
git add .
git commit -m "Prima versione xXSoulOfAresXx"
git branch -M main
git remote add origin https://github.com/NOME-UTENTE/NOME-REPOSITORY.git
git push -u origin main
```

> Il file `.env` con le credenziali locali è escluso da Git. **Non** rimuovere `.env` dal `.gitignore` e non pubblicare mai password o URL del database nei sorgenti.

### 2. Crea il database PostgreSQL

1. Crea un progetto su [neon.tech](https://neon.tech) (oppure usa un PostgreSQL gestito equivalente).
2. Copia la connection string PostgreSQL. In Neon scegli la stringa **pooled** per l'applicazione, con TLS (`sslmode=require`, se richiesto dal provider).
3. Conservala: verrà inserita in Vercel come `DATABASE_URL`.

L'utente del database deve poter creare tabelle e tipi PostgreSQL. Al primo avvio l'applicazione crea le tabelle e inserisce gli esemplari iniziali se il database è vuoto.

### 3. Pubblica su Vercel

1. Vai su [vercel.com](https://vercel.com), accedi con GitHub e premi **Add New → Project**.
2. Importa il repository appena creato. Vercel riconosce automaticamente Next.js: lascia i comandi di build predefiniti.
3. In **Storage → Create Storage → Blob**, crea uno store e collegalo al progetto, includendo almeno l'ambiente **Production** (e Preview, se vuoi provarlo). Vercel genera `BLOB_READ_WRITE_TOKEN`, necessario per autorizzare upload e cancellazione delle foto/video. Se lavori in locale, collega anche Development e copia il token nel tuo `.env`.
4. Prima del deploy, in **Environment Variables**, aggiungi queste variabili per **Production** (e anche Preview, se vuoi provare le preview):

| Nome | Valore |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL pooled del tuo database |
| `BREEDER_PASSWORD` | Una password lunga, unica e non usata altrove |
| `BREEDER_SESSION_SECRET` | Un segreto casuale lungo, diverso dalla password |
| `BLOB_READ_WRITE_TOKEN` | Creato automaticamente quando colleghi Vercel Blob al progetto |

Per generare `BREEDER_SESSION_SECRET` sul tuo computer puoi usare:

```bash
openssl rand -base64 32
```

Non condividere né inserire questi valori in GitHub o nelle chat.

5. Dopo aver salvato le variabili, premi **Deploy**. Ogni nuovo deploy dopo una modifica alle variabili ricrea il server con i nuovi valori.
6. Quando il deploy è completato, Vercel ti mostrerà un indirizzo pubblico tipo `https://nome-progetto.vercel.app`. Il catalogo è accessibile a tutti; per gestire animali, media e pedigree apri `/dashboard` e inserisci `BREEDER_PASSWORD`.

### Dominio personale (facoltativo)

Da Vercel apri **Project → Settings → Domains**, aggiungi il dominio che hai acquistato e configura i record DNS indicati da Vercel presso il registrar. Non serve modificare il codice.

## Avvio in locale

Requisiti: Node.js 20.9+ e PostgreSQL.

```bash
npm install
cp .env.example .env
```

Apri `.env` e inserisci un `DATABASE_URL` valido, una tua `BREEDER_PASSWORD` e un `BREEDER_SESSION_SECRET` generato con il comando sopra. Poi avvia:

```bash
npm run dev
```

Visita `http://localhost:3000`. Al primo caricamento del catalogo, l'app prepara le tabelle e carica i dati iniziali. Le variabili locali stanno in `.env`, che Git ignora.

### Drizzle Kit (facoltativo)

`drizzle.config.ts` legge `DIRECT_DATABASE_URL` se impostato, altrimenti `DATABASE_URL`. Per applicare lo schema manualmente:

```bash
npx drizzle-kit push
```

Per Neon, usa la stringa diretta in `DIRECT_DATABASE_URL` per le operazioni Drizzle e quella pooled in `DATABASE_URL` per le richieste dell'app. Non è necessario eseguire il comando per il primo deploy: l'inizializzazione inclusa crea schema e catalogo quando l'app si collega al database.

## Note per la pubblicazione

- Verifica i limiti e le condizioni dei piani di Vercel e del provider PostgreSQL: possono cambiare; per un'attività commerciale scegli un piano compatibile con il tuo uso.
- Fai backup periodici del database, specialmente dopo aver inserito animali o richieste reali.
- La password protegge il pannello con una sessione firmata e cookie `HttpOnly`; imposta entrambi i segreti (`BREEDER_PASSWORD` e `BREEDER_SESSION_SECRET`) prima di condividere il link.
- Le foto e i video caricati dalla scheda sono salvati nello store **Vercel Blob**; PostgreSQL conserva URL, associazione all'esemplare e dati genealogici. Il limite attuale per file è 100 MB; Blob aggiunge il suo costo/quota in base al piano.
- Le immagini del logo e gli scatti demo sono in `public/images/` e vengono pubblicati insieme al sito; i media che carichi dal pannello sono persistenti sullo store Blob.
