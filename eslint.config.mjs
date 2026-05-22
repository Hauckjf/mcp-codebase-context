import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // @typescript-eslint/eslint-plugin v8 exports each config as a single flat-config
  // object, not an array — use as plain array elements, not spreads
  tsPlugin.configs['recommended'],
  tsPlugin.configs['strict'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      // @typescript-eslint already registered by the configs above;
      // only import plugin needs to be added here
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      'import/no-cycle': 'error',
    },
  },
];
