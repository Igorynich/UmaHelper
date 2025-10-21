import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {UnderConstruction} from '../../components/common/under-construction/under-construction';

@Component({
  selector: 'app-under-construction-page',
  standalone: true,
  imports: [CommonModule, UnderConstruction],
  templateUrl: './under-construction-page.component.html',
  styleUrl: './under-construction-page.component.css',
})
export class UnderConstructionPageComponent {}
