import fs from 'fs';
import path from 'path';

import { compileModule } from './compile';
import { generateDTS } from './dts';
import { formatCode, writeFile } from './utils';

import type { Plugin } from 'vite';

interface PrecompileModuleInputConfig {
  path: string;
}

type PrecompileModule = string | PrecompileModuleInputConfig;

interface Config {
  modules: Record<string, PrecompileModule>;
  prefix?: string | false;
}

export function createPlugin(inputConfig: Readonly<Config>): Plugin {
  const config: Required<Config> = {
    prefix: 'virtual:',
    ...inputConfig,
  };

  interface PrecompileModuleConfig {
    path: string;
    resolvedId: string;
  }

  const modules = new Map<string, PrecompileModuleConfig>();
  const resolvedIdMap: Record<string, string> = {};

  for (const [name, moduleConfig] of Object.entries(config.modules)) {
    const virtualId = (config.prefix || '') + name;
    const resolvedId = '\0' + virtualId;

    resolvedIdMap[resolvedId] = virtualId;

    if (typeof moduleConfig === 'string') {
      modules.set(virtualId, { path: moduleConfig, resolvedId });
    } else {
      modules.set(virtualId, { path: moduleConfig.path, resolvedId });
    }
  }

  // const codeCache: Record<string, string> = {};
  // const dtsCache: Record<string, string> = {};

  return {
    name: 'static-eval',

    resolveId: (id) => modules.get(id)?.resolvedId,

    async configResolved() {
      const moduleArr = Array.from(modules.entries());
      await Promise.all(
        moduleArr.map(async ([name, value]) => {
          const dts = await generateDTS(value.path);

          if (dts) {
            const moduleDts = `declare module '${name}' {\n ${dts} \n}`;

            const filePath = path.resolve(
              path.dirname(value.path),
              path.basename(value.path, path.extname(value.path)) + '.d.ts',
            );

            const formattedDts = await formatCode(filePath, moduleDts);

            await writeFile(filePath, formattedDts);
          }
        }),
      );
    },

    async load(id) {
      const precompiledModule = modules.get(resolvedIdMap[id]);

      if (precompiledModule) {
        return await compileModule(path.resolve(precompiledModule.path));
      }
    },
  };
}
