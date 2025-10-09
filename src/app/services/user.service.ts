import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(Injector);

  getUser(id: string): Observable<User | undefined> {
    return runInInjectionContext(this.injector, () => {
      const userDoc = doc(this.firestore, `users/${id}`);
      return docData(userDoc, { idField: 'uid' }) as Observable<User | undefined>;
    });
  }
}
