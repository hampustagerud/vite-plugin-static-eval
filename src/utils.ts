import fs from 'fs';

export async function tryImport<T>(
  promise: () => Promise<{ default: T }>,
): Promise<T | null> {
  try {
    const { default: val } = await promise();
    return val;
  } catch {
    return null;
  }
}

export async function writeFile(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    const existingContent = await fs.promises.readFile(filePath, 'utf-8');

    if (existingContent === content) {
      return;
    }
  }

  await fs.promises.writeFile(filePath, content, 'utf-8');
}

export async function formatCode(
  filePath: string,
  code: string,
): Promise<string> {
  const prettier = await tryImport(() => import('prettier'));

  if (!prettier) {
    return code;
  }

  const config = await prettier.resolveConfig(filePath);

  return prettier.format(code, { filepath: filePath, ...config });
}
