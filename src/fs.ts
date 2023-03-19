import fs from 'fs';
import { dirname, resolve } from 'path';

import { formatCode } from './utils';

export class FileSystem {
  public constructor(private readonly root: string) {}

  public readFile(path: string): Promise<string> {
    const fullPath = resolve(this.root, path);
    return fs.promises.readFile(fullPath, 'utf-8');
  }

  public async writeFile(path: string, content: string): Promise<void> {
    const fullPath = resolve(this.root, path);
    const formattedContent = await formatCode(path, content);
    await fs.promises.mkdir(dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, formattedContent, 'utf-8');
  }
}
