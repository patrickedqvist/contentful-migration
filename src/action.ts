import * as core from '@actions/core';
import * as github from '@actions/github';
import { runMigration } from 'contentful-migration';
import { readdir } from 'fs';
import path from 'path';
import { promisify } from 'util';
import toSemver from 'to-semver';
import type { Space } from 'contentful-management/dist/typings/entities/space';

import {
  CONTENTFUL_ALIAS,
  MIGRATIONS_DIR,
  VERSION_CONTENT_TYPE,
  VERSION_FIELD,
  SPACE_ID,
  MANAGEMENT_API_KEY,
  SET_ALIAS,
  DELETE_FEATURE,
  FEATURE_PATTERN,
  DELAY,
  MAX_NUMBER_OF_TRIES,
} from './env';
import { getBranchNames, getOrCreateEnvironment } from './github';
import { filenameToVersion, versionToFilename, getNameFromPattern } from './util/names';
import delay from './util/delay';
import Logger from './util/logger';
import waitForEnvironment from './util/waitForEnvironment';

export const readdirAsync = promisify(readdir);

/**
 * Run the action
 * @param space
 */
export const runAction = async (space: Space): Promise<void> => {
  // Get base and if a pull request also the head ref
  const branchNames = getBranchNames();

  Logger.debug(`Branch names for getting environment ${JSON.stringify(branchNames)}`);

  const { environmentId, environment, environmentType } = await getOrCreateEnvironment(space, branchNames);

  Logger.info('Waiting for environment processing...');

  const wait = parseInt(DELAY, 10);
  const maxTries = parseInt(MAX_NUMBER_OF_TRIES, 10);
  await waitForEnvironment({
    space, 
    environment,
    delay: wait, 
    maxTries
  });

  Logger.debug('Update API Keys to allow access to new environment');
  const newEnv = {
    sys: {
      type: 'Link',
      linkType: 'Environment',
      id: environmentId,
    },
  };

  const { items: keys } = await space.getApiKeys();
  await Promise.all(
    keys.map((key) => {
      Logger.debug(`Adding new environment to api key: "${key.sys.id}"`);
      key.environments.push(newEnv);
      return key.update();
    })
  );

  Logger.debug('Get default locale for new environment');
  const env = await space.getEnvironment(environment.sys.id);
  const locales = await env.getLocales();
  const defaultLocale = locales.items.find((locale) => locale.default);
  const defaultLocaleCode = defaultLocale.code;
  Logger.debug(`Default locale: "${defaultLocaleCode}"`);

  Logger.debug('Read all the available migrations from the file system');
  // Check for available migrations
  // Migration scripts need to be sorted in order to run without conflicts
  const migrationFiles = await readdirAsync(MIGRATIONS_DIR);
  const availableMigrations = toSemver(
    migrationFiles.map((file) => filenameToVersion(file)),
    { clean: false }
  ).reverse();

  Logger.debug(`versionOrder: ${JSON.stringify(availableMigrations, null, 4)}`);

  Logger.debug('Find current version of the contentful space');
  const { items: versions } = await environment.getEntries({
    content_type: VERSION_CONTENT_TYPE,
  });

  // If there is no entry or more than one of CONTENTFUL_VERSION_TRACKING
  // Then throw an Error and abort
  if (versions.length === 0) {
    throw new Error(`Error occured, no entry of type "${VERSION_CONTENT_TYPE}" was found`);
  } else if (versions.length > 1) {
    throw new Error(`There should only be one entry of type "${VERSION_CONTENT_TYPE}"`);
  }

  const [storedVersionEntry] = versions;
  const currentVersionString = storedVersionEntry.fields[VERSION_FIELD][defaultLocaleCode];

  Logger.debug('Evaluate which migrations to run');
  const currentMigrationIndex = availableMigrations.indexOf(currentVersionString);

  // If the migration can't be found
  // Then abort
  if (currentMigrationIndex === -1) {
    throw new Error(`Version ${currentVersionString} is not matching with any known migration`);
  }

  const migrationsToRun = availableMigrations.slice(currentMigrationIndex + 1);

  const migrationOptions = {
    spaceId: SPACE_ID,
    environmentId,
    accessToken: MANAGEMENT_API_KEY,
    yes: true,
  };

  Logger.debug('Run migrations and update version entry');

  // Allow mutations
  let migrationToRun;
  let mutableStoredVersionEntry = storedVersionEntry;
  while ((migrationToRun = migrationsToRun.shift())) {
    const filePath = path.join(MIGRATIONS_DIR, versionToFilename(migrationToRun));
    
    Logger.debug(`Running ${filePath}`);

    await runMigration(
      Object.assign(migrationOptions, {
        filePath,
      })
    );

    Logger.success(`Migration script ${migrationToRun}.js succeeded`);

    mutableStoredVersionEntry.fields.version[defaultLocaleCode] = migrationToRun;
    mutableStoredVersionEntry = await mutableStoredVersionEntry.update();
    mutableStoredVersionEntry = await mutableStoredVersionEntry.publish();

    Logger.success(`Updated field ${VERSION_FIELD} in ${VERSION_CONTENT_TYPE} entry to ${migrationToRun}`);
  }

  Logger.info(`Checking if we need to update ${CONTENTFUL_ALIAS} alias`);
  // If the environmentType is ${CONTENTFUL_ALIAS} ("master")
  // Then set the alias to the new environment
  // Else inform the user

  if (environmentType === CONTENTFUL_ALIAS && SET_ALIAS) {
    Logger.info(`Running on ${CONTENTFUL_ALIAS}.`);
    Logger.info(`Updating ${CONTENTFUL_ALIAS} alias.`);
    await space
      .getEnvironmentAlias(CONTENTFUL_ALIAS)
      .then((alias) => {
        alias.environment.sys.id = environmentId;
        return alias.update();
      })
      .then((alias) => Logger.success(`alias ${alias.sys.id} updated.`))
      .catch((error) => {
        if ( error instanceof Error) {
          Logger.error(error.message)
        }
      });
  } else {
    Logger.debug('Running on feature branch');
    Logger.debug('No alias changes required');
  }

  // If the sandbox environment should be deleted (DELETE_FUTURE = true)
  // And the baseRef is the repository default_branch (master|main ...)
  // And the Pull Request has been merged
  // Then delete the sandbox environment
  if (
    DELETE_FEATURE &&
    branchNames.baseRef === branchNames.defaultBranch &&
    github.context.payload.pull_request?.merged
  ) {
    try {
      const environmentIdToDelete = getNameFromPattern(FEATURE_PATTERN, {
        branchName: branchNames.headRef,
      });
      Logger.info(`Delete the environment: ${environmentIdToDelete}`);
      const environment = await space.getEnvironment(environmentIdToDelete);
      await environment?.delete();
      Logger.success(`Deleted the environment: ${environmentIdToDelete}`);
    } catch (error) {
      Logger.error('Cannot delete the environment');
    }
  }

  // Set the outputs for further actions
  core.setOutput('environment_url', `https://app.contentful.com/spaces/${space.sys.id}/environments/${environmentId}`);
  core.setOutput('environment_name', environmentId);
  Logger.success('🚀 All done 🚀');
};
