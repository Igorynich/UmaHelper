import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-new-tab-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule
  ],
  templateUrl: './new-tab-dialog.html',
})
export class NewTabDialogComponent {
  private dialogRef = inject(MatDialogRef<NewTabDialogComponent>);
  protected nameControl = new FormControl('', [Validators.required]);

  protected create(): void {
    if (this.nameControl.valid) {
      this.dialogRef.close(this.nameControl.value);
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
