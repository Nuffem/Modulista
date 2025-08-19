export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./tests/setup-jest.js'],
  transform: {},
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  // Suppress experimental warnings and improve output
  verbose: false,
  silent: false,
  // Custom reporters for better output formatting
  reporters: [
    ['./tests/custom-reporter.js', {}]
  ],
  // Improve test output
  collectCoverage: false,
  errorOnDeprecated: false,
};
