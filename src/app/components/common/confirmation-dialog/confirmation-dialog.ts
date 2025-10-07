import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.html',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule]
})
export class ConfirmationDialog {
  data: ConfirmationDialogData = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ConfirmationDialog>);
}
