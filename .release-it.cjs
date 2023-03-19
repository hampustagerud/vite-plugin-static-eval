// @ts-check

const parserOpts = require('conventional-changelog-conventionalcommits/parser-opts');
const addBangNotes = require('conventional-changelog-conventionalcommits/add-bang-notes');
const semver = require('semver');

const breakingHeaderPattern = parserOpts().breakingHeaderPattern;

const packageJSON = require('./package.json');
const { readVersion } = require('./.release-it/utils.cjs');

const hasCustomVersion = !!semver.parse(readVersion());

module.exports = {
  git: {
    commit: true,
    commitMessage: 'chore: release v${version}\n\n[skip ci]',
    requireBranch: 'master',
    requireCleanWorkingDir: false,
    tag: true,
    tagName: 'v${version}',
    push: true,
  },

  github: {
    autoGenerate: true,
    release: true,
    releaseName: 'Release v${version}',
    preRelease: false,
    assets: ['CHANGELOG.md', 'vite-plugin-*.tgz'],
    tokenRef: 'GH_TOKEN',
  },

  npm: {
    publish: true,
    skipChecks: true,
  },

  plugins: {
    './.release-it/version-plugin': {},
    '@release-it/conventional-changelog': {
      header: '# Changelog',
      infile: 'CHANGELOG.md',
      ignoreRecommendedBump: hasCustomVersion,
      writerOpts: {
        commitsSort(a, b) {
          return a.committerDate.localeCompare(b.committerDate);
        },
        commitGroupsSort(a, b) {
          const groups = ['Features', 'Bug fixes', 'Other improvements'];
          return groups.indexOf(a.title) - groups.indexOf(b.title);
        },
      },
      whatBump(commits) {
        const [MAJOR, MINOR, PATCH] = [0, 1, 2];

        let breaking = 0;
        let features = 0;
        let fixes = 0;
        let hasBangNotes = false;

        for (const commit of commits) {
          if (!hasBangNotes) {
            hasBangNotes = breakingHeaderPattern.test(commit.header);
          }

          addBangNotes(commit);

          if (commit.notes.length > 0) {
            breaking += commit.notes.length;
          } else if (commit.type === 'feat' || commit.type === 'feature') {
            features += 1;
          } else if (commit.type === 'fix') {
            fixes += 1;
          }
        }

        /** @type {false | number} */
        let level = false;

        if (breaking > 0) {
          level = MAJOR;
        } else if (features > 0) {
          level = MINOR;
        } else if (fixes > 0) {
          level = PATCH;
        }

        if (
          level !== false &&
          semver.lt(packageJSON.version, '1.0.0') &&
          !hasBangNotes
        ) {
          level = Math.min(level + 1, PATCH);
        }

        function plural(value, single, multiple) {
          return value + ' ' + (value === 1 ? single : multiple);
        }

        return {
          level,
          reason: [
            'There',
            breaking === 1 ? 'is' : 'are',
            plural(breaking, 'BREAKING CHANGE', 'BREAKING CHANGES') + ',',
            plural(features, 'feature', 'features') + ' and',
            plural(fixes, 'fix', 'fixes'),
          ].join(' '),
        };
      },
      preset: {
        name: 'conventionalcommits',
        types: [
          { type: 'feat', section: 'Features' },

          { type: 'fix', section: 'Bug fixes' },

          { type: 'perf', section: 'Code improvements' },
          { type: 'refactor', section: 'Code improvements' },
          { type: 'style', section: 'Code improvements' },
          { type: 'test', section: 'Code improvements' },

          { type: 'chore', section: 'Other improvements' },
          { type: 'ci', section: 'Other improvements' },
          { type: 'docs', section: 'Other improvements' },
        ],
      },
    },
  },
};
