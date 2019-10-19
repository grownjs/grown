import { oneOf } from 'bdd-tc/matchers';

import Users from '../db/integration_fixtures/users';

export const adminUser = oneOf(Users, 'email', 'admin@email.com');
