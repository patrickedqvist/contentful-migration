import { getBooleanOr, getInputOr } from "../../src/util/inputs"

test('getBooleanOr should convert string to boolean', () => {
    const testValue = 'true'
    expect(getBooleanOr(testValue, false)).toBe(true)
});

test('getBooleanOr should return boolean as is', () => {
  const testValue = true;
  expect(getBooleanOr(testValue, false)).toBe(true);
});

test('getBooleanOr should use fallback value if input value is incorrect', () => {
  const testValue = 'abc';
  expect(getBooleanOr(testValue, true)).toBe(true);
});

test('getInputOr should return any truthy value', () => {
  const testValue = 'a_env_variable';
  expect(getInputOr(testValue, 'something_else')).toBe('a_env_variable');
});

test('getInputOr should use fallback value if input value is incorrect', () => {
  const testValue = null;
  expect(getInputOr(testValue, 'fallback_value')).toBe('fallback_value');
});