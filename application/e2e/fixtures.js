import { oneOf } from 'bdd-tc/matchers';

import $ from '../apps/default/db/integration_fixtures';

export const adminUser = oneOf($.users, 'email', 'admin@email.com');
