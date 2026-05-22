import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // v8 exports configs as flat-config arrays; spread them directly
  ...tsPlugin.configs['recommended'],
  ...tsPlugin.configs['strict'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      // @typescript-eslint is already registered by the spreads above;
      // only the import plugin needs to be added here
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      'import/no-cycle': 'error',
    },
  },
];
