# 📂 scripts - Automazioni, Test e Utility del Progetto

Questa cartella contiene tutti gli script e le utility che automatizzano, testano o facilitano lo sviluppo e la manutenzione del progetto **Student Analyst**. Qui trovi sia strumenti per lo sviluppo locale, sia automazioni avanzate per backup, test, integrazione e deploy.

---

## INDICE

- [Batch di automazione personale](#batch-di-automazione-personale)
- [Test e analisi](#test-e-analisi)
- [Server di sviluppo](#server-di-sviluppo)
- [Cartella automation (auto-deploy avanzato)](#cartella-automation-auto-deploy-avanzato)

---

## Batch di automazione personale

### `backup-cursor-chat.bat`

- **Cosa fa:** Ogni 5 minuti copia tutta la cartella delle chat di Cursor (`C:\Users\filpi\AppData\Roaming\Cursor`) in una cartella di backup sul Desktop (`CursorChatBackup`).
- **Motivazione:** Protegge la cronologia delle chat di Cursor da cancellazioni accidentali, reset o bug. Utile se usi Cursor AI per lavoro/studio e vuoi essere sicuro di non perdere mai le conversazioni.
- **Collegamenti:** Viene avviato automaticamente da `start-cursor-and-auto-commit.bat`.

### `auto-commit-push.bat`

- **Cosa fa:** Ogni 2 minuti controlla se ci sono modifiche nel repository. Se sì, esegue `git add .`, `git commit -m "auto-commit"` e `git push`.
- **Motivazione:** Automatizza il salvataggio e la sincronizzazione del lavoro su GitHub, riducendo il rischio di perdere modifiche locali e garantendo che il deploy automatico su Vercel/Render sia sempre aggiornato.
- **Collegamenti:** Viene avviato automaticamente da `start-cursor-and-auto-commit.bat`.

### `start-cursor-and-auto-commit.bat`

- **Cosa fa:** Avvia contemporaneamente Cursor, lo script di auto-commit/push e lo script di backup chat.
- **Motivazione:** Un solo doppio click per avviare tutto il workflow di lavoro e backup, senza dimenticanze.
- **Collegamenti:** Puoi creare un collegamento sul desktop a questo file per avviare tutto in automatico.

---

## Test e analisi

### `run-all-tests.ps1`

- **Cosa fa:** Script PowerShell che esegue tutti i test del progetto (unitari, E2E, coverage), genera report e li salva in `test-results` e `coverage`.
- **Motivazione:** Permette di validare rapidamente la qualità del codice e la copertura dei test prima di un deploy o di una merge importante.

### `integration-tests.js`

- **Cosa fa:** Script Node.js che testa l'integrazione tra frontend e backend, verifica la salute delle API, la presenza dei bundle, la configurazione delle variabili d'ambiente e altro.
- **Motivazione:** Garantisce che tutte le parti critiche dell'applicazione comunichino correttamente e che il deploy sia realmente funzionante.

### `check-bundle-size.js`

- **Cosa fa:** Script Node.js che controlla che il bundle di produzione non superi certe dimensioni (main < 1MB, totale < 5MB, chunk < 500KB).
- **Motivazione:** Aiuta a mantenere alte le performance del sito e a evitare errori di deploy su piattaforme con limiti di dimensione.

---

## Server di sviluppo

### `start-server.sh` e `start-server.bat`

- **Cosa fanno:** Avviano il server di backend/proxy locale, installano le dipendenze se necessario e forniscono informazioni di health check.
- **Motivazione:** Facilitano lo sviluppo e il test locale del backend, garantendo che tutto sia pronto con un solo comando, sia su Windows che su Linux/Mac.

---

## Cartella automation (auto-deploy avanzato)

### `automation/auto-deploy.js`

- **Cosa fa:** Script Node.js che monitora tutto il progetto e, a ogni modifica, esegue build, commit, push e deploy automatico su Vercel.
- **Motivazione:** Permette un flusso di lavoro completamente hands-free, ideale per demo, prototipi o ambienti dove vuoi che ogni modifica venga subito pubblicata senza intervento umano.
- **Nota:** Attualmente non viene avviato automaticamente. Puoi usarlo solo se vuoi un livello di automazione ancora maggiore.

### `automation/package.json` e `automation/node_modules/`

- **Cosa sono:** Gestiscono le dipendenze necessarie solo per gli script di automazione (es: `chalk` per i log colorati).
- **Motivazione:** Mantengono separate le dipendenze di automazione da quelle del progetto principale, evitando conflitti e appesantimenti.

---

## Best practice

- **Non cancellare questa cartella:** contiene strumenti utili per sviluppo, test, backup e automazione.
- **Aggiorna questo README** se aggiungi nuovi script o cambi il workflow.
- **Crea sempre un collegamento sul desktop a `start-cursor-and-auto-commit.bat`** per non dimenticare mai backup e auto-commit.
- **Se non usi uno script, puoi semplicemente ignorarlo:** non consuma risorse se non viene avviato.

---

**Per domande o modifiche, chiedi sempre prima di eliminare o spostare file da questa cartella!**
