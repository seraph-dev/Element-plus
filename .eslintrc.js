module.exports = {
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      tsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        'no-undef': 'off',
      },
    },
    {
      // not tested
      files: ['**/__tests__/**'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  rules: {
    // js/ts
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': 'error',
    'no-console': ['warn', { allow: ['error'] }],
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    camelcase: ['error', { properties: 'never' }],

    'no-var': 'error',
    'prefer-const': [
      'warn',
      { destructuring: 'all', ignoreReadBeforeAssign: true },
    ],
    'prefer-template': 'error',
    'object-shorthand': [
      'error',
      'always',
      { ignoreConstructors: false, avoidQuotes: true },
    ],
    'block-scoped-var': 'error',
    complexity: ['off', 11],
    'no-with': 'error',
    'no-void': 'error',

    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',

    // vue
    'vue/no-v-html': 'off',
    'vue/require-default-prop': 'off',
    'vue/require-explicit-emits': 'off',

    'prettier/prettier': 'warn',
  },
}
