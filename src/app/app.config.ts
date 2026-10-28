import { provideHttpClient, withXhr } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { routes } from './app.routes';
import { FIREBASE_CONFIG } from './firebase.config';
import { IMAGEKIT_CONFIG } from './imagekit.config';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { provideServiceWorker } from '@angular/service-worker';
import { provideImageKit } from '@imagekit/angular';
import { Ability } from '@casl/ability';
import { AppAbility, defineAbilitiesFor } from './ability';
import { Role } from './interfaces/role.enum';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withXhr()),
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(FIREBASE_CONFIG)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    { provide: Ability, useFactory: () => defineAbilitiesFor(Role.Member) },
    { provide: AppAbility, useExisting: Ability },
    importProvidersFrom(
      MatPaginatorModule,
      MatCardModule,
      MatButtonModule,
      MatDialogModule,
      MatSnackBarModule,
      MatIconModule,
    ),
    provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
    provideImageKit(IMAGEKIT_CONFIG)
  ]
};
