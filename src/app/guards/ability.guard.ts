import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AbilityService } from '../services/ability.service';
import { AbilityAction, AbilitySubject } from '../interfaces/ability';

export const abilityGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const abilityService = inject(AbilityService);
  const router = inject(Router);

  const action = route.data['action'] as AbilityAction;
  const subject = route.data['subject'] as AbilitySubject;

  if (!action || !subject) {
    throw new Error('abilityGuard requires action and subject in route data');
  }

  const ability = abilityService.ability();
  if (ability.can(action, subject)) {
    return true;
  }

  return router.createUrlTree(['/news']);
};
