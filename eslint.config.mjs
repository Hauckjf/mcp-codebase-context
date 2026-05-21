import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      // recommended-strict baseline: spread recommended first, then strict overrides
      ...tsPlugin.configs['recommended'].rules,
      ...tsPlugin.configs['strict'].rules,
      // required by spec
      '@typescript-eslint/no-floating-promises': 'error',
      'import/no-cycle': 'error',
    },
  },
];
