import { AbilityBuilder, AbilityClass, PureAbility } from '@casl/ability';
import {
  AbilityAction,
  AbilitySubject,
  AppAbility as AppAbilityType,
} from './interfaces/ability';

export const AppAbility = PureAbility as AbilityClass<AppAbilityType>;

export function defineAbilitiesFor(role: string) {
  const { can, cannot, build } = new AbilityBuilder(AppAbility);

  if (role === 'admin') {
    can(AbilityAction.Manage, AbilitySubject.All); // Admins can do anything
  } else {
    can(AbilityAction.Read, AbilitySubject.All); // Members can read everything
    cannot(AbilityAction.Create, AbilitySubject.Article);
    cannot(AbilityAction.Update, AbilitySubject.Article);
    cannot(AbilityAction.Delete, AbilitySubject.Article);
  }

  return build();
}
