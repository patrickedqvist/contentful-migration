import * as core from '@actions/core'
import {MANAGEMENT_API_KEY, SPACE_ID} from './constants'
import {Logger} from './utils'
import {createClient} from 'contentful-management'
import {runAction} from './action'

async function run(): Promise<void> {
  try {
    const client = createClient({
      accessToken: MANAGEMENT_API_KEY
    })
    const space = await client.getSpace(SPACE_ID)
    await runAction(space)
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(error.message)
      core.setFailed(error.message)
    }
  }
}

run()
