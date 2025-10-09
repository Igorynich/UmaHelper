import { inject, Injectable, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, authState, GoogleAuthProvider, signInWithPopup, signOut } from '@angular/fire/auth';
import { doc, docData, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AbilityService } from './ability.service';
import { User } from '../interfaces/user';
import { Role } from '../interfaces/role.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private abilityService = inject(AbilityService);
  private router = inject(Router);

  private readonly user$: Observable<User | null> = authState(this.auth).pipe(
    switchMap(user => {
      if (user) {
        return docData(doc(this.firestore, 'users', user.uid)) as Observable<User>;
      } else {
        return of(null);
      }
    })
  );
  readonly user = toSignal(this.user$);

  constructor() {
    effect(() => {
      const user = this.user();
      const role = user ? user.role : Role.Member;
      this.abilityService.updateAbilities(role);
      console.log(`AuthService: User ${user ? user.email : 'logged out'}. Abilities updated to role: ${role}`);
    });
  }

  loginWithGoogle() {
    signInWithPopup(this.auth, new GoogleAuthProvider()).then(async userCredential => {
      const firebaseUser = userCredential.user;
      const userRef = doc(this.firestore, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        const newUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          role: Role.Member, // default role
        };
        await setDoc(userRef, newUser);
      }
    });
  }

  logout() {
    signOut(this.auth).then(() => {
      this.router.navigate(['/']);
    });
  }
}