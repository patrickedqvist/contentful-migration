import * as github from '@actions/github';
import { PullRequest, PullRequestEvent, PushEvent } from '@octokit/webhooks-definitions/schema';

import type { Space } from 'contentful-management/dist/typings/entities/space';
import { MASTER_PATTERN, FEATURE_PATTERN, CONTENTFUL_ALIAS } from './env';
import { BranchNames, EnvironmentProps, EnvironmentType, EventNames } from './types';
import { branchNameToEnvironmentName, getNameFromPattern } from './util/names';
import Logger from './util/logger';

/**
 * Get the branchNames based on the eventName
 */
export const getBranchNames = (): BranchNames => {
  Logger.debug(`Getting branch names for "${github.context.eventName}"`);

  // Check the name of the event
  switch (github.context.eventName) {
    // If it is a Pull request we return the head and base ref
    case EventNames.pullRequest:
      const pullRequestPayload = github.context.payload as PullRequestEvent
      return {
        headRef: pullRequestPayload.pull_request.head.ref,
        baseRef: pullRequestPayload.pull_request.base.ref,
        defaultBranch: pullRequestPayload.repository.default_branch,
      };
    // If is not a Pull request we need work on the baseRef therefore head is null
    default:
      const payload = github.context.payload as PushEvent
      return {
        headRef: null,
        baseRef: payload.ref.replace(/^refs\/heads\//, ''),
        defaultBranch: payload.repository.default_branch,
      };
  }
};


/**
 * Get the environment from a space
 * Checks if an environment already exists and then flushes it
 * @param space
 * @param branchNames
 */
export const getOrCreateEnvironment = async (
  space: Space,
  branchNames: BranchNames
): Promise<EnvironmentProps> => {
  const environmentNames = {
    base: branchNameToEnvironmentName(branchNames.baseRef),
    head: branchNames.headRef ? branchNameToEnvironmentName(branchNames.headRef) : null,
  };

  Logger.debug(`MASTER_PATTERN: ${MASTER_PATTERN} | FEATURE_PATTERN: ${FEATURE_PATTERN}`);

  // Set type of environment
  let environmentType: EnvironmentType | string = 'feature';
  
  // If the baseRef is the same as the default branch then we presume we are going to create a master environment
  // for the given master_pattern
  if (branchNames.baseRef === branchNames.defaultBranch) {
    environmentType = CONTENTFUL_ALIAS;
  }

  // If a headRef exists implying it is a Pull request then set type to "feature" to
  // create a environment name for the given feature_pattern
  if (environmentNames.head !== null && !github.context.payload.pull_request?.merged) {
    environmentType = 'feature';
  }

  Logger.debug(`Environment type is set to: ${environmentType}`);

  let environmentId: string;

  if (environmentType === CONTENTFUL_ALIAS) {
    environmentId = getNameFromPattern(MASTER_PATTERN);
  } else if (environmentType === 'feature' && branchNames.headRef !== null) {
    environmentId = getNameFromPattern(FEATURE_PATTERN, {
      branchName: branchNames.headRef,
    });
  } else {
    throw Error('Could not determine environment type');
  }

  Logger.debug(`Environment id is set to: "${environmentId}"`);

  // If environment matches ${CONTENTFUL_ALIAS} ("master")
  // Then return it without further actions
  if (environmentType === CONTENTFUL_ALIAS) {
    return {
      environmentType: environmentType as EnvironmentType,
      environmentNames,
      environmentId,
      environment: await space.createEnvironmentWithId(environmentId, {
        name: environmentId,
      }),
    };
  }
  // Else we need to check for an existing environment and flush it
  Logger.info(`Checking for existing versions of environment: "${environmentId}"`);

  try {
    // Fetch environment with the given environmentId
    const environment = await space.getEnvironment(environmentId);
    // If it exists delete it
    await environment?.delete();
    Logger.success(`Environment deleted: "${environmentId}"`);
  } catch (e) {
    Logger.info(`Environment not found: "${environmentId}"`);
  }

  try {
    Logger.info(`Creating environment ${environmentId}`);

    const newEnv = await space.createEnvironmentWithId(environmentId, {
      name: environmentId,
    });

    Logger.success(`New environment created: "${environmentId}"`);

    return {
      environmentType: environmentType as EnvironmentType,
      environmentNames,
      environmentId,
      environment: newEnv,
    };
  } catch (e) {
    if (e instanceof Error) {
      Logger.error(`Failed creating new environment with environmentId: "${environmentId}"`);
      throw new Error(e.message);
    }
  }
};