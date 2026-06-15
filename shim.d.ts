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
