import { InferSubjects, PureAbility } from '@casl/ability';

export enum AbilityAction {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export enum AbilitySubject {
  All = 'all',
  Article = 'Article',
}

export type Subjects = InferSubjects<AbilitySubject> | 'all';

export type AppAbility = PureAbility<[AbilityAction, Subjects]>;
