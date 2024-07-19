import js from '@eslint/js';
import googleAppsScript from 'eslint-plugin-googleappsscript';

export default [
  js.configs.recommended,
  {
    'ignores': [
      'src/utilities.js',
      'src/watcher.js',
    ]
  },
  {
    'languageOptions': {
      'ecmaVersion': 2019,
      'globals': {
        ...googleAppsScript.environments.googleappsscript.globals
      }
    },
    'rules': {
      'arrow-parens': ['error', 'as-needed'],
      'indent': ['error', 2],
      'max-len': ['error', { 'code': 120 }],
      'no-console': ['error'],
      'no-ternary': ['off'],
      'no-undef': ['off'],
      'no-undefined': ['off'],
      'no-unused-vars': ['off'],
      'no-var': ['error'],
      'object-curly-spacing': ['error', 'always'],
      'one-var': ['error', 'never'],
      'padded-blocks': ['error', 'never'],
      'quotes': ['error', 'single'],
      'quote-props': ['error', 'always'],
      'semi': ['error', 'always']
    }
  }
];

