import 'fake-indexeddb/auto';

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2, 15),
};
