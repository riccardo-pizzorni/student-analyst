# Backup storico della cartella `public` (Student Analyst)

> **Questo file documenta in modo dettagliato la struttura, i file, gli asset, le motivazioni e le funzioni della cartella `public` PRIMA della migrazione totale agli asset di Lovable. Serve come memoria storica e riferimento per ogni risorsa pubblica del vecchio sistema.**

---

## **Struttura della cartella `public`**

- **lovable-uploads/**
  - Contiene immagini PNG caricate dall'utente o usate come asset custom.
  - Esempi: `9e03ad61-2209-4d9c-8b8c-209a8a875636.png`, `abe9914b-c524-4d1c-b7ee-eeb4091ba47b.png`
  - **Motivazione:** Permettere upload e visualizzazione di immagini custom nella UI.

- **workers/**
  - Contiene worker JavaScript per calcoli matematici intensivi.
  - Esempio: `matrixWorker.js` (gestione calcoli di ottimizzazione portafoglio, inversione matrici, efficient frontier, ecc. in thread separato per non bloccare la UI)
  - **Motivazione:** Offrire performance e reattività anche con dataset grandi, delegando i calcoli pesanti a Web Worker.

- **favicon.ico**
  - Icona del sito per browser e tab.
  - **Motivazione:** Branding e riconoscibilità.

- **placeholder.svg**
  - SVG di placeholder per immagini o asset mancanti.
  - **Motivazione:** Visualizzazione elegante in assenza di asset specifici.

- **robots.txt**
  - Regole per i crawler dei motori di ricerca.
  - Consente l'accesso a tutti i bot principali (Googlebot, Bingbot, Twitterbot, Facebook, ecc.).
  - **Motivazione:** Permettere l'indicizzazione e la condivisione social.

- **manifest.json**
  - Manifest PWA (Progressive Web App): nome, colori, icone, start_url, ecc.
  - Esempio: nome "Student Analyst", icona `vite.svg`, colori custom.
  - **Motivazione:** Abilitare installabilità su mobile, personalizzazione icona/app.

- **404.html**
  - Pagina di errore custom per rotte non trovate.
  - Stile moderno, branding "STUDENT ANALYST", messaggio in italiano, bottone per tornare alla homepage.
  - **Motivazione:** Migliorare UX in caso di errori di navigazione.

- **vite.svg**
  - Asset SVG usato come icona (collegato anche nel manifest).
  - **Motivazione:** Branding, visualizzazione su dispositivi e come favicon.

---

## **Motivazioni e filosofia**
- **Branding:** favicon, SVG, manifest e placeholder garantiscono coerenza visiva e riconoscibilità.
- **Performance:** worker JS per calcoli pesanti, separazione tra UI e logica computazionale.
- **UX:** pagina 404 custom, placeholder per asset mancanti, robots.txt per SEO/social.
- **Estendibilità:** struttura pronta per aggiunta di nuovi asset, worker, immagini custom.

---

## **Nota finale**
Questa documentazione rappresenta la "memoria storica" della vecchia cartella `public` di Student Analyst. Ogni asset, worker, configurazione e file qui descritto era parte integrante della UX e delle funzionalità pubbliche prima della migrazione totale agli asset di Lovable.

---

*Generato automaticamente per garantire la conservazione della conoscenza e facilitare eventuali future reintroduzioni, refactoring o audit.* 