import { Injectable, inject } from '@angular/core';
import { Auth, authState, signInWithPopup, signOut, GoogleAuthProvider } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  readonly user$ = authState(this.auth);

  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logout() {
    return signOut(this.auth);
  }
}
