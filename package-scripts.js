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
      default: crossEnv('NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --coverage'),
      update: crossEnv('NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --coverage --updateSnapshot'),
      watch: crossEnv('NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --watch'),
      openCoverage: 'open coverage/lcov-report/index.html',
    },
    build: {
      description: 'delete the dist directory and run babel to build the files',
      script: series(
        rimraf('dist'),
        'babel --out-dir dist --ignore "src/__tests__/**/*","src/__mocks__/**/*" src'
      ),
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
        'We automate releases with semantic-release. This should only be run on travis',
      script: series(
        'semantic-release pre',
        'npm publish',
        'semantic-release post'
      ),
    },
    validate: {
      description:
        'This runs several scripts to make sure things look good before committing or on clean install',
      script: concurrent.nps('lint', 'build', 'test'),
    },
    format: {
      description: 'Formats everything with prettier-eslint',
      script: 'prettier-eslint "**/*.{js,json,md,yml}" ".eslintrc.js" --write',
    },
  },
  options: {
    silent: false,
  },
};

// this is not transpiled
/*
  eslint
  max-len: 0,
  comma-dangle: [
    2,
    {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      functions: 'never'
    }
  ]
 */
