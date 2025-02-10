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
        // 'glob -c "LOG_LEVEL=trace node --import tsx --test --no-warnings --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=coverage/lcov-report/index.html --test-reporter=spec --test-reporter-destination=stdout" "./src/**/__tests__/deep-merge.test.ts"'
        'glob -c "LOG_LEVEL=info node --import tsx --test --no-warnings --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=coverage/lcov-report/index.html --test-reporter=spec --test-reporter-destination=stdout" "./src/**/__tests__/index.test.ts"'
        // 'glob -c "node --loader ./src/__mocks__/mock-loader.mjs --import tsx --test --no-warnings --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=coverage/lcov-report/index.html --test-reporter=spec --test-reporter-destination=stdout" "./src/**/__tests__/index.test.ts"'
        // 'glob -c "node --test --no-warnings --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=coverage/lcov-report/index.html --test-reporter=spec --test-reporter-destination=stdout" "./src/**/__tests__/**/*.[jt]s"'
      ),
      update: crossEnv(
        'glob -c "node --import tsx --test --test-update-snapshots --no-warnings --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=coverage/lcov-report/index.html --test-reporter=spec --test-reporter-destination=stdout" "./src/**/__tests__/**/*.[jt]s"'
      ),
      watch: crossEnv(
        'glob -c "node --import tsx --test --watch --no-warnings --test-reporter=spec --test-reporter-destination=stdout" "./src/**/__tests__/**/*.[jt]s"'
      ),
      openCoverage: 'open coverage/lcov-report/index.html',
    },
    build: {
      description: 'delete the dist directory and run Rollup to build the files',
      script: series(rimraf('dist'), 'rollup -c'),
    },
    lint: {
      description: 'lint the entire project',
      script: 'eslint src --cache --max-warnings=0',
    },
    reportCoverage: {
      description:
        'Report coverage stats to codecov. This should be run after the `test` script',
      script: 'codecov',
    },
    release: {
      description:
        'We automate releases with changesets. This should only be run on GitHub Actions',
      script: 'changeset publish',
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
    typescript: {
      description: 'Checks if typescript is generated without errors',
      script: 'tsc --noEmit',
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
