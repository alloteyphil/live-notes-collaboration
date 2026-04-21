export const RETRY_BASE_DELAY_MS = 1000;
export const RETRY_MAX_DELAY_MS = 15000;

export function getRetryDelayMs(attempt: number) {
  const exp = Math.max(attempt - 1, 0);
  return Math.min(RETRY_BASE_DELAY_MS * 2 ** exp, RETRY_MAX_DELAY_MS);
}
