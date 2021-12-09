import delay from '../../src/util/delay';

it('should throw if input is an invalid number', async () => {
  const input = parseInt('foo', 10);
  await expect(delay(input)).rejects.toThrow('milliseconds not a number');
});

it('should wait the specified time', async () => {
  const start = new Date();
  await delay(500);
  const end = new Date();
  var delta = Math.abs(end.getTime() - start.getTime());
  expect(delta).toBeGreaterThan(450);
});
