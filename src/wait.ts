/**
 * Returned promise will resolve after provided MS
 *
 * @param {number} ms Time to wait in milliseconds
 * @returns {Promise} Promise that resolves after the specified amount of time
 */
export const wait = (ms: number): Promise<void> =>
  new Promise(
    (res: () => void): void => {
      setTimeout(res, ms);
    },
  );
