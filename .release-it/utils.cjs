const fs = require('fs');
const semver = require('semver');

module.exports = {
  readVersion() {
    if (fs.existsSync('VERSION')) {
      const versionStr = fs
        .readFileSync('VERSION', 'utf-8')
        .match(/v?(.*)/)?.[0];

      const version = semver.parse(versionStr || '');

      if (version) {
        const packageContent = fs.readFileSync('package.json', 'utf-8');
        const packageVersionStr = JSON.parse(packageContent).version;
        const packageVersion = semver.parse(packageVersionStr);

        if (packageVersion && semver.gt(version, packageVersion)) {
          return version.version;
        }
      }
    }

    return null;
  },
};
