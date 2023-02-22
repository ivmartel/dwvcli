module.exports = {
  env: {
    node: true,
    es6: true,
    es2020: true
  },
  parserOptions: {
    "sourceType": "module"
  },
  globals: {
    dwv: 'readonly'
  },
  extends: [
    'eslint:recommended'
  ]
};
