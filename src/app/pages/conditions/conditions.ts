import { Component, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './conditions.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './conditions.css',
})
export class ConditionsComponent {}

