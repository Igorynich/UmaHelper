import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { injectDialogRef } from 'ng-primitives/dialog';

@Component({
  selector: 'app-lightbox-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule
  ],
  templateUrl: './lightbox-content.html',
  styleUrls: ['./lightbox-content.scss']
})
export class LightboxContent {
  dialogRef = injectDialogRef<{ imageUrl: string }>();
  imageUrl = this.dialogRef.data.imageUrl;
}
