module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    'dist/',
    'out/',
    'node_modules/',
    '*.mjs',
    'src/workbench/',
    'src/build.mjs',
    'src/buildAllThemes.mjs',
    'src/buildTheme.mjs',
    'src/colors.mjs',
    'src/createSyntax.mjs',
    'src/makeThemePath.mjs',
    'src/syntax.mjs',
    'esbuild.js',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
