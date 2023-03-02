module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json'],
    ecmaVersion: 'latest',
  },
  extends: '@jannchie',
}
