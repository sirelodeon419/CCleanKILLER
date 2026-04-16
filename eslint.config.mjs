import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  // Base JS + TS recommended rules
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // React + hooks for renderer files only
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+ JSX transform
      'react/prop-types': 'off', // TypeScript handles this
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Node.js env for main process + config files
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts', '*.config.*', '*.config.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Test files
  {
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Prettier must be last — disables conflicting formatting rules
  prettierConfig,

  // Global ignores
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**', '.vite/**'],
  }
)
