import path from 'path';
import { getInput, getBooleanInput } from '@actions/core';
import { getInputOr, getBooleanOr } from './util/inputs';

// Default values
const DEFAULT_CONTENTFUL_ALIAS = 'master';
const DEFAULT_MASTER_PATTERN = 'main-[YYYY]-[MM]-[DD]-[mm][ss]';
const DEFAULT_FEATURE_PATTERN = 'GH-[branch]';
const DEFAULT_VERSION_CONTENT_TYPE = 'versionTracking';
const DEFAULT_VERSION_FIELD = 'version';
const DEFAULT_DELETE_FEATURE = false;
const DEFAULT_SET_ALIAS = false;
const DEFAULT_MIGRATIONS_DIR = 'migrations';
const DEFAULT_VERBOSE = false;
const DEFAULT_DELAY = '5000';
const DEFAULT_MAX_NUMBER_OF_TRIES = '10';

/**
 * Inputs from the github action workflow
 */

// Required
const spaceId = getInput('space_id', { required: true });
const managementApiKey = getInput('management_api_key', { required: true });

// Optionals
const contentfulAlias = getInput('contentful_alias', { required: false });
const versionContentType = getInput('version_content_type', { required: false });
const versionField = getInput('version_field', { required: false });
const masterPattern = getInput('master_pattern', { required: false });
const featurePattern = getInput('feature_pattern', { required: false });
const deleteFeature = getBooleanInput('delete_feature', { required: false });
const setAlias = getBooleanInput('set_alias', { required: false });
const migrationsDir = getInput('migrations_dir', { required: false });
const verbose = getInput('verbose', { required: false });
const delay = getInput('delay', { required: false });
const maxNumberOfTries = getInput('max_number_of_tries', { required: false });

// Environment variables
export const SPACE_ID = spaceId;
export const MANAGEMENT_API_KEY = managementApiKey;
export const CONTENTFUL_ALIAS = getInputOr(contentfulAlias, DEFAULT_CONTENTFUL_ALIAS);
export const VERSION_CONTENT_TYPE = getInputOr(versionContentType, DEFAULT_VERSION_CONTENT_TYPE);
export const VERSION_FIELD = getInputOr(versionField, DEFAULT_VERSION_FIELD);
export const MASTER_PATTERN = getInputOr(masterPattern, DEFAULT_MASTER_PATTERN);
export const FEATURE_PATTERN = getInputOr(featurePattern, DEFAULT_FEATURE_PATTERN);
export const DELETE_FEATURE = getBooleanOr(deleteFeature, DEFAULT_DELETE_FEATURE);
export const SET_ALIAS = getBooleanOr(setAlias, DEFAULT_SET_ALIAS);
export const MIGRATIONS_DIR = path.join(
  process.env.GITHUB_WORKSPACE,
  getInputOr(migrationsDir, DEFAULT_MIGRATIONS_DIR)
);
export const VERBOSE = getBooleanOr(verbose, DEFAULT_VERBOSE);
export const DELAY = getInputOr(delay, DEFAULT_DELAY);
export const MAX_NUMBER_OF_TRIES = getInputOr(maxNumberOfTries, DEFAULT_MAX_NUMBER_OF_TRIES);
