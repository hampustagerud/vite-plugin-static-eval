/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'path';
import { Worker } from 'worker_threads';

export function compileModule(filePath: string): Promise<string> {
  const worker = new Worker(path.resolve(__dirname, 'worker'), {
    workerData: { filePath },
  });

  return new Promise<string>((resolve) => {
    worker.on('message', (message) => {
      resolve(message);
    });
  });
}
