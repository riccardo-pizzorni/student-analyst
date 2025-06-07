/**
 * Simple LRU Cache implementation for algorithm optimization
 */

interface CacheNode<T> {
  key: string;
  value: T;
  prev?: CacheNode<T>;
  next?: CacheNode<T>;
}

export class LRUCache<K extends string, V> {
  private capacity: number;
  private cache: Map<K, CacheNode<V>>;
  private head: CacheNode<V>;
  private tail: CacheNode<V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    
    // Create dummy head and tail nodes
    this.head = { key: '', value: undefined as any };
    this.tail = { key: '', value: undefined as any };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (node) {
      // Move to front (most recently used)
      this.moveToFront(node);
      return node.value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    const existingNode = this.cache.get(key);
    
    if (existingNode) {
      // Update existing node
      existingNode.value = value;
      this.moveToFront(existingNode);
    } else {
      // Create new node
      const newNode: CacheNode<V> = { key, value };
      
      if (this.cache.size >= this.capacity) {
        // Remove least recently used (tail.prev)
        const lru = this.tail.prev!;
        this.removeNode(lru);
        this.cache.delete(lru.key as K);
      }
      
      this.addToFront(newNode);
      this.cache.set(key, newNode);
    }
  }

  private moveToFront(node: CacheNode<V>): void {
    this.removeNode(node);
    this.addToFront(node);
  }

  private addToFront(node: CacheNode<V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: CacheNode<V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  clear(): void {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}