# 🚀 Development Environment Setup Guide - Student Analyst

## Panoramica

Questa guida fornisce istruzioni complete per configurare l'ambiente di sviluppo ottimizzato per il progetto **Student Analyst** (React TypeScript + TailwindCSS + Analisi Finanziaria).

L'ambiente è stato ottimizzato con:

- ✅ **Configurazioni IDE** unificate (Cursor + VS Code)
- ✅ **Pre-commit hooks** robusti con quality gates
- ✅ **24 estensioni essenziali** per produttività massima
- ✅ **Sicurezza migliorata** con API keys protette
- ✅ **MCP integration** per AI-powered development

---

## 📋 Prerequisiti

### Software Richiesto

- **Node.js** v18+ con npm
- **Git** con configurazione globale
- **VS Code** o **Cursor IDE**
- **PowerShell** (Windows) o **Bash** (Unix)

### API Keys Necessarie

- `OPENROUTER_API_KEY` - Per AI completion e Task Master
- `ANTHROPIC_API_KEY` - Per Claude (opzionale)
- `PERPLEXITY_API_KEY` - Per research features (opzionale)

---

## 🔧 Configurazione Step-by-Step

### 1. Clone e Setup Iniziale

```bash
# Clone del repository
git clone <repository-url> student-analyst
cd student-analyst

# Installazione dipendenze
npm install

# Setup environment variables
cp .env.example .env
# Editare .env con le proprie API keys
```

### 2. Configurazione IDE

#### 🎯 Cursor IDE (Raccomandato)

**File: `.cursor/settings.json`**

- ✅ **AI Assistant**: Claude 3.5 Sonnet configurato
- ✅ **TypeScript**: Auto-imports, inlay hints, update imports on move
- ✅ **React**: Emmet support per TypeScript/JSX
- ✅ **TailwindCSS**: IntelliSense completo
- ✅ **Formatting**: Format on save/paste, ESLint auto-fix

**File: `.cursor/mcp.json`**

- ✅ **Task Master AI**: Configurazione MCP completa
- ✅ **Security**: API keys tramite environment variables
- ✅ **Documentation**: Setup guide in `.cursor/mcp-env-setup.md`

**Setup Environment Variables per Cursor:**

```bash
# Windows PowerShell
$env:OPENROUTER_API_KEY="your-api-key-here"

# Oppure aggiungi al file .cursor/mcp.json nella sezione "env"
```

#### 💻 VS Code (Alternativa)

**File: `.vscode/settings.json`**

- ✅ **Enhanced TypeScript**: Inlay hints ottimizzati per produttività
- ✅ **Testing Integration**: Jest + Playwright configurati
- ✅ **TailwindCSS Advanced**: Supporto per cn(), cx(), cva(), twMerge()
- ✅ **Editor Experience**: Bracket colorization, format on paste
- ✅ **File Management**: Nesting patterns avanzati

**File: `.vscode/extensions.json`**

- ✅ **24 Estensioni Essenziali** organizzate per categoria
- ✅ **Auto-installation**: Estensioni si installano automaticamente
- ✅ **Documentation**: Guida completa in `.vscode/extensions-guide.md`

**Categorie Estensioni:**

1. **Sviluppo Base** (4) - Prettier, ESLint, TypeScript, JSON
2. **React & Frontend** (4) - Snippets, TailwindCSS, Auto-rename
3. **Git Workflow** (2) - Git Lens, GitHub integration
4. **Testing & Debugging** (2) - Jest, Playwright
5. **Data & Financial Analysis** (4) - Vega, CSV, Jupyter, Python
6. **Produttività** (6) - AI completion, Error lens, Spell checker

### 3. Pre-Commit Hook Configuration

**File: `.husky/pre-commit`**

Il pre-commit hook implementa 4 quality gates:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Starting pre-commit quality gates..."

# 1. TypeScript Type Checking
echo "📝 Checking TypeScript types..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript type checking failed"
  exit 1
fi
echo "✅ TypeScript type checking passed"

# 2. ESLint Validation
echo "🔍 Running ESLint validation..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint validation failed"
  exit 1
fi
echo "✅ ESLint validation passed (warnings under threshold)"

# 3. Prettier Auto-formatting
echo "🎨 Auto-formatting staged files with Prettier..."
npx lint-staged
echo "✅ Staged files formatted successfully"

# 4. Test Execution
echo "🧪 Running tests..."
npm run test -- --passWithNoTests --silent
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi
echo "✅ Tests passed successfully"

echo "🎉 All quality gates passed! Proceeding with commit..."
```

**Scripts Package.json Richiesti:**

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 10",
    "test": "jest",
    "format": "prettier --write ."
  }
}
```

### 4. MCP (Model Context Protocol) Setup

**Per Cursor:**

1. Configurare API key in environment variables
2. Verificare configurazione in `.cursor/mcp.json`
3. Restart Cursor per applicare modifiche

**Per VS Code:**

1. Installare MCP extension se disponibile
2. Configurare `.vscode/mcp.json` con stesse impostazioni
3. Seguire guida in `.vscode/mcp-env-setup.md`

---

## 🧪 Verifica Setup

### 1. Test Ambiente di Sviluppo

```bash
# Avvio development server
npm run dev

# Verifica TypeScript
npm run typecheck

# Verifica linting
npm run lint

# Esecuzione test
npm run test

# Test pre-commit hook
git add .
git commit -m "test: verify setup"
```

### 2. Verifica Estensioni VS Code

```bash
# Lista estensioni installate
code --list-extensions

# Installa estensioni mancanti
code --install-extension esbenp.prettier-vscode
code --install-extension eamodio.gitlens
# ... altre estensioni dalla lista
```

### 3. Test MCP Integration

- Aprire Cursor/VS Code
- Verificare che Task Master AI sia disponibile
- Testare completion AI e features avanzate
- Controllare console per errori MCP

---

## 📁 Struttura File di Configurazione

```
student-analyst/
├── .cursor/
│   ├── settings.json          # Configurazioni Cursor IDE
│   ├── mcp.json              # MCP configuration per AI tools
│   └── mcp-env-setup.md      # Guida setup environment variables
├── .vscode/
│   ├── settings.json         # Configurazioni VS Code
│   ├── extensions.json       # Lista estensioni raccomandate
│   ├── extensions-guide.md   # Guida utilizzo estensioni
│   ├── mcp.json             # MCP backup per VS Code
│   └── mcp-env-setup.md     # Guida setup MCP per VS Code
├── .husky/
│   └── pre-commit           # Pre-commit hook con quality gates
├── jest.config.cjs          # Configurazione Jest testing
├── .env                     # Environment variables (locale)
└── docs/
    └── configuration/
        └── DEVELOPMENT_ENVIRONMENT_SETUP.md  # Questa guida
```

---

## 🔧 Scripts Utili

### Setup Rapido

```bash
# Setup completo ambiente
npm run setup:dev

# Verifica configurazione
npm run verify:config

# Reset configurazione (se necessario)
npm run reset:config
```

### Manutenzione

```bash
# Update estensioni VS Code
code --list-extensions | xargs -L 1 echo code --install-extension

# Backup configurazioni
npm run backup:config

# Restore configurazioni
npm run restore:config
```

---

## 📚 Risorse Aggiuntive

### Documentazione File Specifici

- **Estensioni VS Code**: `.vscode/extensions-guide.md`
- **MCP Setup Cursor**: `.cursor/mcp-env-setup.md`
- **MCP Setup VS Code**: `.vscode/mcp-env-setup.md`
- **Production Config**: `docs/configuration/PRODUCTION_CONFIG.md`

### Link Utili

- [Cursor IDE Documentation](https://cursor.sh/docs)
- [VS Code Settings Reference](https://code.visualstudio.com/docs/getstarted/settings)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Husky Pre-commit Hooks](https://typicode.github.io/husky/)

---

## 🆘 Troubleshooting

Vedi la sezione troubleshooting dettagliata nel prossimo documento.

---

**Ultima modifica:** 28 Giugno 2025 - Setup completo ambiente ottimizzato
**Versione:** 1.0.0
**Autore:** Task Master AI Configuration Team
