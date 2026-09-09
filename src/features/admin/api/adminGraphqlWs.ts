import { createGraphQLWsClient } from '../../../lib/graphqlWs';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

// Separate WS connection/singleton from the user-facing one in lib/graphqlWs.ts,
// authenticated with the admin token instead of the user token.
export const subscribeToAdminGraphQL = createGraphQLWsClient(() => localStorage.getItem(ADMIN_TOKEN_KEY)).subscribe;
