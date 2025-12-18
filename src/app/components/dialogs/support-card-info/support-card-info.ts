import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Rarity } from '../../../interfaces/display-support-card';

@Component({
  selector: 'app-support-card-info',
  standalone: true,
  imports: [ MatDialogModule, MatIconModule ],
  templateUrl: './support-card-info.html',
  styleUrl: './support-card-info.css'
})
export class SupportCardInfo {
  protected readonly data: any = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SupportCardInfo>);
  protected readonly Rarity = Rarity;

  constructor() {
    const rarityClass = this.getRarityClass();
    if (rarityClass) {
      this.dialogRef.addPanelClass(rarityClass);
    }
  }

  private getRarityClass(): string {
    switch (this.data.rarity) {
      case Rarity.SSR:
        return 'rarity-ssr-dialog';
      case Rarity.SR:
        return 'rarity-sr-dialog';
      case Rarity.R:
        return 'rarity-r-dialog';
      default:
        return '';
    }
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
