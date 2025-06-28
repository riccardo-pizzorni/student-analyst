# 🤖 Guida per AI Assistant - Student Analyst

## Regole e Pattern per Sviluppo AI

---

## 🎯 Obiettivo

Questo documento fornisce linee guida specifiche per AI che lavorano sul progetto Student Analyst, basate sui fix critici del 2024-12-19.

---

## 🚨 Regole Assolute

### **1. TypeScript Type Safety**

```typescript
// ❌ MAI fare questo
const data: any = response.json();
const mock: any = jest.fn();

// ✅ SEMPRE fare questo
interface ApiResponse {
  data: unknown;
  status: number;
}
const data: ApiResponse = response.json();

interface MockFunction {
  (): Promise<Data>;
}
const mock: MockFunction = jest.fn().mockResolvedValue(mockData);
```

### **2. Backend Port Configuration**

```javascript
// ❌ MAI usare porta 3001
const PORT = 3001;

// ✅ SEMPRE usare porta 10000
const PORT = process.env.PORT || 10000;
```

### **3. Formattazione Automatica**

```bash
# ❌ MAI formattare manualmente
# ✅ SEMPRE usare Prettier
npm run format
npm run format:check
```

---

## 🔧 Pattern di Sviluppo

### **Creazione di Nuovi Componenti**

```typescript
// 1. Definire interfacce
interface ComponentProps {
  title: string;
  data: unknown;
  onAction?: () => void;
}

// 2. Tipizzare correttamente
const Component: React.FC<ComponentProps> = ({ title, data, onAction }) => {
  // Implementazione
};

// 3. Esportare con tipo
export default Component;
```

### **Creazione di Mock per Test**

```typescript
// 1. Definire interfacce per il servizio
interface UserService {
  getUser: (id: string) => Promise<User>;
  createUser: (user: CreateUserRequest) => Promise<User>;
}

// 2. Creare mock tipizzati
const mockUserService: UserService = {
  getUser: jest.fn().mockResolvedValue(mockUser),
  createUser: jest.fn().mockResolvedValue(newUser),
};

// 3. Usare nei test
describe('UserComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
});
```

### **Gestione Errori TypeScript**

```typescript
// 1. Per dati sconosciuti
const handleUnknownData = (data: unknown) => {
  if (typeof data === 'object' && data !== null) {
    // Type guard per sicurezza
    return processData(data as Record<string, unknown>);
  }
  throw new Error('Invalid data format');
};

// 2. Per API responses
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

const fetchData = async (): Promise<ApiResponse<User[]>> => {
  const response = await fetch('/api/users');
  return response.json();
};
```

### **4. Gestione Stato Globale con Context**

- **Quando usarlo**: Quando i dati devono essere persistenti tra le pagine o condivisi tra componenti non direttamente collegati.
- **Esempio**: `src/context/AnalysisContext.tsx`
- **Pattern**:

  ```typescript
  // 1. Usa l'hook del contesto nel componente
  import { useAnalysis } from '@/context/AnalysisContext';

  const MyComponent = () => {
    const { analysisState, setTickers } = useAnalysis();

    // Usa analysisState per leggere i dati
    // Usa setTickers per aggiornare lo stato
  };
  ```

---

## 🧪 Testing Patterns

### **Unit Test Structure**

```typescript
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';

// 1. Definire interfacce per mock
interface MockService {
  getData: jest.Mock<Promise<Data[]>, []>;
}

// 2. Creare mock tipizzati
const mockService: MockService = {
  getData: jest.fn().mockResolvedValue(mockData)
};

// 3. Test con setup/teardown
describe('Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render correctly', () => {
    render(<Component service={mockService} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### **Backend Test Patterns**

```javascript
// 1. Test endpoint con porta corretta
const testEndpoint = async () => {
  const response = await fetch('http://localhost:10000/api/health');
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.status).toBe('OK');
};

// 2. Test con setup server
describe('Backend API', () => {
  let server;

  beforeAll(async () => {
    server = await startServer(10000);
  });

  afterAll(async () => {
    await server.close();
  });

  it('should respond to health check', testEndpoint);
});
```

---

## 🔍 Code Review Checklist per AI

### **Prima di Proporre Modifiche**

- [ ] **TypeScript**: Nessun `any`, interfacce definite
- [ ] **Formattazione**: Codice formattato con Prettier
- [ ] **Porte**: Backend usa porta 10000
- [ ] **Test**: Mock tipizzati correttamente
- [ ] **Errori**: ESLint passa senza errori

### **Verifica Automatica**

```bash
# Esegui sempre questi comandi
npm run lint          # Verifica TypeScript
npm run format:check  # Verifica formattazione
npm test             # Verifica test
npm run build        # Verifica build
```

---

## 🚨 Errori Comuni da Evitare

### **1. Uso di `any` in TypeScript**

```typescript
// ❌ ERRORE: Uso di any
const processData = (data: any) => {
  return data.map(item => item.name);
};

// ✅ CORRETTO: Tipi specifici
interface DataItem {
  name: string;
  id: string;
}

const processData = (data: DataItem[]) => {
  return data.map(item => item.name);
};
```

### **2. Mock Non Tipizzati**

```typescript
// ❌ ERRORE: Mock senza tipi
const mockService = {
  getData: jest.fn().mockReturnValue([]),
};

// ✅ CORRETTO: Mock tipizzati
interface MockService {
  getData: jest.Mock<Promise<Data[]>, []>;
}

const mockService: MockService = {
  getData: jest.fn().mockResolvedValue([]),
};
```

### **3. Configurazione Porte Inconsistente**

```javascript
// ❌ ERRORE: Porte diverse
const PORT = 3001; // Se il server usa 10000

// ✅ CORRETTO: Porte coerenti
const PORT = 10000; // Stesso valore ovunque
```

### **4. Formattazione Manuale**

```typescript
// ❌ ERRORE: Formattazione inconsistente
const data = { name: 'test', value: 123 };

// ✅ CORRETTO: Formattazione automatica
const data = { name: 'test', value: 123 };
```

### **5. Error Handling**

```typescript
// Gestire errori con tipi specifici
interface ApiError {
  message: string;
  code: number;
}

const handleApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return { message: error.message, code: 500 };
  }
  return { message: 'Unknown error', code: 500 };
};
```

---

## 🔧 Comandi Essenziali

### **Sviluppo**

```bash
# Verifica stato progetto
npm run lint              # TypeScript errors
npm run format:check      # Formattazione
npm test                  # Unit tests
npm run test:backend      # Backend tests
npm run test:e2e          # E2E tests
```

### **Correzione**

```bash
# Correggi automaticamente
npm run lint:fix          # Fix ESLint errors
npm run format            # Format con Prettier
```

### **Build e Deploy**

```bash
# Build
npm run build             # Build frontend
cd backend && npm run build  # Build backend

# Deploy
npm run deploy            # Deploy completo
```

---

## 📚 Riferimenti Critici

### **File di Configurazione**

- `.prettierrc` - Regole formattazione
- `.eslintrc.js` - Regole TypeScript
- `tsconfig.json` - Configurazione TypeScript
- `package.json` - Scripts e dipendenze

### **Documentazione**

- `docs/PRETTIER_INTEGRATION_AND_TYPE_SAFETY_FIXES.md` - Fix dettagliati
- `docs/CRITICAL_FIXES_SUMMARY.md` - Riassunto esecutivo
- `docs/DEVELOPMENT_WORKFLOW.md` - Workflow completo

### **Test Files**

- `tests/unit/` - Test unitari
- `tests/e2e/` - Test end-to-end
- `backend/scripts/` - Script test backend

---

## 🎯 Best Practices per AI

### **1. Sempre Definire Interfacce**

```typescript
// Prima di scrivere codice, definire sempre le interfacce
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserService {
  getUser: (id: string) => Promise<User>;
  createUser: (user: Omit<User, 'id'>) => Promise<User>;
}
```

### **2. Usare Type Guards**

```typescript
// Per dati sconosciuti, usare type guards
const isValidUser = (data: unknown): data is User => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  );
};
```

### **3. Mock Tipizzati**

```typescript
// Sempre tipizzare i mock Jest
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
mockFetch.mockResolvedValue({
  json: () => Promise.resolve(mockData),
  status: 200,
} as Response);
```

### **4. Error Handling**

```typescript
// Gestire errori con tipi specifici
interface ApiError {
  message: string;
  code: number;
}

const handleApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return { message: error.message, code: 500 };
  }
  return { message: 'Unknown error', code: 500 };
};
```

### **5. Gestione Stato Globale con Context**

- **Quando usarlo**: Quando i dati devono essere persistenti tra le pagine o condivisi tra componenti non direttamente collegati.
- **Esempio**: `src/context/AnalysisContext.tsx`
- **Pattern**:

  ```typescript
  // 1. Usa l'hook del contesto nel componente
  import { useAnalysis } from '@/context/AnalysisContext';

  const MyComponent = () => {
    const { analysisState, setTickers } = useAnalysis();

    // Usa analysisState per leggere i dati
    // Usa setTickers per aggiornare lo stato
  };
  ```

---

## 🚨 Emergency Procedures

### **Se il Codice Non Compila**

```bash
# 1. Verifica errori TypeScript
npm run lint

# 2. Correggi automaticamente
npm run lint:fix

# 3. Verifica formattazione
npm run format:check

# 4. Formatta se necessario
npm run format
```

### **Se i Test Falliscono**

```bash
# 1. Verifica backend
cd backend && npm run test:backend

# 2. Verifica frontend
npm test

# 3. Verifica E2E
npm run test:e2e
```

### **Se il Build Fallisce**

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Verifica dipendenze
npm audit

# 3. Build step by step
npm run build
```

---

**⚠️ IMPORTANTE**: Queste regole sono basate su errori reali risolti. Seguirle è fondamentale per evitare regressioni.
