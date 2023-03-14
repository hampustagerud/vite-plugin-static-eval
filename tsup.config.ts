import { defineConfig } from 'tsup';

export default defineConfig({
  outDir: 'dist',
  entry: ['src/index.ts', 'src/worker.ts'],
  skipNodeModulesBundle: true,
  format: ['cjs', 'esm'],
  clean: true,
  bundle: true,
  dts: true,
  minify: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: 'node16',
  shims: true,
  platform: 'node',
});
