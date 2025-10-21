import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { User } from '../interfaces/user';
import { SpinnerService } from './spinner';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(Injector);
  private spinnerService = inject(SpinnerService);

  getUser(id: string): Observable<User | undefined> {
    this.spinnerService.show();
    return runInInjectionContext(this.injector, () => {
      const userDoc = doc(this.firestore, `users/${id}`);
      return (docData(userDoc, { idField: 'uid' }) as Observable<User | undefined>).pipe(
        tap(() => this.spinnerService.hide())
      );
    });
  }
}
