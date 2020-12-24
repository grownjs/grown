import { oneOf } from 'bdd-tc/matchers';

import $ from '../app/default/db/integration_fixtures';

export const adminUser = oneOf($.users, 'email', 'admin@email.com');
