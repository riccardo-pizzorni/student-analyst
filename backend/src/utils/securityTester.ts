/**
 * STUDENT ANALYST - Security Tester Utility
 * =========================================
 * 
 * Utility per testare le funzionalità di sicurezza del backend
 */

export interface SecurityTestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

export class SecurityTester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:10000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Test rate limiting
   */
  async testRateLimit(): Promise<SecurityTestResult> {
    try {
      // Esegui 105 richieste per superare il limite di 100
      const requests = Array.from({ length: 105 }, (_, i) =>
        fetch(`${this.baseUrl}/health?test=${i}`)
      );

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      return {
        test: 'Rate Limiting',
        passed: rateLimitedResponses.length > 0,
        message: rateLimitedResponses.length > 0 
          ? `Rate limiting working: ${rateLimitedResponses.length} requests blocked`
          : 'Rate limiting not working: no requests were blocked',
        details: {
          totalRequests: 105,
          blockedRequests: rateLimitedResponses.length
        }
      };
    } catch (error) {
      return {
        test: 'Rate Limiting',
        passed: false,
        message: `Test failed: ${error}`,
        details: { error }
      };
    }
  }

  /**
   * Test CORS headers
   */
  async testCORS(): Promise<SecurityTestResult> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'OPTIONS'
      });

      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };

      const hasCorsHeaders = Object.values(corsHeaders).some(header => header !== null);

      return {
        test: 'CORS Configuration',
        passed: hasCorsHeaders,
        message: hasCorsHeaders 
          ? 'CORS headers present and configured'
          : 'CORS headers missing or misconfigured',
        details: corsHeaders
      };
    } catch (error) {
      return {
        test: 'CORS Configuration',
        passed: false,
        message: `Test failed: ${error}`,
        details: { error }
      };
    }
  }

  /**
   * Test Security Headers (Helmet)
   */
  async testSecurityHeaders(): Promise<SecurityTestResult> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      const securityHeaders = {
        'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
        'X-Frame-Options': response.headers.get('X-Frame-Options'),
        'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
        'Strict-Transport-Security': response.headers.get('Strict-Transport-Security'),
        'Content-Security-Policy': response.headers.get('Content-Security-Policy')
      };

      const presentHeaders = Object.entries(securityHeaders)
        .filter(([_, value]) => value !== null);

      return {
        test: 'Security Headers (Helmet)',
        passed: presentHeaders.length >= 3,
        message: `${presentHeaders.length} security headers detected`,
        details: {
          presentHeaders: Object.fromEntries(presentHeaders),
          missingHeaders: Object.keys(securityHeaders).filter(
            key => securityHeaders[key as keyof typeof securityHeaders] === null
          )
        }
      };
    } catch (error) {
      return {
        test: 'Security Headers (Helmet)',
        passed: false,
        message: `Test failed: ${error}`,
        details: { error }
      };
    }
  }

  /**
   * Test API Rate Limiting (più restrittivo)
   */
  async testAPIRateLimit(): Promise<SecurityTestResult> {
    try {
      // Esegui 55 richieste per superare il limite API di 50
      const requests = Array.from({ length: 55 }, (_, i) =>
        fetch(`${this.baseUrl}/api/v1/test?test=${i}`)
      );

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      return {
        test: 'API Rate Limiting',
        passed: rateLimitedResponses.length > 0,
        message: rateLimitedResponses.length > 0 
          ? `API rate limiting working: ${rateLimitedResponses.length} requests blocked`
          : 'API rate limiting not working: no requests were blocked',
        details: {
          totalRequests: 55,
          blockedRequests: rateLimitedResponses.length
        }
      };
    } catch (error) {
      return {
        test: 'API Rate Limiting',
        passed: false,
        message: `Test failed: ${error}`,
        details: { error }
      };
    }
  }

  /**
   * Esegui tutti i test di sicurezza
   */
  async runAllTests(): Promise<SecurityTestResult[]> {
    console.log('🔍 Running security tests...');
    
    const tests = [
      this.testCORS(),
      this.testSecurityHeaders(),
      this.testRateLimit(),
      this.testAPIRateLimit()
    ];

    const results = await Promise.all(tests);
    
    console.log('🔍 Security test results:');
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });

    const passedTests = results.filter(r => r.passed).length;
    console.log(`\n📊 Overall: ${passedTests}/${results.length} tests passed`);

    return results;
  }
}

/**
 * Funzione helper per eseguire test rapido
 */
export async function quickSecurityTest(baseUrl?: string): Promise<void> {
  const tester = new SecurityTester(baseUrl);
  await tester.runAllTests();
}

/**
 * Test payload size limit
 */
export async function testPayloadLimit(baseUrl: string = 'http://localhost:10000'): Promise<SecurityTestResult> {
  try {
    // Crea un payload di 11MB (sopra il limite di 10MB)
    const largePayload = 'x'.repeat(11 * 1024 * 1024);
    
    const response = await fetch(`${baseUrl}/api/v1/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: largePayload })
    });

    return {
      test: 'Payload Size Limit',
      passed: response.status === 413,
      message: response.status === 413 
        ? 'Payload size limit working: large request blocked'
        : `Payload size limit not working: got status ${response.status}`,
      details: {
        requestSize: '11MB',
        responseStatus: response.status,
        expectedStatus: 413
      }
    };
  } catch (error) {
    return {
      test: 'Payload Size Limit',
      passed: false,
      message: `Test failed: ${error}`,
      details: { error }
    };
  }
} 
