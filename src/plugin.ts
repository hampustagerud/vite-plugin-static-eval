import { FileSystem } from './fs';
import { ModuleManager } from './manager';
import { type ModuleInputMap } from './types';

import type { Plugin } from 'vite';

interface Config {
  modules: ModuleInputMap;
  prefix?: string | false;
  typingsFile?: string | false;
}

export function createPlugin(inputConfig: Readonly<Config>): Plugin {
  const config: Required<Config> = {
    modules: inputConfig.modules,
    prefix: inputConfig.prefix ?? 'virtual:',
    typingsFile: inputConfig.typingsFile ?? false,
  };

  interface ModuleConfig {
    path: string;
    resolvedId: string;
  }

  const modules = new Map<string, ModuleConfig>();
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

  let fs: FileSystem;
  let moduleManager: ModuleManager;

  return {
    name: 'static-eval',

    resolveId: (id) => modules.get(id)?.resolvedId,

    async configResolved(viteConfig) {
      fs = new FileSystem(viteConfig.root);
      moduleManager = new ModuleManager(config.modules, fs);

      console.time('hej');
      await moduleManager.compileAll(!!config.typingsFile);

      const typingPromises = Array.from(modules.entries()).map(
        async ([name, value]) => {
          const path = typeof value === 'string' ? value : value.path;
          const dts = await moduleManager.getTypings(path);
          return dts && `declare module '${name}' {\n ${dts} \n}`;
        },
      );

      const allModules = await Promise.all(typingPromises);

      if (config.typingsFile) {
        await fs.writeFile(config.typingsFile, allModules.join('\n\n'));
      }
      console.timeEnd('hej');
    },

    async load(id) {
      const precompiledModule = modules.get(resolvedIdMap[id]);

      if (precompiledModule) {
        return await moduleManager.getCode(precompiledModule.path);
      }
    },
  };
}
