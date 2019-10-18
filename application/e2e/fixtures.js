import Users from '../db/integration_fixtures/users';

function findOne(dataset, field, val) {
  return dataset.find(x => x[field] === val);
}

export const adminUser = findOne(Users, 'email', 'admin@email.com');
