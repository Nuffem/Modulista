import 'fake-indexeddb/auto';

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2, 15),
};

// Polyfill TextEncoder/TextDecoder for jsdom
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Suppress console warnings and errors that are not relevant to tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args) => {
  const message = args.join(' ');
  // Suppress font loading errors in JSDOM
  if (message.includes('Could not load link') && message.includes('fonts.googleapis.com')) {
    return;
  }
  // Suppress network errors in JSDOM
  if (message.includes('ENOTFOUND fonts.googleapis.com')) {
    return;
  }
  // Suppress expected database errors in expression type tests
  if (message.includes('Error evaluating soma: Database not initialized') || 
      message.includes('Error evaluating subtracao: Database not initialized')) {
    return;
  }
  // Show actual test-related errors
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const message = args.join(' ');
  // Suppress experimental VM modules warning (we need this for ES modules)
  if (message.includes('ExperimentalWarning: VM Modules is an experimental feature')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.log = (...args) => {
  const message = args.join(' ');
  // Suppress database initialization success messages during tests
  if (message.includes('Database initialized successfully')) {
    return;
  }
  // Show other console.log messages
  originalConsoleLog.apply(console, args);
};

// Suppress process warnings for experimental features
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, type, code) => {
  if (code === 'ExperimentalWarning' && warning.includes('VM Modules')) {
    return;
  }
  originalEmitWarning.call(process, warning, type, code);
};
