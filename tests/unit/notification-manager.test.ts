import {
  NotificationManager,
  notificationManager,
} from '../../src/services/NotificationManager';

// Mock window and CustomEvent
const mockDispatchEvent = jest.fn();
const mockCustomEvent = jest.fn().mockImplementation((type, options) => ({
  type,
  detail: options?.detail,
  bubbles: false,
  cancelable: false,
  composed: false,
}));

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: {
    dispatchEvent: mockDispatchEvent,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  writable: true,
});

// Mock CustomEvent constructor
Object.defineProperty(global, 'CustomEvent', {
  value: mockCustomEvent,
  writable: true,
});

describe('NotificationManager', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = NotificationManager.getInstance();
  });

  afterEach(() => {
    mockDispatchEvent.mockClear();
    mockCustomEvent.mockClear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance every time', () => {
      const instance1 = NotificationManager.getInstance();
      const instance2 = NotificationManager.getInstance();
      const instance3 = NotificationManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(instance3);
    });

    it('should export the same singleton instance as notificationManager', () => {
      const instance = NotificationManager.getInstance();
      expect(notificationManager).toBe(instance);
    });
  });

  describe('Success Notifications', () => {
    it('should show success notification with title only', () => {
      manager.showSuccess('Test Success');

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'success',
          message: 'Test Success',
          duration: 4000,
        },
      });
      expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    });

    it('should show success notification with title and message', () => {
      manager.showSuccess('Success Title', 'Success message details');

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'success',
          message: 'Success Title: Success message details',
          duration: 4000,
        },
      });
    });

    it('should show success notification with custom duration', () => {
      manager.showSuccess('Success Title', 'Message', 2000);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'success',
          message: 'Success Title: Message',
          duration: 2000,
        },
      });
    });

    it('should show success notification with title and custom duration but no message', () => {
      manager.showSuccess('Success Title', undefined, 3000);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'success',
          message: 'Success Title',
          duration: 3000,
        },
      });
    });
  });

  describe('Error Notifications', () => {
    it('should show error notification with title only', () => {
      manager.showError('Error occurred');

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'error',
          message: 'Error occurred',
          duration: 8000,
        },
      });
    });

    it('should show error notification with title and message', () => {
      manager.showError('Error Title', 'Error details');

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'error',
          message: 'Error Title: Error details',
          duration: 8000,
        },
      });
    });

    it('should show error notification with custom duration', () => {
      manager.showError('Error Title', 'Error message', 5000);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'error',
          message: 'Error Title: Error message',
          duration: 5000,
        },
      });
    });
  });

  describe('Warning Notifications', () => {
    it('should show warning notification with title only', () => {
      manager.showWarning('Warning message');

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'warning',
          message: 'Warning message',
          duration: 6000,
        },
      });
    });

    it('should show warning notification with title and message', () => {
      manager.showWarning('Warning Title', 'Warning details');

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'warning',
          message: 'Warning Title: Warning details',
          duration: 6000,
        },
      });
    });

    it('should show warning notification with custom duration', () => {
      manager.showWarning('Warning Title', 'Warning message', 3000);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'warning',
          message: 'Warning Title: Warning message',
          duration: 3000,
        },
      });
    });
  });

  describe('Info Notifications', () => {
    it('should show info notification with title only', () => {
      manager.showInfo('Info message');

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'info',
          message: 'Info message',
          duration: 5000,
        },
      });
    });

    it('should show info notification with title and message', () => {
      manager.showInfo('Info Title', 'Info details');

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'info',
          message: 'Info Title: Info details',
          duration: 5000,
        },
      });
    });

    it('should show info notification with custom duration', () => {
      manager.showInfo('Info Title', 'Info message', 7000);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'info',
          message: 'Info Title: Info message',
          duration: 7000,
        },
      });
    });
  });

  describe('Default Duration Logic', () => {
    it('should use correct default durations for each type', () => {
      manager.showError('Error');
      manager.showWarning('Warning');
      manager.showSuccess('Success');
      manager.showInfo('Info');

      const calls = mockCustomEvent.mock.calls;

      expect(calls[0][1].detail.duration).toBe(8000); // error
      expect(calls[1][1].detail.duration).toBe(6000); // warning
      expect(calls[2][1].detail.duration).toBe(4000); // success
      expect(calls[3][1].detail.duration).toBe(5000); // info
    });
  });

  describe('Data Source Notifications', () => {
    it('should show successful data source notification', () => {
      manager.showDataSourceNotification('Alpha Vantage', 'AAPL', true, false);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'success',
          message:
            '📈 Data from Alpha Vantage: AAPL data retrieved successfully',
          duration: 4000,
        },
      });
    });

    it('should show successful data source notification with fallback', () => {
      manager.showDataSourceNotification('Alpha Vantage', 'AAPL', true, true);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'success',
          message:
            '📈 Data from Alpha Vantage (backup): AAPL data retrieved successfully using backup provider',
          duration: 4000,
        },
      });
    });

    it('should show failed data source notification', () => {
      manager.showDataSourceNotification('Alpha Vantage', 'AAPL', false);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'error',
          message: '❌ Alpha Vantage failed: Unable to retrieve AAPL data',
          duration: 6000,
        },
      });
    });

    it('should show failed data source notification with fallback flag (ignored for failures)', () => {
      manager.showDataSourceNotification('Alpha Vantage', 'AAPL', false, true);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'error',
          message: '❌ Alpha Vantage failed: Unable to retrieve AAPL data',
          duration: 6000,
        },
      });
    });
  });

  describe('Provider Switch Notifications', () => {
    it('should show provider switch notification', () => {
      manager.showProviderSwitchNotification(
        'Alpha Vantage',
        'Yahoo Finance',
        'is experiencing issues'
      );

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'warning',
          message:
            '🔄 Switched to Yahoo Finance: Alpha Vantage is experiencing issues. Automatically using Yahoo Finance for reliable data.',
          duration: 7000,
        },
      });
    });

    it('should handle different provider switch scenarios', () => {
      manager.showProviderSwitchNotification(
        'Yahoo Finance',
        'IEX Cloud',
        'rate limit exceeded'
      );

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'warning',
          message:
            '🔄 Switched to IEX Cloud: Yahoo Finance rate limit exceeded. Automatically using IEX Cloud for reliable data.',
          duration: 7000,
        },
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle empty strings', () => {
      manager.showSuccess('');
      manager.showError('', '');
      manager.showWarning('', '', 0);

      const calls = mockCustomEvent.mock.calls;
      expect(calls[0][1].detail.message).toBe('');
      expect(calls[1][1].detail.message).toBe(': ');
      expect(calls[2][1].detail.duration).toBe(0);
    });

    it('should handle special characters in messages', () => {
      const specialMessage =
        'Message with 🚀 emojis & special chars: <>[]{}|\\';
      manager.showInfo('Title', specialMessage);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'info',
          message: `Title: ${specialMessage}`,
          duration: 5000,
        },
      });
    });

    it('should handle very long messages', () => {
      const longTitle = 'A'.repeat(1000);
      const longMessage = 'B'.repeat(1000);

      manager.showError(longTitle, longMessage);

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'error',
          message: `${longTitle}: ${longMessage}`,
          duration: 8000,
        },
      });
    });

    it('should handle zero and negative durations', () => {
      manager.showSuccess('Test', 'Message', 0);
      manager.showError('Test', 'Message', -100);

      const calls = mockCustomEvent.mock.calls;
      expect(calls[0][1].detail.duration).toBe(0);
      expect(calls[1][1].detail.duration).toBe(-100);
    });
  });

  describe('Event Dispatching', () => {
    it('should dispatch events on window object', () => {
      manager.showInfo('Test');

      expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should create CustomEvent instances correctly', () => {
      manager.showSuccess('Test Success');

      expect(mockCustomEvent).toHaveBeenCalledWith('show-notification', {
        detail: {
          type: 'success',
          message: 'Test Success',
          duration: 4000,
        },
      });
    });

    it('should handle multiple rapid notifications', () => {
      manager.showSuccess('Success 1');
      manager.showError('Error 1');
      manager.showWarning('Warning 1');
      manager.showInfo('Info 1');

      expect(mockDispatchEvent).toHaveBeenCalledTimes(4);
      expect(mockCustomEvent).toHaveBeenCalledTimes(4);
    });
  });

  describe('Integration with Complex Scenarios', () => {
    it('should handle realistic data fetching scenario', () => {
      // Simulate successful fetch
      manager.showDataSourceNotification('Alpha Vantage', 'AAPL', true);

      // Simulate provider switch
      manager.showProviderSwitchNotification(
        'Alpha Vantage',
        'Yahoo Finance',
        'rate limited'
      );

      // Simulate successful fallback
      manager.showDataSourceNotification('Yahoo Finance', 'AAPL', true, true);

      expect(mockDispatchEvent).toHaveBeenCalledTimes(3);
    });

    it('should handle error recovery scenario', () => {
      // Multiple failures
      manager.showDataSourceNotification('Source 1', 'AAPL', false);
      manager.showDataSourceNotification('Source 2', 'AAPL', false);

      // Final success
      manager.showDataSourceNotification('Source 3', 'AAPL', true);

      const calls = mockCustomEvent.mock.calls;
      expect(calls[0][1].detail.type).toBe('error');
      expect(calls[1][1].detail.type).toBe('error');
      expect(calls[2][1].detail.type).toBe('success');
    });
  });
});
