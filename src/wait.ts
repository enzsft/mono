/**
 * Returned promise will resolve after provided MS
 * @param ms
 */
export const wait = (ms: number): Promise<void> =>
  new Promise(
    (res: () => void): void => {
      setTimeout(res, ms);
    },
  );
