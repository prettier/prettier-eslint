declare module 'eslint-plugin-node-dependencies' {
  import { ESLint } from 'eslint';

  const nodeDependencies: ESLint.Plugin & {
    configs: {
      'flat/recommended': ESLint.Linter.Config[];
    };
  };

  export = nodeDependencies;
}

declare module 'loglevel-colored-level-prefix' {
  import { LogLevelDesc, Logger } from 'loglevel';

  export interface GetLogger {
    (options?: { level?: LogLevelDesc; prefix?: string }): Logger;

    // testing mock
    mock: {
      logThings: LogLevelDesc[] | 'all';
      logger: Logger;
      clearAll(): void;
    };
  }

  const getLogger: GetLogger;

  export default getLogger;
}
