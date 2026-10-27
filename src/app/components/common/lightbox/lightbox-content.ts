import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { injectDialogRef } from 'ng-primitives/dialog';

@Component({
  selector: 'app-lightbox-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './lightbox-content.html',
  styleUrls: ['./lightbox-content.scss']
})
export class LightboxContent {
  dialogRef = injectDialogRef<{ imageUrl: string }>();
  imageUrl = this.dialogRef.data.imageUrl;
}
