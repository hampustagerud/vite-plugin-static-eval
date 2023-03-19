import crypto from 'crypto';

import { compileModule } from './compile';
import { generateDTS } from './dts';
import { type FileSystem } from './fs';
import { type ModuleInputMap } from './types';

interface ModuleResults {
  sourceHash: string;
  code?: string;
  typings?: string;
}

export class ModuleManager {
  private __files: Map<string, ModuleResults | null>;

  public constructor(modules: ModuleInputMap, private readonly fs: FileSystem) {
    this.__files = new Map();

    for (const file of Object.values(modules)) {
      const name = typeof file === 'string' ? file : file.path;
      this.__files.set(name, null);
    }
  }

  private hashSource(source: string): string {
    return crypto.createHash('sha1').update(source).digest('hex');
  }

  private async fileInvariant(path: string): Promise<ModuleResults> {
    if (!this.__files.has(path)) {
      throw new Error(`Unknown file: ${path}`);
    }

    const existingResult = this.__files.get(path);

    const source = await this.fs.readFile(path);
    const hash = this.hashSource(source);

    if (!existingResult || hash !== existingResult.sourceHash) {
      const newResult = { sourceHash: hash };

      this.__files.set(path, newResult);
      return newResult;
    } else {
      return existingResult;
    }
  }

  public async getCode(path: string): Promise<string | undefined> {
    const results = await this.fileInvariant(path);

    if (results.code === undefined) {
      const code = await compileModule(path);

      results.code = code;
      return code;
    }

    return results.code;
  }

  public async getTypings(path: string): Promise<string | undefined> {
    const results = await this.fileInvariant(path);

    if (!results.typings) {
      const typings = await generateDTS(path);

      if (typings != null) {
        results.typings = typings;
        return typings;
      }
    }

    return results.typings;
  }

  public async compileAll(includeTypings: boolean): Promise<void> {
    const paths = Array.from(this.__files.keys());

    const promises = paths.map(async (path) => {
      const result = await this.fileInvariant(path);

      const subpromises: Promise<unknown>[] = [];

      if (!result.typings && includeTypings) {
        subpromises.push(this.getTypings(path));
      }

      if (!result.code) {
        subpromises.push(this.getCode(path));
      }

      await Promise.all(subpromises);
    });

    await Promise.all(promises);
  }
}
