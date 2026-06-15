import {inject, Injectable, Type} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';

export type DialogType = 'supportCardInfo' | 'skillInfo' | 'traineeInfo';

@Injectable({
  providedIn: 'root',
})
export class ModalControlService {

  private dialog = inject(MatDialog);

  private activeDialogs: MatDialogRef<any>[] = [];
  private registry= new Map<DialogType, Type<any>>();

  constructor() {
  }

  register(key: DialogType, component: Type<any>) {
    this.registry.set(key, component);
  }

  open(type: DialogType, config: MatDialogConfig) {
    const component = this.registry.get(type);
    if (!component) {
      throw new Error(`No component registered for type: ${type}`);
    }
    const dialogRef = this.dialog.open(component, config);
    this.activeDialogs.push(dialogRef);
  }

  closeLast() {
    if (this.activeDialogs.length > 0) {
      this.activeDialogs.pop()?.close();
    }
  }
}
