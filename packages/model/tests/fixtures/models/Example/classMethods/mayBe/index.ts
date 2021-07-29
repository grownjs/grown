import type DI from '~/models/provider';

/**
MAYBE
*/
declare function mayBe(x?: number): string;
export type { mayBe };

/**
FIXME
*/
export default ({ User, Example }: DI): typeof mayBe => function mayBe() {
  const e = Example.build();
  e.someStuff();
  return User.name;
};
