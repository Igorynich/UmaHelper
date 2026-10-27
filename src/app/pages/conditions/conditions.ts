import { Component } from '@angular/core';

import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './conditions.html',
  styleUrl: './conditions.css',
})
export class ConditionsComponent {}

