import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

// @typescript-eslint v8: each named config is an array of flat-config objects
// (some carry plugins/languageOptions, others carry rules). Merge rules across
// all elements so the single-config-object structure below still works.
const mergeConfigRules = (configs) =>
  Object.assign({}, ...configs.map((c) => c.rules ?? {}));

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
      ...mergeConfigRules(tsPlugin.configs['recommended']),
      ...mergeConfigRules(tsPlugin.configs['strict']),
      '@typescript-eslint/no-floating-promises': 'error',
      'import/no-cycle': 'error',
    },
  },
];
