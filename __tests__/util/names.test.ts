import {
  branchNameToEnvironmentName,
  filenameToVersion,
  versionToFilename,
  getNameFromPattern,
} from '../../src/util/names';

let realDate = Date;

beforeEach(() => {
  // Setup
  const currentDate = new Date('2021-02-03');
  realDate = Date;
  // @ts-ignore
  global.Date = class extends Date {
    constructor(...args) {
      if (args.length > 0) {
        // @ts-ignore
        return super(...args);
      }

      return currentDate;
    }
  };
});

afterEach(() => {
  global.Date = realDate;
});

test('filenameToVersion should return the version from a filename', () => {
  expect(filenameToVersion('1.js')).toBe('1');
  expect(filenameToVersion('1.0.1.js')).toBe('1.0.1');
});

test('versionToFilename should return the filename from a version', () => {
  expect(versionToFilename('1')).toBe('1.js');
  expect(versionToFilename('1.0.1')).toBe('1.0.1.js');
});

test('branchNameToEnvironmentName should return the environment name from a branch name', () => {
  expect(branchNameToEnvironmentName('master')).toBe('master');
  expect(branchNameToEnvironmentName('feature/new-function')).toBe('feature-new-function');
  expect(branchNameToEnvironmentName('release-1.0.1')).toBe('release-1-0-1');
});

test('getNameFromPattern should return a environment name based on pattern and optional branchName', () => {
  expect(getNameFromPattern('master-[YYYY]-[MM]-[DD]-[mm][ss]')).toBe('master-2021-02-03-0000');
  expect(getNameFromPattern('GH-[branch]', { branchName: 'feature/new-func'})).toBe('GH-feature-new-func');
});
