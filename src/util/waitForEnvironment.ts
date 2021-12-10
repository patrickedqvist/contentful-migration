import { Environment, Space } from 'contentful-management';
import { DELAY } from '../env';
import wait from './delay'
import Logger from './logger';

async function waitForEnvironment({
  space,
  environment,
  maxTries,
  delay,
}: {
  space: Space;
  environment: Environment;
  maxTries: number;
  delay: number;
}): Promise<void> {
  let count = 0;
  while (count < maxTries) {
    Logger.debug('Checking environment status... attempt #' + count);

    const env = await space.getEnvironment(environment.sys.id);
    const status = env.sys.status.sys.id;

    Logger.debug(`Environment status: ${status}`);

    if (status === 'ready') {
      Logger.success('Successfully processed new environment');
      return;
    } else if (status === 'failed') {
      Logger.warn('Environment creation failed');
      return;
    }

    await wait(delay);
    count++;
  }
  throw Error('Waiting for environment status timed out');
}

export default waitForEnvironment;