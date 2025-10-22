import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-conditions-page',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './conditions-page.component.html',
  styleUrl: './conditions-page.component.css',
})
export class ConditionsPageComponent {}

