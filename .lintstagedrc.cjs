module.exports = {
  '*.{cjs,js,ts}': ['eslint', () => 'tsc --noEmit'],
  '*.{json,yml}': ['prettier --check'],
};
