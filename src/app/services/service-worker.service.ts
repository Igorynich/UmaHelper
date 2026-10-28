import {ApplicationRef, inject, Injectable} from '@angular/core';
import {SwUpdate, VersionReadyEvent} from '@angular/service-worker';
import {concat, first, interval} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ServiceWorkerService {

  private appRef = inject(ApplicationRef);
  private swUpdate = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);

  constructor() {
    if (this.swUpdate.isEnabled) {
      const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable));
      const everySixHours$ = interval(6 * 60 * 60 * 1000);
      const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

      everySixHoursOnceAppIsStable$.subscribe(async () => {
        try {
          const updateFound = await this.swUpdate.checkForUpdate();
          console.log(updateFound ? 'A new version is available.' : 'Already on the latest version.');
          if (updateFound) {
            const snackBarRef = this.snackBar.open(`New Version Available`, 'Update', {
              // panelClass: ['snackbar-error'],
              duration: 0,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
            snackBarRef.onAction().pipe(first()).subscribe(() => {
              this.activateAndReload();
            });
          }
        } catch (err) {
          console.error('Failed to check for updates:', err);
        }
      });

      /*this.swUpdate.versionUpdates.subscribe((evt) => {
        switch (evt.type) {
          case 'VERSION_DETECTED':
            console.log(`Downloading new app version: ${evt.version.hash}`);
            break;
          case 'VERSION_READY':
            console.log(`Current app version: ${evt.currentVersion.hash}`);
            console.log(`New app version ready for use: ${evt.latestVersion.hash}`);
            break;
          case 'VERSION_INSTALLATION_FAILED':
            console.log(`Failed to install app version '${evt.version.hash}': ${evt.error}`);
            break;
        }
      });*/
    }
  }

  private activateAndReload() {
    this.swUpdate.activateUpdate().then(() => {
      document.location.reload();
    });
  }
}
