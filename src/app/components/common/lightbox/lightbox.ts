import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgpDialogManager, NgpDialogConfig } from 'ng-primitives/dialog';
import { LightboxContent } from './lightbox-content';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule
  ],
  templateUrl: './lightbox.html',
  styleUrls: ['./lightbox.scss']
})
export class Lightbox {
  imageUrl = input.required<string>();

  private dialogManager = inject(NgpDialogManager);

  open() {
    const config: NgpDialogConfig<{ imageUrl: string }> = {
      data: { imageUrl: this.imageUrl() }
    };
    this.dialogManager.open(LightboxContent, config);
  }
}
