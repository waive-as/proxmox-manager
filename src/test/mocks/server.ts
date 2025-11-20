import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server for Node environment (used in tests)
 * This intercepts HTTP requests during tests and returns mocked responses
 */
export const server = setupServer(...handlers);
