import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-level',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './level.html',
  styleUrl: './level.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Level {
  minLevel = input(1);
  currentLevel = input.required<number>();
  maxLevel = input.required<number>();
  levelChange = output<number>();

  protected readonly availableLevels = computed(() => {
    const max = this.maxLevel();
    // Ensure levels don't go below minLevel, though minLevel is 1.
    return [max - 15, max - 10, max - 5, max];
  });

  protected readonly rectangleColors = computed(() => {
    const current = this.currentLevel();
    const levels = this.availableLevels();
    const colors: string[] = [];

    for (let i = 0; i < levels.length; i++) {
      if (current > levels[i] - 5) {
        colors.push('blue-rectangle');
      } else {
        colors.push('black-rectangle');
      }
    }
    return colors;
  });

  changeLevel(amount: number): void {
    let newLevel = this.currentLevel() + amount;
    newLevel = Math.max(this.minLevel(), Math.min(newLevel, this.maxLevel()));
    this.levelChange.emit(newLevel);
  }

  setLevel(index: number): void {
    let newLevel = this.availableLevels()[index];
    newLevel = Math.max(this.minLevel(), Math.min(newLevel, this.maxLevel()));
    this.levelChange.emit(newLevel);
  }
}
