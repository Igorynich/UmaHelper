import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './under-construction.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './under-construction.css'
})
export class UnderConstruction {

}
