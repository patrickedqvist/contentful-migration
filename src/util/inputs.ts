export const getBooleanOr = (input: string | boolean, fallback: boolean): boolean => {
  switch (input) {
    case 'true':
    case true:
      return true;
    case 'false':
    case false:
      return false;
    default:
      return fallback;
  }
};

export const getInputOr = (input: string, fallback: string): string => {
  if (input) {
    return input;
  }
  return fallback;
};
