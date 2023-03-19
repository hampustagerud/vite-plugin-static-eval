import fs from 'fs';
import path from 'path';
import { isMainThread, parentPort, workerData } from 'worker_threads';

import { buildSync } from 'esbuild';

if (isMainThread) {
  throw new Error('This code should not be loaded by the main thread');
} else if (!parentPort) {
  throw new Error('No parent port found');
}

const parent = parentPort;

const filePath = workerData?.filePath;

if (!filePath || typeof filePath !== 'string' || !fs.existsSync(filePath)) {
  throw new Error('Invalid file path');
}

const cwd = path.resolve(process.cwd(), 'node_modules');
const nodeModulesPath = fs.existsSync(cwd)
  ? cwd
  : path.dirname(path.dirname(__dirname));

if (!nodeModulesPath.endsWith('node_modules')) {
  throw new Error('Found no place to store compiled files');
}

const tempDir = path.resolve(nodeModulesPath, '.cache', 'static-eval');

const { outputFiles } = buildSync({
  entryPoints: [filePath],
  entryNames: '[dir]/[name]-[hash]/index',
  sourcemap: false,
  outdir: tempDir,
  bundle: false,
  target: 'node16',
  format: 'esm',
  platform: 'node',
  write: false,
  treeShaking: true,
  outExtension: {
    '.js': '.mjs',
  },
  minify: true,
});

const file = outputFiles?.[0];

if (!file) {
  throw new Error('File could not be compiled properly');
}

fs.mkdirSync(path.dirname(file.path), { recursive: true });
fs.writeFileSync(file.path, file.contents);

(async function () {
  const data = await import(file.path);
  console.log('data', data);

  function formatValue(value: unknown): string {
    if (
      ['string', 'number', 'boolean', 'undefined'].includes(typeof value) ||
      value === null
    ) {
      return JSON.stringify(value);
    } else if (value instanceof Date) {
      return `new Date("${value.toISOString()}")`;
    } else if (value instanceof RegExp) {
      return `/${value.source}/${value.flags}`;
    } else if (Array.isArray(value)) {
      return `[${value.map(formatValue).join(',')}]`;
    } else if (typeof value === 'object') {
      return `{${Object.entries(value)
        .map(([k, v]) => `${k}:${formatValue(v)}`)
        .join(',')}}`;
    }

    throw new Error('not implemented: ' + value);
  }

  const variables = Object.entries(data.default.variables).map(
    ([name, variable]) => {
      return `export const ${name} = ${formatValue(variable)};`;
    },
  );

  const functions = Object.entries(data.default.functions).map(([name, fn]) => {
    const f = fn as () => unknown;
    const fnSource = f.toString();

    if (fnSource.startsWith('function') || fnSource.includes('=>')) {
      return `export const ${name} = ${fnSource};`;
    } else if (fnSource.startsWith(f.name)) {
      return `export const ${name} = function ${fnSource.substring(
        f.name.length,
      )};`;
    } else {
      return `export const ${name} = function ${fnSource};`;
    }
  });

  const code = [...variables, ...functions].join('\n\n');

  console.log(code);
  parent.postMessage(code);
})();
