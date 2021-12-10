function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    if (isNaN(milliseconds)) {
      throw new Error('milliseconds not a number');
    }

    return setTimeout(resolve, milliseconds);
  });
}

export default delay;
