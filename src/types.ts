import type {Environment} from 'contentful-management'

export enum EventNames {
  pullRequest = 'pull_request'
}

export interface BranchNames {
  headRef: null | string
  baseRef: string
  defaultBranch: string
}

export interface EnvironmentNames {
  base: string
  head: string | null
}

export type EnvironmentType = 'master' | 'feature'

export interface EnvironmentProps {
  environmentType: EnvironmentType
  environmentNames: EnvironmentNames
  environmentId: string
  environment: Environment
}

export interface NameFromPatternArgs {
  branchName?: string
}
