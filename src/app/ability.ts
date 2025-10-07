import { PureAbility, AbilityBuilder, AbilityClass, InferSubjects } from '@casl/ability';

export type Subjects = InferSubjects<'Article' | 'all'>;

export type AppAbility = PureAbility<[string, Subjects]>;

export const AppAbility = PureAbility as AbilityClass<AppAbility>;

export function defineAbilitiesFor(role: string) {
  const { can, cannot, build } = new AbilityBuilder(AppAbility);

  if (role === 'admin') {
    can('manage', 'all'); // Admins can do anything
  } else {
    can('read', 'all'); // Members can read everything
    cannot('create', 'Article');
    cannot('update', 'Article');
    cannot('delete', 'Article');
  }

  return build();
}
