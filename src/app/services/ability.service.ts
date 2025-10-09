import { Injectable, signal } from '@angular/core';
import { defineAbilitiesFor } from '../ability';
import { AbilityAction, AbilitySubject } from '../interfaces/ability';
import { Role } from '../interfaces/role.enum';

@Injectable({
  providedIn: 'root'
})
export class AbilityService {
  ability = signal(defineAbilitiesFor(Role.Member)); // Default to member role
  AbilityAction = AbilityAction;
  AbilitySubject = AbilitySubject;

  updateAbilities(role: Role) {
    this.ability.set(defineAbilitiesFor(role));
  }
}