# 📦 VS Code Extensions Guide - Student Analyst

## Panoramica
Questo file documenta le **24 estensioni essenziali** configurate per il progetto Student Analyst (React TypeScript + analisi finanziaria).

## 🔧 SVILUPPO BASE (4 estensioni)

### Formattazione e Linting
- **esbenp.prettier-vscode** - Prettier Code Formatter
- **dbaeumer.vscode-eslint** - ESLint per JavaScript/TypeScript

### Supporto Linguaggi
- **ms-vscode.vscode-typescript-next** - TypeScript avanzato
- **ms-vscode.vscode-json** - Supporto JSON migliorato

## ⚛️ REACT & FRONTEND (4 estensioni)

### Sviluppo React
- **dsznajder.es7-react-js-snippets** - ES7+ React/Redux/React-Native snippets
- **xabikos.reactsnippets** - React Code Snippets

### Styling e UI
- **bradlc.vscode-tailwindcss** - TailwindCSS IntelliSense
- **formulahendry.auto-rename-tag** - Auto Rename Tag HTML/JSX

## 🔄 GIT WORKFLOW (2 estensioni)

- **eamodio.gitlens** - Git Lens (commit history, authorship, branch management)
- **ms-vscode.vscode-pull-request-github** - GitHub Pull Requests and Issues

## 🧪 TESTING & DEBUGGING (2 estensioni)

- **ms-vscode.vscode-jest** - Jest Test Explorer
- **ms-playwright.playwright** - Playwright End-to-End Testing

## 📊 DATA & FINANCIAL ANALYSIS (4 estensioni)

### Visualizzazione Dati
- **vega.vega** - Vega/Vega-Lite per visualizzazioni complesse
- **mechatroner.rainbow-csv** - CSV Viewer avanzato per dati finanziari

### Analisi Avanzata (Opzionale)
- **ms-toolsai.jupyter** - Jupyter Notebooks per data analysis
- **ms-python.python** - Python support per analisi finanziaria

## 🚀 PRODUTTIVITÀ (6 estensioni)

### Navigation e IntelliSense
- **christian-kohler.path-intellisense** - Path IntelliSense
- **usernamehw.errorlens** - Error Lens (evidenzia errori inline)

### AI e Completion
- **tabnine.tabnine-vscode** - Tabnine AI Code Completion

### Qualità Codice
- **streetsidesoftware.code-spell-checker** - Code Spell Checker

## 🛠️ UTILITÀ EXTRA (2 estensioni)

- **ms-vscode.hexeditor** - Hex Editor per file binari
- **ms-vscode.vscode-yaml** - YAML Language Support

## 🎯 Installazione

Le estensioni si installano automaticamente quando si apre il progetto in VS Code grazie al file `.vscode/extensions.json`.

### Installazione Manuale
```bash
# Per installare tutte le estensioni raccomandate
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
# ... etc
```

## 📚 Esempi Pratici di Utilizzo

### 🔧 Sviluppo React Components

**Snippets React (dsznajder.es7-react-js-snippets):**
```typescript
// Digita "rafce" per creare un React Arrow Function Component:
import React from 'react'

const ComponentName = () => {
  return (
    <div>ComponentName</div>
  )
}

export default ComponentName

// Digita "useState" per hook state:
const [state, setState] = useState(initialState)

// Digita "useEffect" per hook effect:
useEffect(() => {
  
}, [])
```

**Auto Rename Tag:**
- Quando modifichi un tag HTML/JSX, l'altro si aggiorna automaticamente
- Utile per componenti complessi con molti tag annidati

### 🎨 TailwindCSS Development

**IntelliSense Avanzato:**
```typescript
// Autocompletamento per classi Tailwind
<div className="bg-blue-500 hover:bg-blue-700 transition-colors duration-300">
  {/* TailwindCSS IntelliSense fornisce suggerimenti in tempo reale */}
</div>

// Supporto per utility functions personalizzate
<Button className={cn("base-styles", isActive && "active-styles")}>
```

### 📊 Analisi Dati Finanziari

**CSV Data Viewer (Rainbow CSV):**
- Apri file CSV con dati finanziari
- Visualizzazione colorata per colonne
- Query SQL-like sui dati
- Perfetto per analizzare dati storici di mercato

**Vega Visualizations:**
```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {"values": [...]},
  "mark": "line",
  "encoding": {
    "x": {"field": "date", "type": "temporal"},
    "y": {"field": "price", "type": "quantitative"}
  }
}
```

### 🔍 Git Workflow con Git Lens

**Funzionalità Chiave:**
- **Blame Annotations**: Vedi chi ha modificato ogni riga
- **Commit Graph**: Visualizza la storia dei commit
- **Branch Comparison**: Confronta branch facilmente
- **File History**: Traccia modifiche ai file nel tempo

**Comandi Utili:**
- `Ctrl+Shift+P` → "GitLens: Show Commit Graph"
- Hover su una riga per vedere l'ultimo commit
- Click su commit per vedere diff completo

### 🧪 Testing Integration

**Jest Test Explorer:**
- Esegui test singoli o suite complete
- Vedi risultati in tempo reale
- Debug test direttamente in VS Code
- Coverage report integrato

**Playwright E2E:**
- Registra test interattivamente
- Debug test step-by-step
- Visualizza screenshot di fallimenti
- Trace viewer integrato

### 🤖 AI-Powered Development

**Tabnine Completion:**
- Suggerimenti intelligenti basati sul contesto
- Completamento di funzioni intere
- Pattern recognition per codice ripetitivo
- Supporto per librerie specifiche (React, Chart.js)

**Error Lens:**
- Errori TypeScript mostrati inline
- Warning ESLint evidenziati
- Quick fixes suggeriti
- Riduce il tempo di debugging

### 📝 Qualità del Codice

**Spell Checker:**
```typescript
// Evidenzia errori di spelling in:
// - Commenti
// - Stringhe
// - Nomi variabili
// - Documentazione

const financialAnalysis = "Analisi finanziaria"; // ✅ Corretto
const financialAnalysi = "Analisi finanziaria";  // ❌ Errore evidenziato
```

**Prettier + ESLint Integration:**
- Formattazione automatica al salvataggio
- Fix automatico di problemi ESLint
- Configurazione unificata per tutto il team
- Consistency garantita nel codebase

## 📋 Benefici

- ✅ **Workflow Git completo** con Git Lens e GitHub integration
- ✅ **Sviluppo React accelerato** con snippets e auto-completion
- ✅ **Analisi dati finanziaria** con Vega, CSV viewer, Jupyter
- ✅ **Produttività massimizzata** con AI completion e error highlighting
- ✅ **Qualità codice garantita** con spell checker e linting avanzato

## 🔄 Aggiornamenti

Questo file viene aggiornato insieme al file `extensions.json` quando vengono aggiunte nuove estensioni al progetto.

**Ultima modifica:** 28 Giugno 2025 - Configurazione iniziale completa con esempi pratici 