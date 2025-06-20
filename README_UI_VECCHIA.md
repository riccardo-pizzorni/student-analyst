# STUDENT ANALYST – README_UI_VECCHIA

## 📚 Cos'è questo file?

Questo documento è un **backup completo** della UI originale di Student Analyst (prima dell'integrazione Lovable). Qui trovi:

- Struttura e componenti principali
- Palette colori, font, spacing, mood
- Filosofia estetica e UX
- Dettagli su sidebar, layout, step navigation, animazioni
- Best practice e scelte stilistiche
- Istruzioni per riprodurre fedelmente questa UI

---

## 1. STRUTTURA GENERALE DELLA UI

- **Framework:** React + Vite + TypeScript
- **CSS:** Tailwind CSS + CSS custom (DesktopLayout.css, App.css, ecc.)
- **Componenti chiave:**
  - `App.tsx`: entry point, gestisce routing e viste
  - `DesktopLayout.tsx` + `DesktopLayoutDemo.tsx`: layout desktop avanzato, sidebar, header, pannelli mobili
  - `SidebarStepNavigation.tsx` + `SidebarStepNavigationDemo.tsx`: sidebar step-by-step per workflow finanziario
  - `components/ui/`: pulsanti, tab, badge, icone, alert, ecc.
  - `App.css`, `index.css`, `DesktopLayout.css`, `DesktopLayoutDemo.css`: regole di stile globali e specifiche

---

## 2. PALETTE COLORI & MOOD

- **Colori principali:**
  - Blu professionale: `#2563eb` (primary)
  - Grigio chiaro: `#f8fafc`, `#e2e8f0`, `#cbd5e1`
  - Grigio scuro: `#0f172a`, `#64748b`
  - Verde successo: `#059669`
  - Giallo warning: `#d97706`
  - Rosso errore: `#ef4444`
- **Mood:**
  - Moderno, professionale, fintech
  - Contrasto elevato, leggibilità ottima
  - Effetti glassmorphism e gradienti soft
  - Animazioni fluide e micro-interazioni

---

## 3. FONT & TIPOGRAFIA

- Font di sistema: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;`
- Titoli: grassetto, dimensioni scalabili
- Testo: chiaro, spaziatura generosa, ottima leggibilità

---

## 4. SIDEBAR & NAVIGAZIONE

- **Sidebar step-by-step**
  - Workflow a fasi: input dati, validazione, analisi rischio, performance, ottimizzazione, confronto strategie, report, export
  - Ogni step: icona, titolo, descrizione, stato (pending/current/completed)
  - Sidebar collassabile, progress bar, animazioni
  - Colori: blu per current, verde per completed, grigio per pending
- **Altra sidebar (DesktopLayout):**
  - Resizable, con header, toggle, sezioni
  - Quick stats, watchlist, menu navigazione

---

## 5. LAYOUT & COMPONENTI PRINCIPALI

- **Header:**
  - Titolo app, versione, step navigation, pulsanti azione
- **Main:**
  - Area contenuti, pannelli mobili (drag, resize, z-index)
  - Tabelle, grafici, dashboard, card
- **Componenti UI custom:**
  - Button, Card, Tabs, Badge, Alert, Progress, ecc.
  - Animazioni hover, focus ring, glassmorphism

---

## 6. ANIMAZIONI & MICRO-INTERAZIONI

- Hover su card, pulsanti, icone
- Transizioni sidebar, pannelli, step
- Spinner loading, progress bar
- Effetti glass e gradienti

---

## 7. FILOSOFIA ESTETICA & UX

- Esperienza desktop avanzata, ispirazione fintech
- Tutto accessibile da tastiera (focus ring, aria-label)
- Responsive, ma ottimizzato per desktop
- Stato visivo chiaro (success, warning, error)
- Navigazione step-by-step per guidare l'utente

---

## 8. COME RIPRODURRE QUESTA UI

1. **Usa la struttura file e componenti come in questa repo**
2. **Importa e applica i CSS custom** (`DesktopLayout.css`, `App.css`, ecc.)
3. **Mantieni la palette e le variabili CSS** (vedi `:root` in index.css e DesktopLayout.css)
4. **Sidebar step-by-step:** usa `SidebarStepNavigation.tsx` e la sua demo
5. **Layout desktop:** usa `DesktopLayout.tsx` e la sua demo
6. **Componenti UI:** importa da `components/ui/` e mantieni le classi e le animazioni
7. **Rispetta la filosofia di spacing, font, colori e mood**

---

## 9. SCREENSHOT E MOODBOARD (aggiungi qui immagini se vuoi)

---

## 10. NOTE E BEST PRACTICE

- Non modificare la sidebar step-by-step senza motivo
- Mantieni la coerenza cromatica e tipografica
- Usa sempre le variabili CSS per colori e spacing
- Documenta ogni variazione importante

---

**Questo file è il riferimento storico e stilistico della UI originale di Student Analyst.**
