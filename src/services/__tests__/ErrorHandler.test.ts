import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { SpyInstance } from 'jest-mock';
import { ErrorContext, ErrorHandler } from '../ErrorHandler';
import { NotificationManager } from '../NotificationManager';

jest.mock('../NotificationManager');

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockNotificationManager: jest.Mocked<NotificationManager>;
  let mockConsoleError: SpyInstance;

  beforeEach(() => {
    // Reset singleton
    (ErrorHandler as any).instance = null;
    
    // Mock NotificationManager
    mockNotificationManager = {
      showSuccess: jest.fn(),
      showWarning: jest.fn(),
      showError: jest.fn(),
      getInstance: jest.fn().mockReturnThis()
    } as any;
    
    (NotificationManager.getInstance as jest.Mock).mockReturnValue(mockNotificationManager);
    
    // Mock console.error
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    errorHandler = ErrorHandler.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Gestione Errori', () => {
    test('dovrebbe gestire correttamente un errore critico', () => {
      const error = new Error('Test critical error');
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: new Date()
      };

      errorHandler.handleError(error, context, 'critical');

      expect(mockNotificationManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('[CRITICAL]')
      );
      expect(mockConsoleError).toHaveBeenCalled();
    });

    test('dovrebbe gestire correttamente un errore di bassa severità', () => {
      const error = new Error('Test low severity error');
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: new Date()
      };

      errorHandler.handleError(error, context, 'low');

      expect(mockNotificationManager.showError).not.toHaveBeenCalled();
      expect(mockNotificationManager.showWarning).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalled();
    });

    test('dovrebbe mantenere la cronologia degli errori', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: new Date()
      };

      errorHandler.handleError(error, context);
      const history = errorHandler.getErrorHistory();

      expect(history.length).toBe(1);
      expect(history[0].error).toBe(error);
      expect(history[0].context).toBe(context);
    });

    test('dovrebbe limitare la dimensione della cronologia', () => {
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: new Date()
      };

      // Inserisco più errori del limite massimo
      for (let i = 0; i < 1100; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), context);
      }

      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(1000);
    });
  });

  describe('Query Errori', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Inserisco errori di test con diverse severità e componenti
      const errors = [
        { severity: 'critical', component: 'ComponentA' },
        { severity: 'high', component: 'ComponentA' },
        { severity: 'medium', component: 'ComponentB' },
        { severity: 'low', component: 'ComponentB' }
      ];

      errors.forEach(({ severity, component }) => {
        errorHandler.handleError(
          new Error(`Test ${severity} error`),
          {
            component,
            operation: 'testOperation',
            timestamp: new Date()
          },
          severity as any
        );
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('dovrebbe filtrare gli errori per severità', () => {
      const criticalErrors = errorHandler.getErrorsBySeverity('critical');
      const highErrors = errorHandler.getErrorsBySeverity('high');
      const mediumErrors = errorHandler.getErrorsBySeverity('medium');
      const lowErrors = errorHandler.getErrorsBySeverity('low');

      expect(criticalErrors.length).toBe(1);
      expect(highErrors.length).toBe(1);
      expect(mediumErrors.length).toBe(1);
      expect(lowErrors.length).toBe(1);
    });

    test('dovrebbe filtrare gli errori per componente', () => {
      const componentAErrors = errorHandler.getErrorsByComponent('ComponentA');
      const componentBErrors = errorHandler.getErrorsByComponent('ComponentB');

      expect(componentAErrors.length).toBe(2);
      expect(componentBErrors.length).toBe(2);
    });

    test('dovrebbe filtrare gli errori recenti', () => {
      const recentErrors = errorHandler.getRecentErrors(1); // ultimi 60 minuti
      expect(recentErrors.length).toBe(4);

      // Avanzo il tempo di 2 ore
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);
      const oldErrors = errorHandler.getRecentErrors(1);
      expect(oldErrors.length).toBe(0);
    });
  });

  describe('Formattazione Messaggi', () => {
    test('dovrebbe formattare correttamente i messaggi di errore', () => {
      const error = new Error('Test error message');
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: new Date(),
        metadata: { testKey: 'testValue' }
      };

      errorHandler.handleError(error, context, 'high');

      expect(mockNotificationManager.showWarning).toHaveBeenCalledWith(
        expect.stringMatching(/\[HIGH\] TestComponent: Test error message/)
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('"severity":"high"')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('"component":"TestComponent"')
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('"testKey":"testValue"')
      );
    });
  });

  describe('Pulizia Cronologia', () => {
    test('dovrebbe pulire correttamente la cronologia', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: new Date()
      };

      errorHandler.handleError(error, context);
      expect(errorHandler.getErrorHistory().length).toBe(1);

      errorHandler.clearHistory();
      expect(errorHandler.getErrorHistory().length).toBe(0);
    });
  });
}); 