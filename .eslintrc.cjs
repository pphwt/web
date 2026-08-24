module.exports = {
  ignorePatterns: ['dist/**', 'src/pages/NeuralSandbox.jsx'],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react-hooks'],
  rules: {
    // The project is currently JavaScript-first and does not yet have a
    // component-test rule set. Keep the repository lint useful by enforcing
    // runtime name safety while avoiding a broad formatting migration.
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-constant-condition': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
};
