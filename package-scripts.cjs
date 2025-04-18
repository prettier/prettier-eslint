const npsUtils = require('nps-utils');

const series = npsUtils.series;
const concurrent = npsUtils.concurrent;
const rimraf = npsUtils.rimraf;
const crossEnv = npsUtils.crossEnv;

module.exports = {
  scripts: {
    contributors: {
      add: {
        description: 'When new people contribute to the project, run this',
        script: 'all-contributors add',
      },
      generate: {
        description: 'Update the badge and contributors table',
        script: 'all-contributors generate',
      },
    },
    test: {
      // Note: The `--experimental-vm-modules` flag is required for Jest to work
      // with ESM. ESM support is needed due to prettier v3’s use of a dynamic
      // `import()` in its `.cjs` file. The flag can be removed when node
      // supports modules in the VM API or the import is removed from prettier.
      default: crossEnv(
        'NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --coverage',
      ),
      update: crossEnv(
        'NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --coverage --updateSnapshot',
      ),
      watch: crossEnv(
        'NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --watch',
      ),
      openCoverage: 'open coverage/lcov-report/index.html',
    },
    build: {
      description: 'delete the lib directory and run tsc to build the files',
      script: series(rimraf('lib'), 'tsc -b src'),
    },
    lint: {
      description: 'lint the entire project',
      script: 'eslint . --cache',
    },
    reportCoverage: {
      description:
        'Report coverage stats to codecov. This should be run after the `test` script',
      script: 'codecov',
    },
    release: {
      description:
        'We automate releases with changesets. This should only be run on GitHub Actions',
      script: series('clean-pkg-json', 'changeset publish'),
    },
    validate: {
      description:
        'This runs several scripts to make sure things look good before committing or on clean install',
      script: concurrent([
        'nps -c ./package-scripts.cjs lint',
        'nps -c ./package-scripts.cjs build',
        'nps -c ./package-scripts.cjs test',
      ]),
    },
    format: {
      description: 'Formats everything with prettier-eslint',
      script: 'prettier-eslint "**/*.{js,json,md,ts,yml}" ".*.js" --write',
    },
  },
  options: {
    silent: false,
  },
};
