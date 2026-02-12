import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
        L: 'readonly',
      },
    },
    rules: {
      // Code quality
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'smart'],
      'curly': ['warn', 'multi-line'],
      'no-useless-assignment': 'warn',

      // Formatting — light rules (Prettier handles the rest)
      'comma-dangle': ['warn', 'only-multiline'],
      'no-trailing-spaces': 'warn',
      'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },
]
