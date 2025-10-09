import { Injectable, inject, signal, effect } from '@angular/core';
import { Auth, authState, signInWithPopup, signOut, GoogleAuthProvider, User } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbilityService } from './ability.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private abilityService = inject(AbilityService);
  private router = inject(Router);

  readonly user = toSignal(authState(this.auth));

  constructor() {
    effect(() => {
      const user: User | null | undefined = this.user();
      // For demonstration, we'll assign a role. In a real app, you'd fetch this from Firebase custom claims or a user profile.
      const role = user ? 'admin' : 'member'; // Default to admin if logged in, member if logged out
      this.abilityService.updateAbilities(role);
      console.log(`AuthService: User ${user ? user.email : 'logged out'}. Abilities updated to role: ${role}`);
    });
  }

  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logout() {
    signOut(this.auth).then(() => {
      this.router.navigate(['/']);
    });
  }
}
