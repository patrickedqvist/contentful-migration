import { DELAY } from "../constants";

async function delay(milliseconds: number = DELAY): Promise<void> {
  return new Promise((resolve) => {
    if (isNaN(milliseconds)) {
      throw new Error('milliseconds not a number');
    }

    setTimeout(() => resolve(), milliseconds);
  });
}

export default delay;