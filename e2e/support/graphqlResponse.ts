import type { Page } from '@playwright/test';

/** Wait for one named GraphQL operation and surface transport/GraphQL errors directly. */
export const waitForSuccessfulGraphQL = (page: Page, operationName: string, timeout = 10000) =>
  page.waitForResponse(async (response) => {
    if (!response.url().endsWith('/query') || response.request().method() !== 'POST') return false;

    const body = response.request().postDataJSON() as { operationName?: string; query?: string } | null;
    if (body?.operationName !== operationName && !body?.query?.includes(` ${operationName}(`)) return false;

    if (!response.ok()) {
      throw new Error(`${operationName} failed: HTTP ${response.status()} ${await response.text()}`);
    }
    const result = await response.json() as { errors?: Array<{ message: string }> };
    if (result.errors?.length) {
      throw new Error(`${operationName} failed: ${result.errors.map(({ message }) => message).join(', ')}`);
    }
    return true;
  }, { timeout });
