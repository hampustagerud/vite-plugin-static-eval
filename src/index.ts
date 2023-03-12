import type { Plugin } from 'vite';

interface Options {}

export default function (opts: Options): Plugin {
  return {
    name: 'precompile-modules',
  };
}
