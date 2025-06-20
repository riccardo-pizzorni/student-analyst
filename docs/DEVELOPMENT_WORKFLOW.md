# 🔄 Workflow di Sviluppo - Student Analyst

## Guida Completa per Sviluppatori e AI

---

## 🎯 Obiettivo

Questo documento definisce il workflow standardizzato per evitare errori e mantenere la qualità del codice.

---

## 📋 Setup Iniziale

### **1. Installazione Dipendenze**

```bash
npm install
cd backend && npm install
```

### **2. Verifica Configurazione**

```bash
# Verifica TypeScript
npm run lint

# Verifica formattazione
npm run format:check

# Verifica test
npm test
```

### **3. Configurazione VS Code**

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

---

## 🔄 Workflow di Sviluppo

### **Fase 1: Preparazione**

```bash
# 1. Pull ultime modifiche
git pull origin main

# 2. Verifica stato progetto
npm run lint
npm run format:check
npm test
```

### **Fase 2: Sviluppo**

```bash
# 1. Crea branch
git checkout -b feature/nome-feature

# 2. Sviluppa con controlli continui
npm run lint          # Ogni 5-10 minuti
npm run format:check  # Prima di ogni commit
```

### **Fase 3: Pre-Commit**

```bash
# 1. Formattazione automatica
npm run format

# 2. Correzione errori ESLint
npm run lint:fix

# 3. Test completi
npm test
npm run test:backend
npm run test:e2e
```

### **Fase 4: Commit e Push**

```bash
# 1. Commit con messaggio descrittivo
git commit -m "feat: aggiungi nuova funzionalità X"

# 2. Push e crea PR
git push origin feature/nome-feature
```

---

## 🚨 Controlli Critici

### **TypeScript Safety**

```typescript
// ✅ SEMPRE: Definire interfacce
interface UserData {
  id: string;
  name: string;
  email: string;
}

// ✅ SEMPRE: Tipizzare mock
const mockUserService: UserService = {
  getUser: jest.fn().mockResolvedValue(mockUser),
};

// ❌ MAI: Usare any
const data: any = response.json();
```

### **Backend Configuration**

```javascript
// ✅ SEMPRE: Porta coerente
const PORT = process.env.PORT || 10000;

// ✅ SEMPRE: Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});
```

### **Formattazione**

```bash
# ✅ SEMPRE: Formattazione automatica
npm run format

# ✅ SEMPRE: Verifica prima del commit
npm run format:check
```

### **Gestione dello Stato Globale**

- Per funzionalità che richiedono la condivisione di stato tra più componenti (come i dati del form di analisi), utilizzare il contesto React.
- **Contesto Esistente**: `src/context/AnalysisContext.tsx` gestisce lo stato del form di input.
- **Pattern**:
  1.  Identificare la necessità di uno stato globale.
  2.  Creare un nuovo file di contesto in `src/context/`.
  3.  Definire stato, azioni e provider.
  4.  Avvolgere l'applicazione (o la parte rilevante) nel provider in `App.tsx`.
  5.  Usare l'hook custom (`useMyContext`) nei componenti necessari.

---

## 🧪 Testing Strategy

### **Unit Tests**

```bash
# Esegui tutti i test unitari
npm test

# Esegui test specifici
npm test -- --testNamePattern="CacheService"

# Coverage
npm test -- --coverage
```

### **Backend Tests**

```bash
# Test completi backend
cd backend
npm run test:backend

# Test specifici
npm test -- --testNamePattern="API Routes"
```

### **E2E Tests**

```bash
# Test end-to-end
npm run test:e2e

# Test specifici browser
npm run test:e2e -- --project=chromium
```

---

## 🔧 Troubleshooting

### **Errori TypeScript**

```bash
# 1. Verifica errori
npm run lint

# 2. Correggi automaticamente
npm run lint:fix

# 3. Verifica tipi
npx tsc --noEmit
```

### **Errori di Formattazione**

```bash
# 1. Verifica formattazione
npm run format:check

# 2. Formatta automaticamente
npm run format

# 3. Verifica di nuovo
npm run format:check
```

### **Errori Backend**

```bash
# 1. Verifica porta
lsof -i :10000

# 2. Riavvia server
cd backend
npm run dev

# 3. Test health
curl http://localhost:10000/health
```

---

## 📊 Metriche di Qualità

### **Type Safety**

- **Target**: 100% type coverage
- **Check**: `npm run lint` → 0 errori
- **Tool**: ESLint + TypeScript

### **Formattazione**

- **Target**: 100% consistent
- **Check**: `npm run format:check` → 0 errori
- **Tool**: Prettier

### **Test Coverage**

- **Target**: >80% coverage
- **Check**: `npm test -- --coverage`
- **Tool**: Jest

### **Performance**

- **Target**: Build <30s
- **Check**: `npm run build`
- **Tool**: Vite

---

## 🚀 CI/CD Pipeline

### **GitHub Actions Workflow**

```yaml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Lint and format check
        run: |
          npm run lint
          npm run format:check

      - name: Run tests
        run: |
          npm test
          npm run test:backend
          npm run test:e2e

      - name: Build
        run: npm run build
```

---

## 📚 Best Practices

### **Commit Messages**

```bash
# ✅ Buoni esempi
git commit -m "feat: aggiungi autenticazione OAuth"
git commit -m "fix: risolvi errore porta backend"
git commit -m "docs: aggiorna README"
git commit -m "test: aggiungi test per CacheService"

# ❌ Cattivi esempi
git commit -m "fix"
git commit -m "update"
git commit -m "stuff"
```

### **Branch Naming**

```bash
# ✅ Buoni esempi
feature/user-authentication
fix/backend-port-issue
docs/api-documentation
test/cache-coverage

# ❌ Cattivi esempi
feature1
fix
update
```

### **Code Review Checklist**

- [ ] Codice formattato correttamente
- [ ] Nessun errore TypeScript
- [ ] Test passano
- [ ] Documentazione aggiornata
- [ ] Performance accettabile

---

## 🔄 Automazione

### **Pre-commit Hooks (Raccomandato)**

```bash
# Installa husky
npm install --save-dev husky

# Configura pre-commit
npx husky add .husky/pre-commit "npm run lint && npm run format:check && npm test"
```

### **VS Code Extensions**

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss"
  ]
}
```

---

## 📞 Supporto

### **Documentazione Correlata**

- `docs/PRETTIER_INTEGRATION_AND_TYPE_SAFETY_FIXES.md` - Fix dettagliati
- `docs/CRITICAL_FIXES_SUMMARY.md` - Riassunto esecutivo
- `docs/TESTING_GUIDE.md` - Guida ai test

### **Comandi di Emergenza**

```bash
# Reset completo
git reset --hard HEAD
npm ci
npm run format
npm run lint:fix

# Verifica stato
npm run lint
npm run format:check
npm test
npm run build
```

---

**⚠️ IMPORTANTE**: Seguire sempre questo workflow per evitare regressioni e mantenere la qualità del codice.
