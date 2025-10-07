import { Component, inject, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { NgStyle } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { filter } from 'rxjs';

interface Chibi {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-header',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    NgStyle
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  protected authService = inject(AuthService);
  private router = inject(Router);

  private chibis: Chibi[] = [
    // TODO: Replace with actual coordinates and dimensions
    { x: 50, y: 30, width: 100, height: 135 },
    { x: 135, y: 30, width: 100, height: 135 },
    { x: 25, y: 0, width: 12.5, height: 12.5 },
    { x: 37.5, y: 0, width: 12.5, height: 12.5 },
    { x: 50, y: 0, width: 12.5, height: 12.5 },
    { x: 62.5, y: 0, width: 12.5, height: 12.5 },
    { x: 75, y: 0, width: 12.5, height: 12.5 },
    { x: 87.5, y: 0, width: 12.5, height: 12.5 },
    { x: 100, y: 0, width: 12.5, height: 12.5 },
    { x: 112.5, y: 0, width: 12.5, height: 12.5 },
    { x: 125, y: 0, width: 12.5, height: 12.5 },
  ];

  currentChibi = signal<Chibi>(this.chibis[0]);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      // const randomIndex = Math.floor(Math.random() * this.chibis.length);
      const randomIndex = 1;
      this.currentChibi.set(this.chibis[randomIndex]);
    });
  }
}
