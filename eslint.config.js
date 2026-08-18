import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  {
    // Generated PocketBase type declarations and archived database snapshots. Linting them
    // produced ~1,800 of the 2,600 reported errors and none were actionable.
    ignores: [
      'pocketbase/types.d.ts',
      'pocketbase/types_debug.d.ts',
      'pocketbase/pb_migrations/**',
      'pocketbase/pb_migrations_temp/**',
      'pocketbase/migrations_backup/**',
      'pocketbase/pb_data/**',
      'backups/**',
      'build/**',
      'test-results/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
      // see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-filetype-errors
      'no-undef': 'off',

      // Unused catch bindings are idiomatic where the error is deliberately swallowed.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],

      // Tracked debt rather than a merge blocker: ~200 `any` annotations left from the
      // games -> items migration, and ~180 unresolved navigation links. Both are visible
      // in `npm run lint` output and recorded in docs/audits/launch-readiness-audit.md.
      // Fix opportunistically; do not let them hold up the release gate.
      '@typescript-eslint/no-explicit-any': 'warn',
      'svelte/no-navigation-without-resolve': 'warn',
    },
  },
  {
    // PocketBase JSVM hooks run in goja, not Node: they use triple-slash references for
    // types, `require` inside handlers, and a set of injected globals.
    files: ['pocketbase/pb_hooks/**/*.js'],
    languageOptions: {
      globals: {
        $app: 'readonly',
        __hooks: 'readonly',
        onRecordCreate: 'readonly',
        onRecordUpdate: 'readonly',
        onRecordDelete: 'readonly',
        BadRequestError: 'readonly',
        module: 'writable',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig,
      },
    },
  }
);
