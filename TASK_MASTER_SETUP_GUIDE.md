# 🚀 TASK MASTER SETUP GUIDE - STUDENT ANALYST

# ================================================================

## 📋 **CONFIGURAZIONE ATTUALE COMPLETA**

### **MODELLI CONFIGURATI**

- **Main**: `google/gemma-2-9b-it:free` (OpenRouter)
- **Research**: `anthropic/claude-3-haiku:beta` (OpenRouter)
- **Fallback**: `meta-llama/llama-3.1-8b-instruct:free` (OpenRouter)

### **API KEYS STATUS**

- **✅ OpenRouter**: Configurata sia CLI (.env) che MCP (.cursor/mcp.json)
- **✅ Claude-code**: Configurata sia CLI che MCP
- **✅ Bedrock**: Configurata CLI (.env)

---

## 🔧 **COMANDI SETUP COMPLETO**

### **STEP 1: INIZIALIZZAZIONE PROGETTO**

```bash
# Inizializzazione interattiva Task Master
task-master init

# Risposte durante setup:
# Add shell aliases? Y
# Initialize Git repository? Y
# Store tasks in Git? Y
# Rule profiles: Claude Code, Codex, Cursor, VS Code
# Modelli: Selezione interattiva (vedi sotto)
```

### **STEP 2: CONFIGURAZIONE MODELLI**

```bash
# Modello principale (gratuito, veloce)
task-master models --set-main="google/gemma-2-9b-it:free" --openrouter

# Modello ricerca (potente per analisi)
task-master models --set-research="anthropic/claude-3-haiku:beta" --openrouter

# Modello fallback (backup affidabile)
task-master models --set-fallback="meta-llama/llama-3.1-8b-instruct:free" --openrouter
```

### **STEP 3: VERIFICA CONFIGURAZIONE**

```bash
# Controllo stato modelli e API keys
task-master models
```

---

## 🔑 **API KEYS CONFIGURATION**

### **OPENROUTER API KEY**

```bash
# La chiave è già configurata in:
# 1. .env file (per CLI)
# 2. .cursor/mcp.json (per MCP)
OPENROUTER_API_KEY=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
```

### **VERIFICA API KEYS**

```bash
# Dovrebbe mostrare:
# Openrouter: ✅ Found (CLI) ✅ Found (MCP)
# Claude-code: ✅ Found (CLI) ✅ Found (MCP)
```

---

## 📁 **STRUTTURA FILES GENERATI**

### **RULE PROFILES INSTALLATI**

- **CLAUDE.md**: Integration guide per Claude
- **AGENTS.md**: Integration guide per Codex
- **.cursor/rules/**: 4 regole Cursor
- **.vscode/rules/**: 4 regole VS Code

### **CONFIGURAZIONI MCP**

- **.cursor/mcp.json**: Task Master MCP per Cursor
- **.vscode/mcp.json**: Task Master MCP per VS Code

---

## 🎯 **COMANDI OPERATIVI PRINCIPALI**

### **PARSING PRD E GENERAZIONE TASKS**

```bash
# Parse PRD e genera tasks iniziali
task-master parse-prd scripts/PRD.txt

# Analisi complessità tasks
task-master analyze-complexity

# Espansione tutti i tasks
task-master expand-all

# Ottieni prossimo task da lavorare
task-master next-task
```

### **GESTIONE TASKS**

```bash
# Lista tutti i tasks
task-master get-tasks

# Dettagli task specifico
task-master get-task --id=1

# Aggiungi nuovo task
task-master add-task --prompt="Descrizione task"

# Aggiorna status task
task-master set-task-status --id=1 --status=done

# Aggiorna task con nuove info
task-master update-task --id=1 --prompt="Nuove informazioni"
```

### **GESTIONE MODELLI**

```bash
# Lista modelli disponibili
task-master models

# Cambia modello principale
task-master models --set-main="NUOVO_MODELLO" --openrouter

# Setup interattivo modelli
task-master models --setup
```

---

## ⚠️ **TROUBLESHOOTING COMUNE**

### **PROBLEMA: API Key Missing in MCP**

```bash
# Verifica file .cursor/mcp.json contiene:
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "OPENROUTER_API_KEY": "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"
      }
    }
  }
}
```

### **PROBLEMA: Modello Non Trovato**

```bash
# Lista modelli disponibili su OpenRouter
task-master models --list-available-models

# Usa solo modelli dalla lista ufficiale
```

### **PROBLEMA: Shell Aliases Non Aggiunti**

```bash
# Aggiungi manualmente a .bashrc/.zshrc:
alias tm="task-master"
alias taskmaster="task-master"
```

---

## 🚀 **WORKFLOW COMPLETO STUDENT ANALYST**

### **1. SETUP INIZIALE** (Una volta sola)

```bash
cd D:\student-analyst
task-master init
# Segui setup interattivo
task-master models --set-main="google/gemma-2-9b-it:free" --openrouter
task-master models --set-research="anthropic/claude-3-haiku:beta" --openrouter
task-master models --set-fallback="meta-llama/llama-3.1-8b-instruct:free" --openrouter
task-master models  # Verifica configurazione
```

### **2. GENERAZIONE TASKS DA PRD**

```bash
task-master parse-prd scripts/PRD.txt
task-master analyze-complexity
task-master expand-all
```

### **3. WORKFLOW SVILUPPO**

```bash
task-master next-task                    # Ottieni prossimo task
task-master get-task --id=X             # Dettagli task specifico
# ... lavora sul task ...
task-master set-task-status --id=X --status=done
task-master update-task --id=Y --prompt="Aggiornamenti basati su task X"
```

---

## 📊 **CONFIGURAZIONE OTTIMALE ATTUALE**

### **VANTAGGI SETUP CORRENTE**

- **✅ Modelli Gratuiti**: Nessun costo per utilizzo base
- **✅ OpenRouter**: Accesso a modelli multipli con singola API key
- **✅ Claude Haiku**: Potente per ricerca e analisi
- **✅ Gemma 2**: Veloce e affidabile per tasks routine
- **✅ MCP Integration**: Funziona perfettamente con Cursor

### **ALTERNATIVE PREMIUM** (Opzionali)

```bash
# Per performance superiori (a pagamento):
task-master models --set-main="openai/o4-mini" --openrouter          # $1.10-$4.40
task-master models --set-research="perplexity/sonar-pro" --openrouter # $3-$15
task-master models --set-main="claude-code/sonnet"                    # FREE ma limitato
```

---

## 🔄 **RESET COMPLETO** (Se necessario)

### **PULIZIA CONFIGURAZIONE**

```bash
# Rimuovi configurazioni Task Master
rm -rf .taskmaster/
rm .env.example
rm CLAUDE.md AGENTS.md

# Re-inizializzazione completa
task-master init
# Ripeti setup modelli
```

### **BACKUP CONFIGURAZIONE**

```bash
# Backup files importanti
cp .cursor/mcp.json .cursor/mcp.json.backup
cp .vscode/mcp.json .vscode/mcp.json.backup
cp .taskmaster/config.json .taskmaster/config.json.backup
```

---

## 📝 **NOTE FINALI**

### **COMANDI RAPIDI QUOTIDIANI**

```bash
tm models                    # Verifica configurazione
tm next-task                 # Prossimo task da fare
tm get-tasks --status=pending # Tasks pendenti
tm add-task --prompt="..."   # Aggiungi task veloce
```

### **INTEGRAZIONE CURSOR**

- Task Master è configurato come MCP tool in Cursor
- Usa comandi Cursor Agent per interazione naturale
- Tutti i comandi CLI sono disponibili anche via MCP

### **PERFORMANCE TIPS**

- Usa `--research` flag per tasks complessi
- Configura `--num` per controllare numero subtasks
- Usa `--force` per rigenerare tasks esistenti

**🎯 CONFIGURAZIONE COMPLETA E OTTIMIZZATA PER STUDENT ANALYST!** 🚀
