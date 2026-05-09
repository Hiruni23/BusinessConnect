module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'services/**/*.js',
    'utils/**/*.js',
    'functions/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  passWithNoTests: true,
};
