import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './conditions.html',
  styleUrl: './conditions.css',
})
export class ConditionsComponent {}

