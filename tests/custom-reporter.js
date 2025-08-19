/**
 * Custom Jest Reporter for improved test results display
 * Provides enhanced formatting, colors, and cleaner output
 */

import { readFileSync } from 'fs';
import { join } from 'path';

class CustomReporter {
  constructor(globalConfig, reporterOptions) {
    this._globalConfig = globalConfig;
    this._options = reporterOptions;
    // Check if verbose mode is enabled
    this._verbose = globalConfig.verbose || process.argv.includes('--verbose');
  }

  // Color utilities for better visual output
  _colorize(text, color) {
    const colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m'
    };
    return `${colors[color] || ''}${text}${colors.reset}`;
  }

  _formatTime(time) {
    if (time < 1000) {
      return `${time}ms`;
    }
    return `${(time / 1000).toFixed(2)}s`;
  }

  onRunStart(aggregatedResults, options) {
    console.log(this._colorize('🧪 Executando testes do Modulista...', 'cyan'));
    console.log(this._colorize('=' .repeat(50), 'gray'));
  }

  onTestResult(test, testResult, aggregatedResults) {
    const { testFilePath, testResults, perfStats } = testResult;
    const relativePath = testFilePath.replace(process.cwd() + '/', '');
    
    // Count results
    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;
    const skipped = testResults.filter(t => t.status === 'pending' || t.status === 'skipped').length;
    
    // Suite header with status indicator
    const statusIcon = failed > 0 ? '❌' : '✅';
    const statusColor = failed > 0 ? 'red' : 'green';
    const suiteName = this._colorize(`${statusIcon} ${relativePath}`, statusColor);
    const timing = this._colorize(`(${this._formatTime(perfStats.runtime)})`, 'gray');
    
    console.log(`${suiteName} ${timing}`);
    
    // Test results summary for this suite
    if (this._verbose) {
      testResults.forEach(testCase => {
        const indent = '  ';
        let icon, color;
        
        switch (testCase.status) {
          case 'passed':
            icon = '✓';
            color = 'green';
            break;
          case 'failed':
            icon = '✗';
            color = 'red';
            break;
          default:
            icon = '○';
            color = 'yellow';
        }
        
        const testName = this._colorize(`${icon} ${testCase.title}`, color);
        const testTiming = testCase.duration ? 
          this._colorize(` (${testCase.duration}ms)`, 'gray') : '';
        
        console.log(`${indent}${testName}${testTiming}`);
        
        // Show test failure details if any
        if (testCase.status === 'failed' && testCase.failureDetails) {
          testCase.failureDetails.forEach(failure => {
            console.log(`${indent}  ${this._colorize('Error:', 'red')} ${failure.message}`);
          });
        }
      });
    } else {
      // Compact summary
      const summary = [];
      if (passed > 0) summary.push(this._colorize(`${passed} passou`, 'green'));
      if (failed > 0) summary.push(this._colorize(`${failed} falhou`, 'red'));
      if (skipped > 0) summary.push(this._colorize(`${skipped} ignorado`, 'yellow'));
      
      if (summary.length > 0) {
        console.log(`  ${summary.join(' • ')}`);
      }
    }
  }

  onRunComplete(testContexts, results) {
    const { numTotalTestSuites, numPassedTestSuites, numFailedTestSuites, 
            numTotalTests, numPassedTests, numFailedTests, numPendingTests,
            startTime, snapshot } = results;
    
    const duration = Date.now() - startTime;
    
    console.log('\n' + this._colorize('=' .repeat(50), 'gray'));
    
    // Overall results summary
    console.log(this._colorize('📊 Resumo dos Testes:', 'bold'));
    
    // Test suites summary
    const suitesIcon = numFailedTestSuites > 0 ? '❌' : '✅';
    const suitesColor = numFailedTestSuites > 0 ? 'red' : 'green';
    console.log(`${this._colorize(suitesIcon, suitesColor)} Suítes: ${this._colorize(numPassedTestSuites, 'green')} passaram, ` +
                `${numFailedTestSuites > 0 ? this._colorize(numFailedTestSuites, 'red') + ' falharam, ' : ''}` +
                `${numTotalTestSuites} total`);
    
    // Individual tests summary
    const testsIcon = numFailedTests > 0 ? '❌' : '✅';
    const testsColor = numFailedTests > 0 ? 'red' : 'green';
    console.log(`${this._colorize(testsIcon, testsColor)} Testes: ${this._colorize(numPassedTests, 'green')} passaram, ` +
                `${numFailedTests > 0 ? this._colorize(numFailedTests, 'red') + ' falharam, ' : ''}` +
                `${numPendingTests > 0 ? this._colorize(numPendingTests, 'yellow') + ' ignorados, ' : ''}` +
                `${numTotalTests} total`);
    
    // Timing information
    console.log(`⏱️  Tempo: ${this._colorize(this._formatTime(duration), 'cyan')}`);
    
    // Success/failure message
    if (numFailedTests > 0 || numFailedTestSuites > 0) {
      console.log(this._colorize('\n❌ Alguns testes falharam. Verifique os erros acima.', 'red'));
    } else {
      console.log(this._colorize('\n🎉 Todos os testes passaram com sucesso!', 'green'));
    }
    
    // Additional info
    console.log(this._colorize('\n💡 Comandos disponíveis:', 'dim'));
    console.log(this._colorize('  npm test              - Executar testes (modo compacto)', 'dim'));
    console.log(this._colorize('  npm run test:verbose  - Executar testes (modo detalhado)', 'dim'));
    console.log(this._colorize('  npm run test:watch    - Executar testes em modo watch', 'dim'));
    console.log(this._colorize('  npm run test:coverage - Executar testes com cobertura', 'dim'));
    console.log(this._colorize('=' .repeat(50), 'gray'));
  }
}

export default CustomReporter;