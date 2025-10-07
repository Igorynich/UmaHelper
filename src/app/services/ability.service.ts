import { Injectable, signal } from '@angular/core';
import { AppAbility, defineAbilitiesFor } from '../ability';

@Injectable({
  providedIn: 'root'
})
export class AbilityService {
  ability = signal(defineAbilitiesFor('member')); // Default to member role

  updateAbilities(role: string) {
    this.ability.set(defineAbilitiesFor(role));
  }
}
