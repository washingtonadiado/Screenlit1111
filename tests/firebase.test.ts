/**
 * Screenlit Firebase Client and Security Integration Unit Tests
 * Verifies initialization, error reporting formatting, and OperationType enums
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import { describe, expect, it } from 'vitest';
import { db, auth, OperationType, handleFirestoreError } from '../src/lib/firebase';

describe('Firebase Integration', () => {
  it('initializes firestore and auth services with configured database ID', () => {
    expect(db).toBeDefined();
    expect(auth).toBeDefined();
    expect(db.type).toBe('firestore');
  });

  it('exposes standard OperationType enumeration values', () => {
    expect(OperationType.CREATE).toBe('create');
    expect(OperationType.UPDATE).toBe('update');
    expect(OperationType.DELETE).toBe('delete');
    expect(OperationType.GET).toBe('get');
    expect(OperationType.LIST).toBe('list');
    expect(OperationType.WRITE).toBe('write');
  });

  it('formats firestore permission errors into standardized context payload', () => {
    expect(() => {
      handleFirestoreError(new Error('Missing or insufficient permissions'), OperationType.GET, 'patients/pat_001');
    }).toThrowError(/Missing or insufficient permissions/);
  });
});
