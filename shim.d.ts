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
  type LogLevel = 'debug' | 'error' | 'info' | 'silent' | 'trace' | 'warn';

  interface Logger
    extends Record<
      LogLevel,
      (message: string, ...messages: unknown[]) => void
    > {
    setLevel(level: LogLevel): void;
  }

  interface GetLogger {
    (options: { prefix: string }): Logger;

    // testing mock
    mock: {
      logThings: LogLevel[] | 'all';
      logger: Logger;
      clearAll(): void;
    };
  }

  const getLogger: GetLogger;

  export = getLogger;
}
