import { Plugin } from 'release-it';
import { readVersion } from './utils.cjs';
import fs from 'fs';

export default class FileVersionPlugin extends Plugin {
  /** @type {string | null} */
  version = null;

  constructor(config) {
    super();
    this.version = readVersion();
  }

  getIncrementedVersion() {
    return this.version;
  }

  getIncrementedVersionCI() {
    return this.version;
  }

  bump(version) {
    fs.writeFileSync('VERSION', version + '\n', 'utf-8');
  }
}
