#!/usr/bin/env node

import { spawn } from 'child_process';

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit', 
      shell: true,
      ...options 
    });
    
    child.on('close', (code) => {
      resolve(code);
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
};

const runCommandWithOutput = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'pipe', 
      shell: true,
      ...options 
    });
    
    let stdout = '';
    let stderr = '';
    
    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }
    
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }
    
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
};

async function main() {
  console.log('🧪 Running all tests for Modulista\n');
  
  let jestPassed = false;
  let playwrightPassed = false;
  let playwrightSkipped = false;
  
  // Run Jest tests
  console.log('📋 Running Jest tests...');
  try {
    const jestExitCode = await runCommand('npm', ['run', 'test:jest']);
    jestPassed = jestExitCode === 0;
    
    if (jestPassed) {
      console.log('✅ Jest tests passed\n');
    } else {
      console.log('❌ Jest tests failed\n');
    }
  } catch (error) {
    console.error('❌ Jest tests failed with error:', error.message);
  }
  
  // Run Playwright tests with error handling
  console.log('🎭 Running Playwright tests...');
  try {
    const playwrightResult = await runCommandWithOutput('npm', ['run', 'test:playwright']);
    
    // Check if the error is specifically about missing browsers
    if (playwrightResult.code !== 0 && 
        (playwrightResult.stderr.includes('Executable doesn\'t exist') || 
         playwrightResult.stdout.includes('Executable doesn\'t exist') ||
         playwrightResult.stderr.includes('Please run the following command to download new browsers') ||
         playwrightResult.stdout.includes('Please run the following command to download new browsers'))) {
      
      console.log('⚠️  Playwright browsers are not installed. Attempting installation...');
      
      try {
        const installResult = await runCommandWithOutput('npx', ['playwright', 'install', 'chromium']);
        
        if (installResult.code === 0) {
          console.log('✅ Browsers installed successfully. Re-running Playwright tests...');
          const retryResult = await runCommand('npm', ['run', 'test:playwright']);
          playwrightPassed = retryResult === 0;
          
          if (playwrightPassed) {
            console.log('✅ Playwright tests passed');
          } else {
            console.log('❌ Playwright tests failed after browser installation');
          }
        } else {
          console.log('⚠️  Could not install Playwright browsers. This is common in CI environments.');
          console.log('   Skipping Playwright tests.');
          console.log('   To manually install browsers, run: npx playwright install chromium');
          playwrightSkipped = true;
          playwrightPassed = true; // Don't fail the overall test suite
        }
      } catch (installError) {
        console.log('⚠️  Browser installation failed. Skipping Playwright tests.');
        console.log('   This is common in CI environments without proper dependencies.');
        playwrightSkipped = true;
        playwrightPassed = true; // Don't fail the overall test suite
      }
    } else if (playwrightResult.code === 0) {
      console.log('✅ Playwright tests passed');
      playwrightPassed = true;
    } else {
      console.log('❌ Playwright tests failed');
      playwrightPassed = false;
    }
  } catch (error) {
    console.error('❌ Playwright tests failed with error:', error.message);
    playwrightPassed = false;
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   Jest: ${jestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  if (playwrightSkipped) {
    console.log(`   Playwright: ⏭️  SKIPPED (browsers not available)`);
  } else {
    console.log(`   Playwright: ${playwrightPassed ? '✅ PASSED' : '❌ FAILED'}`);
  }
  
  if (jestPassed && playwrightPassed) {
    if (playwrightSkipped) {
      console.log('\n⚠️  Jest tests passed, Playwright tests skipped due to missing browsers.');
      console.log('   Run `npx playwright install chromium` to enable Playwright tests.');
    } else {
      console.log('\n🎉 All tests passed!');
    }
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});