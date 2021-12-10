import type { NameFromPatternArgs } from '../types';

/**
 * Convert fileNames to versions
 * @example
 * filenameToVersion("1.js") // "1"
 * filenameToVersion("1.0.1.js") // "1.0.1"
 */
export const filenameToVersion = (file: string): string => file.replace(/\.js$/, '').replace(/_/g, '.');

/**
 * Convert versions to filenames
 * @example
 * versionToFilename("1") // "1.js"
 * versionToFilename("1.0.1") // "1.0.1.js"
 */
export const versionToFilename = (version: string): string => `${version.replace(/\\./g, '_')}.js`;

/**
 * Convert a branchName to a valid environmentName
 * @param branchName
 */
export const branchNameToEnvironmentName = (branchName: string): string => branchName.replace(/[_./]/g, '-');

export enum Matcher {
  YY = 'YY',
  YYYY = 'YYYY',
  MM = 'MM',
  DD = 'DD',
  hh = 'hh',
  mm = 'mm',
  ss = 'ss',
  branch = 'branch',
}

export const matchers = {
  [Matcher.ss]: (date: Date): string => `${date.getUTCSeconds()}`.padStart(2, '0'),
  [Matcher.hh]: (date: Date): string => `${date.getUTCHours()}`.padStart(2, '0'),
  [Matcher.mm]: (date: Date): string => `${date.getUTCMinutes()}`.padStart(2, '0'),
  [Matcher.YYYY]: (date: Date): string => `${date.getUTCFullYear()}`,
  [Matcher.YY]: (date: Date): string => `${date.getUTCFullYear()}`.substr(2, 2),
  [Matcher.MM]: (date: Date): string => `${date.getUTCMonth() + 1}`.padStart(2, '0'),
  [Matcher.DD]: (date: Date): string => `${date.getDate()}`.padStart(2, '0'),
  [Matcher.branch]: (branchName: string): string => branchNameToEnvironmentName(branchName),
};

/**
 * Convert a pattern and a optional branchName into a "name"
 * @param pattern
 * @param branchName
 */
export const getNameFromPattern = (pattern: string, { branchName }: NameFromPatternArgs = {}): string => {
  const date = new Date();
  return pattern.replace(/\[(YYYY|YY|MM|DD|hh|mm|ss|branch)]/g, (substring, match: Matcher) => {
    switch (match) {
      case Matcher.branch:
        return matchers[Matcher.branch](branchName);
      case Matcher.YYYY:
      case Matcher.YY:
      case Matcher.MM:
      case Matcher.DD:
      case Matcher.hh:
      case Matcher.mm:
      case Matcher.ss:
        return matchers[match](date);
      default:
        return substring;
    }
  });
};
