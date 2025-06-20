import { beforeEach, describe, expect, it } from '@jest/globals';
import { IndexedDBCacheL3 } from '../../src/services/IndexedDBCacheL3';

const STORE_NAME = 'cache';

class MockEvent implements Event {
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly composed: boolean;
  readonly currentTarget: EventTarget | null;
  readonly defaultPrevented: boolean;
  readonly eventPhase: number;
  readonly isTrusted: boolean;
  readonly returnValue: boolean;
  readonly srcElement: EventTarget | null;
  readonly target: EventTarget | null;
  readonly timeStamp: number;
  readonly type: string;
  readonly AT_TARGET = 2 as const;
  readonly BUBBLING_PHASE = 3 as const;
  readonly CAPTURING_PHASE = 1 as const;
  readonly NONE = 0 as const;
  cancelBubble: boolean;

  constructor(type: string, eventInitDict?: EventInit) {
    this.type = type;
    this.bubbles = eventInitDict?.bubbles || false;
    this.cancelable = eventInitDict?.cancelable || false;
    this.composed = eventInitDict?.composed || false;
    this.currentTarget = null;
    this.defaultPrevented = false;
    this.eventPhase = this.NONE;
    this.isTrusted = true;
    this.returnValue = true;
    this.srcElement = null;
    this.target = null;
    this.timeStamp = Date.now();
    this.cancelBubble = false;
  }

  composedPath(): EventTarget[] {
    return [];
  }

  initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void {
    // No-op
  }

  preventDefault(): void {
    // No-op
  }

  stopImmediatePropagation(): void {
    // No-op
  }

  stopPropagation(): void {
    // No-op
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    // No-op
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    // No-op
  }

  dispatchEvent(event: Event): boolean {
    return true;
  }
}

class MockIDBVersionChangeEvent extends MockEvent implements IDBVersionChangeEvent {
  readonly oldVersion: number;
  readonly newVersion: number | null;

  constructor(type: string, eventInitDict?: IDBVersionChangeEventInit) {
    super(type, eventInitDict);
    this.oldVersion = eventInitDict?.oldVersion || 0;
    this.newVersion = eventInitDict?.newVersion || null;
  }
}

class MockIDBRequest implements IDBRequest<Record<string, unknown>> {
  result: Record<string, unknown>;
  error: DOMException | null;
  source: IDBObjectStore | IDBIndex | IDBCursor;
  transaction: IDBTransaction | null;
  readyState: IDBRequestReadyState;
  onsuccess: ((this: IDBRequest<Record<string, unknown>>, ev: Event) => void) | null;
  onerror: ((this: IDBRequest<Record<string, unknown>>, ev: Event) => void) | null;

  constructor() {
    this.result = {} as Record<string, unknown>;
    this.error = null;
    this.source = {} as IDBObjectStore;
    this.transaction = null;
    this.readyState = 'pending';
    this.onsuccess = null;
    this.onerror = null;
  }

  setResult(result: Record<string, unknown>): void {
    this.result = result;
    this.readyState = 'done';
    if (this.onsuccess) {
      this.onsuccess.call(this, new MockEvent('success'));
    }
  }

  setError(error: DOMException): void {
    this.error = error;
    this.readyState = 'done';
    if (this.onerror) {
      this.onerror.call(this, new MockEvent('error'));
    }
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    // No-op
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    // No-op
  }

  dispatchEvent(event: Event): boolean {
    return true;
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest implements IDBOpenDBRequest {
  onblocked: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => void) | null;
  onupgradeneeded: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => void) | null;

  constructor() {
    super();
    this.onblocked = null;
    this.onupgradeneeded = null;
    this.result = {} as IDBDatabase;
  }

  setResult(result: IDBDatabase): void {
    super.setResult(result);
  }

  setError(error: DOMException): void {
    super.setError(error);
  }
}

class MockIndex implements IDBIndex {
  readonly name: string;
  readonly keyPath: string | string[];
  readonly multiEntry: boolean;
  readonly unique: boolean;
  readonly objectStore: IDBObjectStore;

  constructor(name: string, keyPath: string | string[], options: IDBIndexParameters, objectStore: IDBObjectStore) {
    this.name = name;
    this.keyPath = keyPath;
    this.multiEntry = options.multiEntry || false;
    this.unique = options.unique || false;
    this.objectStore = objectStore;
  }

  get(key: IDBValidKey | IDBKeyRange): IDBRequest<Record<string, unknown> | undefined> {
    const request = new MockIDBRequest();
    const result = (this.objectStore as MockObjectStore).data.find(item => {
      const keyValue = this.getKeyValue(item);
      return keyValue === key;
    });
    request.setResult(result);
    return request;
  }

  getKey(key: IDBValidKey | IDBKeyRange): IDBRequest<IDBValidKey | undefined> {
    const request = new MockIDBRequest();
    const item = (this.objectStore as MockObjectStore).data.find(item => {
      const keyValue = this.getKeyValue(item);
      return keyValue === key;
    });
    request.setResult(item ? this.getKeyValue(item) : undefined);
    return request;
  }

  getAll(query?: IDBValidKey | IDBKeyRange | null, count?: number): IDBRequest<Record<string, unknown>[]> {
    const request = new MockIDBRequest();
    const results = (this.objectStore as MockObjectStore).data.filter(item => {
      const keyValue = this.getKeyValue(item);
      return query ? keyValue === query : true;
    });
    request.setResult(count ? results.slice(0, count) : results);
    return request;
  }

  getAllKeys(query?: IDBValidKey | IDBKeyRange | null, count?: number): IDBRequest<IDBValidKey[]> {
    const request = new MockIDBRequest();
    const keys = (this.objectStore as MockObjectStore).data.map(item => this.getKeyValue(item));
    const results = query ? keys.filter(key => key === query) : keys;
    request.setResult(count ? results.slice(0, count) : results);
    return request;
  }

  count(key?: IDBValidKey | IDBKeyRange): IDBRequest<number> {
    const request = new MockIDBRequest();
    const count = (this.objectStore as MockObjectStore).data.filter(item => {
      const keyValue = this.getKeyValue(item);
      return key ? keyValue === key : true;
    }).length;
    request.setResult(count);
    return request;
  }

  openCursor(range?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest<IDBCursorWithValue | null> {
    const request = new MockIDBRequest();
    request.setResult(null);
    return request;
  }

  openKeyCursor(range?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest<IDBCursor | null> {
    const request = new MockIDBRequest();
    request.setResult(null);
    return request;
  }

  private getKeyValue(item: Record<string, unknown>): IDBValidKey {
    if (typeof this.keyPath === 'string') {
      return item[this.keyPath] as IDBValidKey;
    }
    return this.keyPath.map(path => item[path]) as IDBValidKey;
  }
}

class MockObjectStore implements IDBObjectStore {
  readonly name: string;
  readonly keyPath: string | string[];
  readonly autoIncrement: boolean;
  readonly indexes: Map<string, MockIndex>;
  data: Record<string, unknown>[];
  indexNames: DOMStringList;
  readonly transaction: IDBTransaction;

  constructor(name: string, options: IDBObjectStoreParameters, transaction: IDBTransaction) {
    this.name = name;
    this.keyPath = options.keyPath || 'key';
    this.autoIncrement = options.autoIncrement || false;
    this.indexes = new Map();
    this.data = [];
    this.indexNames = new MockDOMStringList([]);
    this.transaction = transaction;
  }

  createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): IDBIndex {
    if (this.indexes.has(name)) {
      throw new DOMException(`Index ${name} already exists`, 'ConstraintError');
    }
    const index = new MockIndex(name, keyPath, options || {}, this);
    this.indexes.set(name, index);
    this.indexNames = new MockDOMStringList(Array.from(this.indexes.keys()));
    return index;
  }

  deleteIndex(name: string): void {
    if (!this.indexes.has(name)) {
      throw new DOMException(`Index ${name} not found`, 'NotFoundError');
    }
    this.indexes.delete(name);
    this.indexNames = new MockDOMStringList(Array.from(this.indexes.keys()));
  }

  index(name: string): IDBIndex {
    const index = this.indexes.get(name);
    if (!index) {
      throw new DOMException(`Index ${name} not found`, 'NotFoundError');
    }
    return index;
  }

  get(key: IDBValidKey | IDBKeyRange): IDBRequest<Record<string, unknown> | undefined> {
    const request = new MockIDBRequest();
    const result = this.data.find(item => {
      if (typeof this.keyPath === 'string') {
        return item[this.keyPath] === key;
      }
      return (this.keyPath as string[]).some(path => item[path] === key);
    });
    request.setResult(result);
    return request;
  }

  put(value: Record<string, unknown>): IDBRequest<Record<string, unknown>> {
    const request = new MockIDBRequest();
    this.data.push(value);
    request.setResult(value);
    return request;
  }

  add(value: Record<string, unknown>, key?: IDBValidKey): IDBRequest<Record<string, unknown>> {
    const request = new MockIDBRequest();
    this.data.push(value);
    request.setResult(value);
    return request;
  }

  clear(): IDBRequest<undefined> {
    const request = new MockIDBRequest();
    this.data = [];
    request.setResult(undefined);
    return request;
  }

  count(key?: IDBValidKey | IDBKeyRange): IDBRequest<number> {
    const request = new MockIDBRequest();
    const count = key ? this.data.filter(item => this.getKeyValue(item) === key).length : this.data.length;
    request.setResult(count);
    return request;
  }

  delete(key: IDBValidKey | IDBKeyRange): IDBRequest<undefined> {
    const request = new MockIDBRequest();
    const index = this.data.findIndex(item => this.getKeyValue(item) === key);
    if (index >= 0) {
      this.data.splice(index, 1);
    }
    request.setResult(undefined);
    return request;
  }

  getAll(query?: IDBValidKey | IDBKeyRange | null, count?: number): IDBRequest<Record<string, unknown>[]> {
    const request = new MockIDBRequest();
    const results = this.data.filter(item => {
      if (!query) return true;
      if (typeof this.keyPath === 'string') {
        return item[this.keyPath] === query;
      }
      return (this.keyPath as string[]).some(path => item[path] === query);
    });
    request.setResult(count ? results.slice(0, count) : results);
    return request;
  }

  getAllKeys(query?: IDBValidKey | IDBKeyRange | null, count?: number): IDBRequest<IDBValidKey[]> {
    const request = new MockIDBRequest();
    const keys = this.data.map(item => {
      if (typeof this.keyPath === 'string') {
        return item[this.keyPath];
      }
      return (this.keyPath as string[]).map(path => item[path]);
    });
    const results = query ? keys.filter(key => key === query) : keys;
    request.setResult(count ? results.slice(0, count) : results);
    return request;
  }

  getKey(query: IDBValidKey | IDBKeyRange): IDBRequest<any> {
    const request = new MockIDBRequest();
    const item = this.data.find(item => this.getKeyValue(item) === query);
    request.setResult(item ? this.getKeyValue(item) : undefined);
    return request;
  }

  openCursor(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest<IDBCursorWithValue | null> {
    const request = new MockIDBRequest();
    request.setResult(null);
    return request;
  }

  openKeyCursor(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): IDBRequest<IDBCursor | null> {
    const request = new MockIDBRequest<IDBCursor | null>();
    request.setResult(null);
    return request;
  }

  private getKeyValue(item: T): IDBValidKey {
    if (typeof this.keyPath === 'string') {
      return item[this.keyPath] as IDBValidKey;
    }
    return this.keyPath.map(path => item[path]) as IDBValidKey;
  }
}

class MockDOMStringList implements DOMStringList {
  private _items: string[];

  constructor(items: string[]) {
    this._items = items;
  }

  get length(): number {
    return this._items.length;
  }

  item(index: number): string | null {
    return index >= 0 && index < this._items.length ? this._items[index] : null;
  }

  contains(string: string): boolean {
    return this._items.includes(string);
  }

  [index: number]: string;

  [Symbol.iterator](): ArrayIterator<string> {
    return Array.prototype[Symbol.iterator].call(this._items);
  }
}

class MockTransaction implements IDBTransaction {
  readonly objectStoreNames: DOMStringList;
  readonly mode: IDBTransactionMode;
  readonly db: IDBDatabase;
  readonly error: DOMException | null;
  readonly durability: IDBTransactionDurability;
  onabort: ((this: IDBTransaction, ev: Event) => any) | null;
  oncomplete: ((this: IDBTransaction, ev: Event) => any) | null;
  onerror: ((this: IDBTransaction, ev: Event) => any) | null;
  private objectStores: Map<string, MockObjectStore<T>>;

  constructor(storeNames: string | string[] | Iterable<string>, mode: IDBTransactionMode, db: IDBDatabase) {
    const names = Array.isArray(storeNames) ? storeNames : typeof storeNames === 'string' ? [storeNames] : Array.from(storeNames);
    this.objectStoreNames = new MockDOMStringList(names);
    this.mode = mode;
    this.db = db;
    this.error = null;
    this.durability = 'default';
    this.onabort = null;
    this.oncomplete = null;
    this.onerror = null;
    this.objectStores = new Map();

    const mockDb = db as MockDatabase;
    for (const storeName of names) {
      const store = mockDb.objectStores.get(storeName);
      if (store) {
        this.objectStores.set(storeName, store);
      }
    }
  }

  objectStore(name: string): IDBObjectStore {
    const store = this.objectStores.get(name);
    if (!store) {
      throw new DOMException(`Object store ${name} not found`, 'NotFoundError');
    }
    return store;
  }

  abort(): void {
    if (this.onabort) {
      this.onabort.call(this, new MockEvent('abort'));
    }
  }

  commit(): void {
    if (this.oncomplete) {
      this.oncomplete.call(this, new MockEvent('complete'));
    }
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    // No-op
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    // No-op
  }

  dispatchEvent(event: Event): boolean {
    return true;
  }
}

class MockDatabase implements IDBDatabase {
  readonly name: string;
  readonly version: number;
  objectStoreNames: DOMStringList;
  onabort: ((this: IDBDatabase, ev: Event) => any) | null;
  onclose: ((this: IDBDatabase, ev: Event) => any) | null;
  onerror: ((this: IDBDatabase, ev: Event) => any) | null;
  onversionchange: ((this: IDBDatabase, ev: IDBVersionChangeEvent) => any) | null;
  objectStores: Map<string, MockObjectStore<T>>;

  constructor(name: string, version: number) {
    this.name = name;
    this.version = version;
    this.objectStoreNames = new MockDOMStringList([]);
    this.onabort = null;
    this.onclose = null;
    this.onerror = null;
    this.onversionchange = null;
    this.objectStores = new Map();
  }

  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore {
    if (this.objectStores.has(name)) {
      throw new DOMException(`Object store ${name} already exists`, 'ConstraintError');
    }
    const transaction = new MockTransaction([name], 'readwrite', this);
    const store = new MockObjectStore<Record<string, unknown>>(name, options || {}, transaction);
    this.objectStores.set(name, store);
    this.objectStoreNames = new MockDOMStringList(Array.from(this.objectStores.keys()));
    return store;
  }

  deleteObjectStore(name: string): void {
    if (!this.objectStores.has(name)) {
      throw new DOMException(`Object store ${name} not found`, 'NotFoundError');
    }
    this.objectStores.delete(name);
    this.objectStoreNames = new MockDOMStringList(Array.from(this.objectStores.keys()));
  }

  transaction(storeNames: string | string[] | Iterable<string>, mode?: IDBTransactionMode): IDBTransaction {
    return new MockTransaction(storeNames, mode || 'readonly', this);
  }

  close(): void {
    if (this.onclose) {
      this.onclose.call(this, new MockEvent('close'));
    }
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    // No-op
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    // No-op
  }

  dispatchEvent(event: Event): boolean {
    return true;
  }
}

class MockIndexedDB implements IDBFactory {
  private _databases: Map<string, MockDatabase>;

  constructor() {
    this._databases = new Map();
  }

  open(name: string, version?: number): IDBOpenDBRequest {
    const request = new MockIDBOpenDBRequest();
    const existingDb = this._databases.get(name);
    const newVersion = version || 1;

    if (existingDb) {
      if (newVersion < existingDb.version) {
        request.setError(new DOMException('Version error', 'VersionError'));
      } else if (newVersion > existingDb.version) {
        const event = new MockIDBVersionChangeEvent('upgradeneeded', {
          oldVersion: existingDb.version,
          newVersion: newVersion
        });
        if (request.onupgradeneeded) {
          request.onupgradeneeded.call(request, event);
        }
        const newDb = new MockDatabase(name, newVersion);
        this._databases.set(name, newDb);
        request.setResult(newDb);
      } else {
        request.setResult(existingDb);
      }
    } else {
      const db = new MockDatabase(name, newVersion);
      this._databases.set(name, db);
      request.setResult(db);
    }

    return request;
  }

  deleteDatabase(name: string): IDBOpenDBRequest {
    const request = new MockIDBOpenDBRequest();
    const existingDb = this._databases.get(name);

    if (existingDb) {
      const event = new MockIDBVersionChangeEvent('blocked', {
        oldVersion: existingDb.version,
        newVersion: null
      });
      if (request.onblocked) {
        request.onblocked.call(request, event);
      }
      this._databases.delete(name);
    }

    request.setResult({} as IDBDatabase);
    return request;
  }

  databases(): Promise<IDBDatabaseInfo[]> {
    return Promise.resolve(Array.from(this._databases.values()).map(db => ({
      name: db.name,
      version: db.version
    })));
  }

  cmp(first: any, second: any): number {
    if (first < second) return -1;
    if (first > second) return 1;
    return 0;
  }
}

describe('IndexedDBCacheL3', () => {
  let mockIndexedDB: MockIndexedDB;
  let cache: IndexedDBCacheL3;

  beforeEach(() => {
    mockIndexedDB = new MockIndexedDB();
    global.indexedDB = mockIndexedDB;
    cache = new IndexedDBCacheL3();
  });

  it('should initialize the cache', async () => {
    await cache.initialize();
    expect(cache).toBeDefined();
  });

  it('should store a value', async () => {
    await cache.initialize();
    await cache.set('key1', 'value1');
    const value = await cache.get('key1');
    expect(value).toBe('value1');
  });

  it('should return null for non-existent key', async () => {
    await cache.initialize();
    const value = await cache.get('non-existent');
    expect(value).toBeNull();
  });

  it('should update an existing value', async () => {
    await cache.initialize();
    await cache.set('key1', 'value1');
    await cache.set('key1', 'value2');
    const value = await cache.get('key1');
    expect(value).toBe('value2');
  });

  it('should delete a value', async () => {
    await cache.initialize();
    await cache.set('key1', 'value1');
    await cache.delete('key1');
    const value = await cache.get('key1');
    expect(value).toBeNull();
  });

  it('should clear all values', async () => {
    await cache.initialize();
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.clear();
    const value1 = await cache.get('key1');
    const value2 = await cache.get('key2');
    expect(value1).toBeNull();
    expect(value2).toBeNull();
  });

  it('should check if a key exists', async () => {
    await cache.initialize();
    await cache.set('key1', 'value1');
    const exists1 = await cache.has('key1');
    const exists2 = await cache.has('non-existent');
    expect(exists1).toBe(true);
    expect(exists2).toBe(false);
  });

  it('should get all keys', async () => {
    await cache.initialize();
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    const keys = await cache.getAllKeys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });

  it('should get cache size', async () => {
    await cache.initialize();
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    const size = await cache.size();
    expect(size).toBe(2);
  });
}); 