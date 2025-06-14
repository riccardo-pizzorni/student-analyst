import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { FallbackManager } from '../FallbackManager';
import { NotificationManager } from '../NotificationManager';

jest.mock('../NotificationManager');

describe('FallbackManager', () => {
  let fallbackManager: FallbackManager;
  let mockNotificationManager: jest.Mocked<NotificationManager>;

  beforeEach(() => {
    // Reset singleton
    (FallbackManager as any).instance = null;
    
    // Mock NotificationManager
    mockNotificationManager = {
      showSuccess: jest.fn(),
      showWarning: jest.fn(),
      showError: jest.fn(),
      showInfo: jest.fn(),
      getInstance: jest.fn().mockReturnThis()
    } as any;
    
    (NotificationManager.getInstance as jest.Mock).mockReturnValue(mockNotificationManager);
    
    fallbackManager = FallbackManager.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Registrazione Provider', () => {
    test('dovrebbe registrare correttamente un nuovo provider', () => {
      fallbackManager.registerProvider('test1', 'Test Provider 1');
      
      const providers = fallbackManager.getProvidersStatus();
      const provider = providers.find(p => p.id === 'test1');
      
      expect(provider).toBeDefined();
      expect(provider?.name).toBe('Test Provider 1');
      expect(provider?.isEnabled).toBe(true);
      expect(provider?.consecutiveFailures).toBe(0);
      expect(provider?.healthScore).toBe(100);
    });

    test('dovrebbe registrare un provider inizialmente disabilitato', () => {
      fallbackManager.registerProvider('test1', 'Test Provider 1', false);
      
      const providers = fallbackManager.getProvidersStatus();
      const provider = providers.find(p => p.id === 'test1');
      
      expect(provider?.isEnabled).toBe(false);
    });
  });

  describe('Gestione Successi e Fallimenti', () => {
    beforeEach(() => {
      fallbackManager.registerProvider('test1', 'Test Provider 1');
      fallbackManager.registerProvider('test2', 'Test Provider 2');
    });

    test('dovrebbe registrare correttamente un successo', () => {
      fallbackManager.recordSuccess('test1');
      
      const provider = fallbackManager.getProvidersStatus().find(p => p.id === 'test1');
      expect(provider?.consecutiveFailures).toBe(0);
      expect(provider?.totalSuccesses).toBe(1);
      expect(provider?.healthScore).toBe(100);
    });

    test('dovrebbe registrare correttamente un fallimento', () => {
      const shouldFallback = fallbackManager.recordFailure('test1', 'Test error');
      
      const provider = fallbackManager.getProvidersStatus().find(p => p.id === 'test1');
      expect(provider?.consecutiveFailures).toBe(1);
      expect(provider?.totalFailures).toBe(1);
      expect(provider?.healthScore).toBe(95);
      expect(shouldFallback).toBe(false);
    });

    test('dovrebbe disabilitare temporaneamente dopo troppi fallimenti consecutivi', () => {
      // Simulo 3 fallimenti consecutivi
      fallbackManager.recordFailure('test1');
      fallbackManager.recordFailure('test1');
      const shouldFallback = fallbackManager.recordFailure('test1');
      
      const provider = fallbackManager.getProvidersStatus().find(p => p.id === 'test1');
      expect(provider?.isTemporarilyDisabled).toBe(true);
      expect(provider?.disabledUntil).toBeDefined();
      expect(shouldFallback).toBe(true);
      expect(mockNotificationManager.showError).toHaveBeenCalled();
    });

    test('dovrebbe riabilitare un provider dopo un successo', () => {
      // Disabilito il provider
      fallbackManager.recordFailure('test1');
      fallbackManager.recordFailure('test1');
      fallbackManager.recordFailure('test1');
      
      // Registro un successo
      fallbackManager.recordSuccess('test1');
      
      const provider = fallbackManager.getProvidersStatus().find(p => p.id === 'test1');
      expect(provider?.isTemporarilyDisabled).toBe(false);
      expect(provider?.disabledUntil).toBeUndefined();
      expect(mockNotificationManager.showSuccess).toHaveBeenCalled();
    });
  });

  describe('Selezione Provider', () => {
    beforeEach(() => {
      fallbackManager.registerProvider('test1', 'Test Provider 1');
      fallbackManager.registerProvider('test2', 'Test Provider 2');
      fallbackManager.registerProvider('test3', 'Test Provider 3');
    });

    test('dovrebbe restituire solo i provider disponibili', () => {
      // Disabilito test1
      fallbackManager.setProviderEnabled('test1', false);
      
      // Disabilito temporaneamente test2
      fallbackManager.recordFailure('test2');
      fallbackManager.recordFailure('test2');
      fallbackManager.recordFailure('test2');
      
      const available = fallbackManager.getAvailableProviders();
      expect(available.length).toBe(1);
      expect(available[0].id).toBe('test3');
    });

    test('dovrebbe ordinare i provider per health score', () => {
      // Degrado la salute di test2
      fallbackManager.recordFailure('test2');
      fallbackManager.recordFailure('test2');
      
      const available = fallbackManager.getAvailableProviders();
      expect(available[0].id).toBe('test1');
      expect(available[1].id).toBe('test3');
      expect(available[2].id).toBe('test2');
    });

    test('dovrebbe restituire il provider migliore', () => {
      const best = fallbackManager.getBestProvider();
      expect(best).toBeDefined();
      expect(best?.healthScore).toBe(100);
    });
  });

  describe('Configurazione', () => {
    test('dovrebbe aggiornare correttamente la configurazione', () => {
      const newConfig = {
        maxConsecutiveFailures: 5,
        temporaryDisableDuration: 30,
        recoveryTestInterval: 10,
        enableNotifications: false,
        autoRecovery: false
      };
      
      fallbackManager.updateConfig(newConfig);
      
      // Verifico che la nuova configurazione sia applicata
      fallbackManager.registerProvider('test1', 'Test Provider 1');
      fallbackManager.recordFailure('test1');
      fallbackManager.recordFailure('test1');
      fallbackManager.recordFailure('test1');
      fallbackManager.recordFailure('test1');
      const shouldFallback = fallbackManager.recordFailure('test1');
      
      expect(shouldFallback).toBe(true);
      expect(mockNotificationManager.showError).not.toHaveBeenCalled();
    });
  });

  describe('Statistiche e Eventi', () => {
    beforeEach(() => {
      fallbackManager.registerProvider('test1', 'Test Provider 1');
    });

    test('dovrebbe tracciare correttamente gli eventi', () => {
      fallbackManager.recordSuccess('test1');
      fallbackManager.recordFailure('test1');
      
      const events = fallbackManager.getRecentEvents();
      expect(events.length).toBe(3);
      expect(events[0].type).toBe('failure');
      expect(events[1].type).toBe('success');
      expect(events[2].type).toBe('provider_enabled');
    });

    test('dovrebbe fornire statistiche accurate', () => {
      fallbackManager.recordSuccess('test1');
      fallbackManager.recordSuccess('test1');
      fallbackManager.recordFailure('test1');
      
      const stats = fallbackManager.getStatistics();
      const providerStats = fallbackManager.getProvidersStatus();
      const provider = providerStats.find(p => p.id === 'test1');
      
      expect(provider?.totalSuccesses).toBe(2);
      expect(provider?.totalFailures).toBe(1);
      expect(provider?.healthScore).toBe(95);
    });

    test('dovrebbe resettare correttamente le statistiche', () => {
      fallbackManager.recordSuccess('test1');
      fallbackManager.recordFailure('test1');
      
      fallbackManager.resetStatistics();
      
      const providerStats = fallbackManager.getProvidersStatus();
      const provider = providerStats.find(p => p.id === 'test1');
      
      expect(provider?.totalSuccesses).toBe(0);
      expect(provider?.totalFailures).toBe(0);
      expect(provider?.healthScore).toBe(100);
      expect(mockNotificationManager.showInfo).toHaveBeenCalled();
    });
  });

  describe('Recovery Automatico', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (global as any).__TEST_MODE__ = false;
    });

    afterEach(() => {
      jest.useRealTimers();
      delete (global as any).__TEST_MODE__;
    });

    test('dovrebbe tentare il recovery automatico dopo il periodo di disabilitazione', () => {
      fallbackManager.registerProvider('test1', 'Test Provider 1');
      
      // Disabilito il provider
      fallbackManager.recordFailure('test1');
      fallbackManager.recordFailure('test1');
      fallbackManager.recordFailure('test1');
      
      // Avanzo il tempo di 15 minuti
      jest.advanceTimersByTime(15 * 60 * 1000);
      
      // Forzo il tentativo di recovery
      (fallbackManager as any).attemptProviderRecovery();
      
      const provider = fallbackManager.getProvidersStatus().find(p => p.id === 'test1');
      expect(provider?.isTemporarilyDisabled).toBe(false);
    });
  });
}); 