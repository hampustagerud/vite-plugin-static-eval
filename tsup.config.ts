import { defineConfig } from 'tsup';

export default defineConfig({
  outDir: 'dist',
  entry: ['src/index.ts'],
  skipNodeModulesBundle: true,
  format: ['cjs', 'esm'],
  bundle: true,
  dts: true,
  minify: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
});
