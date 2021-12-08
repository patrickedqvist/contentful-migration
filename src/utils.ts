import * as core from '@actions/core'
import * as github from '@actions/github'
import chalk from 'chalk'
import {
  BranchNames,
  EnvironmentProps,
  EnvironmentType,
  EventNames,
  NameFromPatternArgs
} from './types'
import {
  CONTENTFUL_ALIAS,
  DELAY,
  FEATURE_PATTERN,
  LOG_LEVEL,
  MASTER_PATTERN
} from './constants'
import type {Space} from 'contentful-management'

// Force colors on github
chalk.level = 3

export const Logger = {
  log(message: string): void {
    core.info(chalk.white(message))
  },
  success(message: string): void {
    core.info(`✅ ${chalk.green(message)}`)
  },
  error(message: string): void {
    core.info(`💩 ${chalk.red(message)}`)
  },
  warn(message: string): void {
    core.info(`⚠️ ${chalk.yellow(message)}`)
  },
  verbose(message: string): void {
    if (LOG_LEVEL === 'verbose') {
      core.info(chalk.white(message))
    }
  }
}

/**
 * Promise based delay
 * @param time
 */
export const delay = async (time = DELAY): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, time))

/**
 * Convert fileNames to versions
 * @example
 * filenameToVersion("1.js") // "1"
 * filenameToVersion("1.0.1.js") // "1.0.1"
 */
export const filenameToVersion = (file: string): string =>
  file.replace(/\.js$/, '').replace(/_/g, '.')

/**
 * Convert versions to filenames
 * @example
 * versionToFilename("1") // "1.js"
 * versionToFilename("1.0.1") // "1.0.1.js"
 */
export const versionToFilename = (version: string): string =>
  `${version.replace(/\\./g, '_')}.js`

/**
 * Convert a branchName to a valid environmentName
 * @param branchName
 */
export const branchNameToEnvironmentName = (branchName: string): string =>
  branchName.replace(/[_./]/g, '-')

export enum Matcher {
  YY = 'YY',
  YYYY = 'YYYY',
  MM = 'MM',
  DD = 'DD',
  hh = 'hh',
  mm = 'mm',
  ss = 'ss',
  branch = 'branch'
}

export const matchers = {
  [Matcher.ss]: (date: Date): string =>
    `${date.getUTCSeconds()}`.padStart(2, '0'),
  [Matcher.hh]: (date: Date): string =>
    `${date.getUTCHours()}`.padStart(2, '0'),
  [Matcher.mm]: (date: Date): string =>
    `${date.getUTCMinutes()}`.padStart(2, '0'),
  [Matcher.YYYY]: (date: Date): string => `${date.getUTCFullYear()}`,
  [Matcher.YY]: (date: Date): string => `${date.getUTCFullYear()}`.substr(2, 2),
  [Matcher.MM]: (date: Date): string =>
    `${date.getUTCMonth() + 1}`.padStart(2, '0'),
  [Matcher.DD]: (date: Date): string => `${date.getDate()}`.padStart(2, '0'),
  [Matcher.branch]: (branchName: string): string =>
    branchNameToEnvironmentName(branchName)
}

/**
 *
 * @param pattern
 * @param branchName
 */
export const getNameFromPattern = (
  pattern: string,
  {branchName}: NameFromPatternArgs = {}
): string => {
  const date = new Date()
  return pattern.replace(
    /\[(YYYY|YY|MM|DD|hh|mm|ss|branch)]/g,
    (substring, match: Matcher) => {
      switch (match) {
        case Matcher.branch:
          if (!branchName) {
            return substring
          }
          return matchers[Matcher.branch](branchName)
        case Matcher.YYYY:
        case Matcher.YY:
        case Matcher.MM:
        case Matcher.DD:
        case Matcher.hh:
        case Matcher.mm:
        case Matcher.ss:
          return matchers[match](date)
        default:
          return substring
      }
    }
  )
}

/**
 * Get the branchNames based on the eventName
 */
export const getBranchNames = (): BranchNames => {
  const {eventName, payload} = github.context
  const defaultBranch: string = payload.default_branch

  Logger.verbose(`Getting branch names for "${eventName}"`)

  if (!payload.pull_request) {
    throw new Error('No pull request found')
  }

  // Check the name of the event
  switch (eventName) {
    // If it is a Pull request we return the head and base ref
    case EventNames.pullRequest:
      return {
        headRef: payload.pull_request.head.ref,
        baseRef: payload.pull_request.base.ref,
        defaultBranch
      }
    // If is not a Pull request we need work on the baseRef therefore head is null
    default:
      return {
        headRef: null,
        baseRef: payload.ref.replace(/^refs\/heads\//, ''),
        defaultBranch
      }
  }
}

/**
 * Get the environment from a space
 * Checks if an environment already exists and then flushes it
 * @param space
 * @param branchNames
 */
export const getEnvironment = async (
  space: Space,
  branchNames: BranchNames
): Promise<EnvironmentProps | void> => {
  const environmentNames = {
    base: branchNameToEnvironmentName(branchNames.baseRef),
    head: branchNames.headRef
      ? branchNameToEnvironmentName(branchNames.headRef)
      : null
  }

  Logger.verbose(
    `MASTER_PATTERN: ${MASTER_PATTERN} | FEATURE_PATTERN: ${FEATURE_PATTERN}`
  )

  // If the baseRef is the same as the default branch then we presume we are going to create a master environment
  // for the given master_pattern
  let environmentType: EnvironmentType =
    branchNames.baseRef === branchNames.defaultBranch
      ? CONTENTFUL_ALIAS
      : 'feature'

  // If a headRef exists implying it is a Pull request then set type to feature to
  // create a environment name for the given feature_pattern
  if (
    environmentNames.head !== null &&
    !github.context.payload.pull_request?.merged
  ) {
    environmentType = 'feature'
  }

  Logger.verbose(`Environment type: ${environmentType}`)

  let environmentId = ''

  if (environmentType === CONTENTFUL_ALIAS) {
    environmentId = getNameFromPattern(MASTER_PATTERN)
  } else if (environmentType === 'feature' && branchNames.headRef) {
    environmentId = getNameFromPattern(FEATURE_PATTERN, {
      branchName: branchNames.headRef
    })
  }

  if (!environmentId || environmentId === '') {
    throw Error('No environment id could be created')
  }

  Logger.verbose(`Environment id: "${environmentId}"`)

  // If environment matches ${CONTENTFUL_ALIAS} ("master")
  // Then return it without further actions
  if (environmentType === CONTENTFUL_ALIAS) {
    return {
      environmentType,
      environmentNames,
      environmentId,
      environment: await space.createEnvironmentWithId(environmentId, {
        name: environmentId
      })
    }
  }
  // Else we need to check for an existing environment and flush it
  Logger.log(
    `Checking for existing versions of environment: "${environmentId}"`
  )

  try {
    // Fetch environment with the given environmentId
    const environment = await space.getEnvironment(environmentId)
    // If it exists delete it
    await environment?.delete()
    Logger.success(`Environment deleted: "${environmentId}"`)
  } catch (e) {
    Logger.log(`Environment not found: "${environmentId}"`)
  }

  try {
    Logger.log(`Creating environment ${environmentId}`)

    const newEnv = await space.createEnvironmentWithId(environmentId, {
      name: environmentId
    })

    Logger.success(`New environment created: "${environmentId}"`)

    return {
      environmentType,
      environmentNames,
      environmentId,
      environment: newEnv
    }
  } catch (error) {
    Logger.error(
      `Failed creating new environment with environmentId: "${environmentId}"`
    )
    if (error instanceof Error) {
      throw new Error(error.message)
    }
  }
}
