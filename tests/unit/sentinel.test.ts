import { describe, expect, it } from '@jest/globals';

describe('Sentinel Tests - Ambiente di test', () => {
  it('should sum two numbers correctly', () => {
    expect(1 + 2).toBe(3);
  });

  it('should compare two strings', () => {
    expect('student-analyst').toBe('student-analyst');
  });

  it('should compare two objects', () => {
    expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
  });
});
