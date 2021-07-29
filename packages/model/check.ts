import td from 'testdouble';
import createContainer from '@grown/bud';
import type { Repository } from '@grown/model';
import type Provider from '~/models/provider';
import mayBe from '~/models/Example/classMethods/mayBe';
import type { default as Models, Example, UserInstance, ExampleInstance, ExampleResource } from '~/models';

import { Token, accessType } from '~/models';
const t: Partial<Token> = {
  type: accessType.INVITATION,
};
console.log(t.type === 'INVITATION');

const Grown = createContainer();

async function main() {
  const repo = Grown.use<Repository<Models>>(require('./tests/fixtures/models'));
  const Example: ExampleResource = repo.get('Example');
  const ex = Example.getSchema<Example>().fakeOne();

  console.log(typeof ex.value === 'string');
  console.log(Example.classMethods.callMe() === 42);

  const data = { value: 42 };
  if (Example.getSchema<Example>().validate(data)) {
    console.log(typeof data.value === 'string');
  }

  const db = await repo.connect();
  await repo.sync({ force: true });

  const fixed = db.resource<ExampleInstance>('Example');
  const [f] = await fixed.actions.create({});
  console.log(f.get());

  const User = repo.get<UserInstance>('User');
  const Ex = repo.get<ExampleInstance>('Example');
  const u = await User.create({ email: 'a@b.c' });
  const count = await User.count();

  const someStuff = td.func('someStuff');
  const ExampleMock = { build: () => ({ someStuff }) };
  const deps = { User: { name: 'OSOM' }, Example: ExampleMock };
  const fn = mayBe(deps as Provider);
  console.log(fn() === 'OSOM');
  console.log(td.explain(someStuff).callCount === 1);

  Example.instanceMethods.someStuff();
  const e = Ex.build();
  e.someStuff();

  console.log(typeof u.email === 'string');
  console.log(count && Ex.name === 'Example');
  repo.disconnect();

  const name = Example.classMethods.mayBe(42);
  console.log(name === User.name);
}
main().catch(console.error);