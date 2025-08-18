export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./tests/setup-jest.js'],
  transform: {},
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
};
