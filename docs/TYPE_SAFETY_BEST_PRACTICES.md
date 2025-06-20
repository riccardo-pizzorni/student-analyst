# Type Safety Best Practices

## 🎯 Obiettivo: Zero "any" nella Codebase

Questo documento descrive le best practices implementate per mantenere la massima type safety nel progetto Student Analyst, eliminando completamente l'uso di `any` esplicito.

## ✅ Regole Fondamentali

### 1. **Mai usare `any` esplicito**

```typescript
// ❌ SBAGLIATO
const data: any = getData();
const result = (service as any).method();

// ✅ CORRETTO
const data: unknown = getData();
const result = (service as unknown).method();
```

### 2. **Preferire `unknown` quando il tipo non è chiaro**

```typescript
// ❌ SBAGLIATO
function processData(data: any): any {
  return data.process();
}

// ✅ CORRETTO
function processData(data: unknown): unknown {
  if (typeof data === 'object' && data !== null && 'process' in data) {
    return (data as { process(): unknown }).process();
  }
  return null;
}
```

### 3. **Usare interfacce specifiche per i mock**

```typescript
// ❌ SBAGLIATO
const mockService: any = {
  get: jest.fn(),
  set: jest.fn(),
};

// ✅ CORRETTO
interface ICacheService {
  get(key: string): unknown;
  set(key: string, value: unknown): boolean;
}

const mockService = mockDeep<ICacheService>();
```

## 🧪 Best Practices per i Test

### 1. **jest-mock-extended per mock tipizzati**

```typescript
import { mockDeep } from 'jest-mock-extended';

// Definire interfacce per i servizi
interface IUserService {
  getUser(id: string): Promise<User>;
  createUser(user: User): Promise<User>;
}

// Creare mock tipizzati
const mockUserService = mockDeep<IUserService>();
```

### 2. **Mock Functions con tipi specifici**

```typescript
// ❌ SBAGLIATO
const mockFn = jest.fn() as any;

// ✅ CORRETTO
const mockFn = jest.fn<number, [string, number]>(
  (str, num) => str.length + num
);
```

### 3. **Record<string, unknown> per oggetti dinamici**

```typescript
// ❌ SBAGLIATO
const config: any = { key: 'value' };

// ✅ CORRETTO
const config: Record<string, unknown> = { key: 'value' };
```

## 🔧 Strategie di Refactoring

### 1. **Sostituzione graduale**

1. Identificare tutti gli usi di `any`
2. Sostituire con `unknown` come primo passo
3. Aggiungere type guards dove necessario
4. Definire interfacce specifiche

### 2. **Type Guards per `unknown`**

```typescript
function isUserData(data: unknown): data is User {
  return (
    typeof data === 'object' && data !== null && 'id' in data && 'name' in data
  );
}

function processUserData(data: unknown): User | null {
  if (isUserData(data)) {
    return data; // TypeScript ora sa che è User
  }
  return null;
}
```

### 3. **Interfacce per strutture dati complesse**

```typescript
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  currentEntries: number;
  memoryUsage?: number;
  size?: number;
}

interface ICacheService {
  get(key: string): unknown;
  set(key: string, value: unknown, ttl?: number): boolean;
  getStats(): CacheStats;
  clear(): void;
}
```

## 📋 Checklist per Code Review

### ✅ Prima di ogni commit:

- [ ] Nessun `any` esplicito nel codice
- [ ] Tutti i mock sono tipizzati
- [ ] Le funzioni con `unknown` hanno type guards
- [ ] Le interfacce sono definite per strutture complesse
- [ ] ESLint non segnala errori "no-explicit-any"

### ✅ Per i test:

- [ ] Uso di `jest-mock-extended` per mock complessi
- [ ] Mock functions con tipi specifici
- [ ] `Record<string, unknown>` per oggetti dinamici
- [ ] `as unknown` invece di `as any`

## 🚀 Configurazione ESLint

### Regola obbligatoria nel progetto:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### CI/CD Integration:

```yaml
# .github/workflows/type-check.yml
- name: Type Check
  run: |
    npm run lint
    npx tsc --noEmit
```

## 📚 Risorse Utili

### Librerie Consigliate:

- **jest-mock-extended**: Per mock tipizzati nei test
- **zod**: Per runtime type validation
- **io-ts**: Per type-safe data parsing

### Documentazione:

- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [jest-mock-extended Documentation](https://github.com/marchaos/jest-mock-extended)

## 🎉 Benefici Ottenuti

1. **Type Safety Completa**: Zero errori di tipo a runtime
2. **IntelliSense Migliorato**: Autocompletamento e refactoring sicuri
3. **Errori a Compile Time**: Rilevamento precoce di problemi
4. **Manutenibilità**: Codice più leggibile e manutenibile
5. **Conformità**: Zero violazioni ESLint "no-explicit-any"

## 🔄 Mantenimento

### Monitoraggio Continuo:

- Eseguire `npm run lint` prima di ogni commit
- Verificare `npx tsc --noEmit` regolarmente
- Code review focalizzata sulla type safety
- Aggiornare le interfacce quando necessario

### Training del Team:

- Condividere questo documento con tutti i developer
- Organizzare sessioni di training su TypeScript avanzato
- Implementare pair programming per code review

---

**Ricorda**: La type safety non è un obiettivo, è un processo continuo. Mantieni sempre alta l'attenzione sulla qualità del codice! 🚀
