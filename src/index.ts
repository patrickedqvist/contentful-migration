import Observable from 'zen-observable';

// @ts-expect-error add ZenObservable polyfill
global.Observable = Observable;
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('any-observable/register')('global.Observable');

import * as core from '@actions/core';
import { createClient } from 'contentful-management';
import { runAction } from './action';
import { MANAGEMENT_API_KEY, SPACE_ID } from './env';
import Logger from './util/logger';

async function main(): Promise<void> {
  try {
    const client = createClient({
      space: SPACE_ID,
      accessToken: MANAGEMENT_API_KEY,
    });
    const space = await client.getSpace(SPACE_ID);
    await runAction(space);
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(error.message);
      core.setFailed(error.message);
    }
  }
}

main();
