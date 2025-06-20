/**
 * STUDENT ANALYST - Data Sanitization Test Suite
 * ==============================================
 *
 * Test completi per il sistema di sanitizzazione e validazione dati
 */

import DataSanitizer from './dataSanitizer';

export interface TestCase {
  name: string;
  input: unknown;
  expected: {
    isValid: boolean;
    hasErrors?: boolean;
    hasWarnings?: boolean;
    sanitizedValue?: unknown;
  };
  category: string;
}

export interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  successRate: string;
  results: {
    testName: string;
    passed: boolean;
    details: string;
    category: string;
  }[];
}

/**
 * Suite di test per la sanitizzazione dati
 */
export class DataSanitizationTester {
  /**
   * Esegue tutti i test di sanitizzazione
   */
  static async runAllTests(): Promise<TestSuiteResult> {
    console.log('🧪 Starting Data Sanitization Test Suite...\n');

    const allTests: TestCase[] = [
      ...this.getXSSTests(),
      ...this.getSQLInjectionTests(),
      ...this.getTickerValidationTests(),
      ...this.getDateValidationTests(),
      ...this.getNumericValidationTests(),
      ...this.getGeneralSanitizationTests(),
    ];

    const results = [];
    let passed = 0;

    for (const test of allTests) {
      const result = await this.runSingleTest(test);
      results.push(result);
      if (result.passed) passed++;
    }

    const successRate = ((passed / allTests.length) * 100).toFixed(2) + '%';

    console.log('\n📊 Data Sanitization Test Summary:');
    console.log(`   Total Tests: ${allTests.length}`);
    console.log(`   Passed: ${passed} ✅`);
    console.log(
      `   Failed: ${allTests.length - passed} ${allTests.length - passed > 0 ? '❌' : ''}`
    );
    console.log(`   Success Rate: ${successRate}\n`);

    return {
      suiteName: 'Data Sanitization Test Suite',
      totalTests: allTests.length,
      passed,
      failed: allTests.length - passed,
      successRate,
      results,
    };
  }

  /**
   * Test per XSS protection
   */
  private static getXSSTests(): TestCase[] {
    return [
      {
        name: 'Basic Script Tag XSS',
        input: '<script>alert("xss")</script>',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'XSS Protection',
      },
      {
        name: 'Image Tag with JavaScript',
        input: '<img src="x" onerror="alert(1)">',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'XSS Protection',
      },
      {
        name: 'JavaScript Protocol',
        input: 'javascript:alert("xss")',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'XSS Protection',
      },
      {
        name: 'HTML Entities Escaping',
        input: 'Test & "quotes" <tags>',
        expected: {
          isValid: true,
          sanitizedValue: 'Test &amp; &quot;quotes&quot; &lt;tags&gt;',
        },
        category: 'XSS Protection',
      },
      {
        name: 'Safe Financial Text',
        input: 'AAPL stock price $150.25',
        expected: {
          isValid: true,
          sanitizedValue: 'AAPL stock price $150.25',
        },
        category: 'XSS Protection',
      },
    ];
  }

  /**
   * Test per SQL injection protection
   */
  private static getSQLInjectionTests(): TestCase[] {
    return [
      {
        name: 'Basic SQL Injection',
        input: "'; DROP TABLE users; --",
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'SQL Injection Protection',
      },
      {
        name: 'UNION SELECT Attack',
        input: "' UNION SELECT * FROM admin_users",
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'SQL Injection Protection',
      },
      {
        name: 'Comment Injection',
        input: "admin'/**/OR/**/1=1",
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'SQL Injection Protection',
      },
      {
        name: 'Hexadecimal Injection',
        input: '0x41434345535320544f20414c4c20554e494f4e',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'SQL Injection Protection',
      },
    ];
  }

  /**
   * Test per validazione ticker symbols
   */
  private static getTickerValidationTests(): TestCase[] {
    return [
      {
        name: 'Valid Stock Ticker - AAPL',
        input: 'AAPL',
        expected: {
          isValid: true,
          sanitizedValue: 'AAPL',
        },
        category: 'Ticker Validation',
      },
      {
        name: 'Valid Stock Ticker - Lowercase to Uppercase',
        input: 'msft',
        expected: {
          isValid: true,
          sanitizedValue: 'MSFT',
        },
        category: 'Ticker Validation',
      },
      {
        name: 'Valid Ticker with Dot - BRK.A',
        input: 'BRK.A',
        expected: {
          isValid: true,
          sanitizedValue: 'BRK.A',
        },
        category: 'Ticker Validation',
      },
      {
        name: 'Invalid - Too Long Ticker',
        input: 'VERYLONGTICKER',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Ticker Validation',
      },
      {
        name: 'Invalid - Special Characters',
        input: 'AAPL@#$',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Ticker Validation',
      },
      {
        name: 'Invalid - Empty Ticker',
        input: '',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Ticker Validation',
      },
      {
        name: 'Invalid - Reserved Word',
        input: 'NULL',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Ticker Validation',
      },
      {
        name: 'Crypto Symbol with Allowance',
        input: 'BTC-USD',
        expected: {
          isValid: true,
          hasWarnings: true, // Warning per formato crypto
        },
        category: 'Ticker Validation',
      },
    ];
  }

  /**
   * Test per validazione date
   */
  private static getDateValidationTests(): TestCase[] {
    return [
      {
        name: 'Valid Date Range - Same Year',
        input: { startDate: '2023-01-01', endDate: '2023-12-31' },
        expected: {
          isValid: true,
          sanitizedValue: {
            startDate: '2023-01-01',
            endDate: '2023-12-31',
          },
        },
        category: 'Date Validation',
      },
      {
        name: 'Invalid - Start After End',
        input: { startDate: '2023-12-31', endDate: '2023-01-01' },
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Date Validation',
      },
      {
        name: 'Invalid - Future Date (when not allowed)',
        input: { startDate: '2030-01-01', endDate: '2030-12-31' },
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Date Validation',
      },
      {
        name: 'Invalid - Wrong Format',
        input: { startDate: '01/01/2023', endDate: '31/12/2023' },
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Date Validation',
      },
      {
        name: 'Invalid - SQL Injection in Date',
        input: {
          startDate: "2023-01-01'; DROP TABLE--",
          endDate: '2023-12-31',
        },
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Date Validation',
      },
      {
        name: 'Warning - Large Date Range',
        input: { startDate: '2020-01-01', endDate: '2023-12-31' },
        expected: {
          isValid: true,
          hasWarnings: true,
        },
        category: 'Date Validation',
      },
      {
        name: 'Warning - Weekend Dates',
        input: { startDate: '2023-01-07', endDate: '2023-01-08' }, // Saturday-Sunday
        expected: {
          isValid: true,
          hasWarnings: true,
        },
        category: 'Date Validation',
      },
    ];
  }

  /**
   * Test per validazione numerica
   */
  private static getNumericValidationTests(): TestCase[] {
    return [
      {
        name: 'Valid Price - Positive Number',
        input: { value: '150.25', type: 'price' },
        expected: {
          isValid: true,
          sanitizedValue: 150.25,
        },
        category: 'Numeric Validation',
      },
      {
        name: 'Valid Quantity - Integer',
        input: { value: '100', type: 'quantity' },
        expected: {
          isValid: true,
          sanitizedValue: 100,
        },
        category: 'Numeric Validation',
      },
      {
        name: 'Valid Percentage - Negative',
        input: { value: '-5.5', type: 'percentage' },
        expected: {
          isValid: true,
          sanitizedValue: -5.5,
        },
        category: 'Numeric Validation',
      },
      {
        name: 'Invalid - Non-Numeric String',
        input: { value: 'not-a-number', type: 'price' },
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Numeric Validation',
      },
      {
        name: 'Invalid - Negative Price',
        input: { value: '-150.25', type: 'price' },
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Numeric Validation',
      },
      {
        name: 'Invalid - Percentage Out of Range',
        input: { value: '150', type: 'percentage' },
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'Numeric Validation',
      },
      {
        name: 'Warning - Too Many Decimals',
        input: { value: '150.123456789', type: 'price' },
        expected: {
          isValid: true,
          hasWarnings: true,
        },
        category: 'Numeric Validation',
      },
      {
        name: 'Warning - Very High Price',
        input: { value: '999999', type: 'price' },
        expected: {
          isValid: true,
          hasWarnings: true,
        },
        category: 'Numeric Validation',
      },
    ];
  }

  /**
   * Test per sanitizzazione generale
   */
  private static getGeneralSanitizationTests(): TestCase[] {
    return [
      {
        name: 'Path Traversal Attack',
        input: '../../../etc/passwd',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'General Sanitization',
      },
      {
        name: 'Command Injection',
        input: 'test; rm -rf /',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'General Sanitization',
      },
      {
        name: 'URL Encoded Path Traversal',
        input: '%2e%2e%2f%2e%2e%2f%2e%2e%2f',
        expected: {
          isValid: false,
          hasErrors: true,
        },
        category: 'General Sanitization',
      },
      {
        name: 'Normal Financial Data',
        input: 'Portfolio analysis for Q4 2023',
        expected: {
          isValid: true,
          sanitizedValue: 'Portfolio analysis for Q4 2023',
        },
        category: 'General Sanitization',
      },
      {
        name: 'Request Object Sanitization',
        input: {
          ticker: 'AAPL',
          quantity: 100,
          'malicious<script>': 'attack',
          normal_field: 'safe_value',
        },
        expected: {
          isValid: false, // Contiene campo malicious
          hasErrors: true,
        },
        category: 'General Sanitization',
      },
    ];
  }

  /**
   * Esegue un singolo test
   */
  private static async runSingleTest(test: TestCase): Promise<{
    testName: string;
    passed: boolean;
    details: string;
    category: string;
  }> {
    try {
      let result;

      // Esegui il test appropriato basato sulla categoria
      switch (test.category) {
        case 'XSS Protection':
          if (typeof test.input === 'string') {
            if (test.input.includes('<') || test.input.includes('script')) {
              result = DataSanitizer.removeDangerousPatterns(test.input);
            } else {
              result = {
                isValid: true,
                sanitizedValue: DataSanitizer.sanitizeHtml(test.input),
                errors: [],
                warnings: [],
              };
            }
          }
          break;

        case 'SQL Injection Protection':
          result = DataSanitizer.removeDangerousPatterns(test.input);
          break;

        case 'Ticker Validation':
          result = DataSanitizer.validateTicker(test.input, {
            allowCrypto: test.input.includes('-'),
            enforceUppercase: true,
          });
          break;

        case 'Date Validation':
          if (test.input.startDate && test.input.endDate) {
            result = DataSanitizer.validateDateRange(
              test.input.startDate,
              test.input.endDate,
              { allowFutureDates: false }
            );
          }
          break;

        case 'Numeric Validation':
          result = DataSanitizer.validateNumericInput(
            test.input.value,
            test.input.type
          );
          break;

        case 'General Sanitization':
          if (typeof test.input === 'string') {
            result = DataSanitizer.removeDangerousPatterns(test.input);
          } else if (typeof test.input === 'object') {
            result = DataSanitizer.sanitizeRequestData(test.input);
          }
          break;

        default:
          result = {
            isValid: false,
            errors: ['Unknown test category'],
            warnings: [],
          };
      }

      // Verifica se il risultato corrisponde alle aspettative
      const passed = this.verifyTestResult(result, test.expected);
      const details = passed
        ? `✅ Test passed`
        : `❌ Expected: ${JSON.stringify(test.expected)}, Got: isValid=${result?.isValid}, errors=${result?.errors?.length || 0}`;

      console.log(`  ${passed ? '✅' : '❌'} ${test.name}: ${details}`);

      return {
        testName: test.name,
        passed,
        details,
        category: test.category,
      };
    } catch (error) {
      console.log(`  ❌ ${test.name}: Error - ${error}`);
      return {
        testName: test.name,
        passed: false,
        details: `Error: ${error}`,
        category: test.category,
      };
    }
  }

  /**
   * Verifica se il risultato del test corrisponde alle aspettative
   */
  private static verifyTestResult(result: unknown, expected: unknown): boolean {
    if (!result) return false;

    // Type assertion per mantenere la compatibilità con il codice esistente
    const resultObj = result as Record<string, unknown>;
    const expectedObj = expected as Record<string, unknown>;

    // Controlla validità
    if (resultObj.isValid !== expectedObj.isValid) {
      return false;
    }

    // Controlla errori se specificato
    if (expectedObj.hasErrors !== undefined) {
      const hasErrors =
        resultObj.errors &&
        Array.isArray(resultObj.errors) &&
        resultObj.errors.length > 0;
      if (hasErrors !== expectedObj.hasErrors) {
        return false;
      }
    }

    // Controlla warnings se specificato
    if (expectedObj.hasWarnings !== undefined) {
      const hasWarnings =
        resultObj.warnings &&
        Array.isArray(resultObj.warnings) &&
        resultObj.warnings.length > 0;
      if (hasWarnings !== expectedObj.hasWarnings) {
        return false;
      }
    }

    // Controlla valore sanitizzato se specificato
    if (expectedObj.sanitizedValue !== undefined) {
      if (typeof expectedObj.sanitizedValue === 'object') {
        // Confronto superficiale per oggetti
        return (
          JSON.stringify(resultObj.sanitizedValue) ===
          JSON.stringify(expectedObj.sanitizedValue)
        );
      } else {
        return resultObj.sanitizedValue === expectedObj.sanitizedValue;
      }
    }

    return true;
  }

  /**
   * Test rapido per verificare funzionalità base
   */
  static async quickTest(): Promise<boolean> {
    console.log('🚀 Running quick data sanitization test...');

    try {
      // Test XSS
      const xssTest = DataSanitizer.removeDangerousPatterns(
        '<script>alert("xss")</script>'
      );
      if (xssTest.isValid) {
        console.log('❌ XSS test failed - dangerous script not blocked');
        return false;
      }

      // Test ticker
      const tickerTest = DataSanitizer.validateTicker('AAPL');
      if (!tickerTest.isValid || tickerTest.sanitizedValue !== 'AAPL') {
        console.log('❌ Ticker test failed');
        return false;
      }

      // Test HTML sanitization
      const htmlTest = DataSanitizer.sanitizeHtml('<div>test & "quotes"</div>');
      if (
        htmlTest !== '&lt;div&gt;test &amp; &quot;quotes&quot;&lt;&#x2F;div&gt;'
      ) {
        console.log('❌ HTML sanitization test failed');
        return false;
      }

      console.log('✅ Quick data sanitization test passed');
      return true;
    } catch (error) {
      console.error('❌ Quick test failed:', error);
      return false;
    }
  }
}

export default DataSanitizationTester;
