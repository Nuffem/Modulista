import 'fake-indexeddb/auto';

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2, 15),
};

// Polyfill TextEncoder/TextDecoder for jsdom
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
