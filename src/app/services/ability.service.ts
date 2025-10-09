import { Injectable, signal } from '@angular/core';
import { defineAbilitiesFor } from '../ability';
import { AbilityAction, AbilitySubject } from '../interfaces/ability';

@Injectable({
  providedIn: 'root'
})
export class AbilityService {
  ability = signal(defineAbilitiesFor('member')); // Default to member role
  AbilityAction = AbilityAction;
  AbilitySubject = AbilitySubject;

  updateAbilities(role: string) {
    this.ability.set(defineAbilitiesFor(role));
  }
}
