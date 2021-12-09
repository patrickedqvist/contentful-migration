import process from 'node:process'
import path from 'path';
import { getInput, getBooleanInput } from '@actions/core';
import { getInputOr, getBooleanOr } from './util/inputs';

// Default values
const DEFAULT_MASTER_PATTERN = 'master-[YYYY]-[MM]-[DD]-[mm][ss]';
const DEFAULT_FEATURE_PATTERN = 'GH-[branch]';
const DEFAULT_VERSION_CONTENT_TYPE = 'versionTracking';
const DEFAULT_VERSION_FIELD = 'version';
const DEFAULT_DELETE_FEATURE = false;
const DEFAULT_SET_ALIAS = false;
const DEFAULT_MIGRATIONS_DIR = 'migrations';

/**
 * Inputs from the github action workflow
 */

// Required
const spaceId = getInput('spaceId', { required: true });
const managementApiKey = getInput('management_api_key', { required: true });

// Optionals
const versionContentType = getInput('version_content_type', { required: false });
const versionField = getInput('version_field', { required: false });
const masterPattern = getInput('master_pattern', { required: false });
const featurePattern = getInput('feature_pattern', { required: false });
const deleteFeature = getBooleanInput('delete_feature', { required: false });
const setAlias = getBooleanInput('set_alias', { required: false });
const migrationsDir = getInput('migrations_dir', { required: false });

// Environment variables
export const SPACE_ID = spaceId;
export const MANAGEMENT_API_KEY = managementApiKey;
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
