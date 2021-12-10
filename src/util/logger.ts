import { info, warning } from '@actions/core';
import chalk from 'chalk';
import { VERBOSE } from '../env';

// Force colors in github
chalk.level = 3;

class Logger {
  public static info(message: string): void {
    info(chalk.white(message));
  }

  public static success(message: string): void {
    info(`✅ ${chalk.green(message)}`);
  }

  public static warn(message: string): void {
    warning(`⚠️ ${chalk.yellow(message)}`);
  }

  public static error(message: string): void {
    info(`🔥 ${chalk.red(message)}`);
  }

  public static debug(message: string): void {
    if (VERBOSE) {
      info(`🔎 ${chalk.blue(message)}`);
    }
  }
}

export default Logger;
