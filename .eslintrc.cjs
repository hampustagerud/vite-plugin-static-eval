const path = require('path');

module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    project: path.resolve(__dirname, 'tsconfig.json'),
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  ignorePatterns: ['dist/**'],
  rules: {
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
        disallowTypeAnnotations: false,
      },
    ],
    'import/order': [
      'error',
      {
        'groups': ['builtin', 'external', 'parent', 'sibling', 'index', 'type'],
        'newlines-between': 'always',
        'alphabetize': {
          order: 'asc',
          caseInsensitive: false,
        },
      },
    ],
    'prettier/prettier': 'error',
  },
  overrides: [
    {
      files: ['./*.cjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
