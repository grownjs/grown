import td from 'testdouble';
import createContainer from '@grown/bud';
import type { Repository } from '@grown/model';
import type Provider from '~/models/provider';
import mayBe from '~/models/Example/classMethods/mayBe';
import type { default as Models, Example, UserModel, ExampleModel, ExampleResource } from '~/models';

import { Token, accessType } from '~/models';

const t: Partial<Token> = {
  type: accessType.INVITATION,
};
console.log(1, t.type === 'INVITATION');

const Grown = createContainer();

async function main() {
  const repo = await Grown.use<Repository<Models>>(import('~/models'));
  const Example: ExampleResource = repo.get('Example');
  const ex = Example.getSchema<Example>().fakeOne();

  console.log(2, typeof ex.value === 'string');
  console.log(3, Example.classMethods.callMe() === 42);

  const data = { value: 42 };
  try {
    if (Example.getSchema<Example>().validate(data)) {
      console.log(-1, typeof data.value === 'string');
    }
  } catch (e) {
    console.log(e);
  }

  const db = await repo.connect();
  await repo.sync({ force: true });

  const fixed = db.resource<ExampleModel>('Example');
  const [f] = await fixed.actions.create({});
  console.log(4, f.get());

  const User = repo.get<UserModel>('User');
  const Ex = repo.get<ExampleModel>('Example');
  const u = await User.create({ email: 'a@b.c' });
  const count = await User.count();

  const someStuff = td.func('someStuff');
  const ExampleMock = { build: () => ({ someStuff }) };
  const deps = { User: { name: 'OSOM' }, Example: ExampleMock };
  const fn = mayBe(deps as Provider);
  console.log(5, fn() === 'OSOM');
  console.log(6, td.explain(someStuff).callCount === 1);

  Example.instanceMethods.someStuff();
  const e = Ex.build();
  e.someStuff();

  console.log(7, typeof u.email === 'string');
  console.log(8, count && Ex.name === 'Example');
  repo.disconnect();

  const name = Example.classMethods.mayBe(42);
  console.log(9, name === User.name);
}
main().catch(console.error);
