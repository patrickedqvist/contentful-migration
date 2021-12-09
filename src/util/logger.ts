import { info, debug, isDebug } from '@actions/core';

class Logger {
  public static info(message: string): void {
    info(message);
  }

  public static success(message: string): void {
    info(`✅ ${message}`);
  }

  public static warn(message: string): void {
    info(`⚠️ ${message}`);
  }

  public static error(message: string): void {
    info(`💩 ${message}`);
  }

  public static debug(message: string): void {
    if (isDebug()) {
      debug(message);
    }
  }
}

export default Logger;
